// A small SQLite model layer. It gives every model the same handful of calls the controllers
// already use (find / findOne / findById / create / save / populate / sort / ...), so the
// controllers did not need to change. Each model is one SQLite table.
//
// Field types: 'string' | 'number' | 'integer' | 'boolean' | 'ref' (id of another model) | 'array'
// (stored as JSON text; elements are strings or refs).

const crypto = require('crypto');
const db = require('../config/db');

const registry = {};
const qi = (name) => `"${name}"`;

const idOf = (v) => (v && typeof v === 'object' && v._id !== undefined ? v._id : v);

// ---------- value normalising + validation ----------

const cleanScalar = (def, value) => {
  if (value === undefined || value === null) return value;
  switch (def.type) {
    case 'ref': return String(idOf(value));
    case 'number':
    case 'integer': return Number(value);
    case 'boolean': return Boolean(value);
    default: {
      let s = String(value);
      if (def.trim) s = s.trim();
      if (def.lowercase) s = s.toLowerCase();
      return s;
    }
  }
};

const cleanValue = (def, value) => {
  if (def.type === 'array') {
    const list = Array.isArray(value) ? value : [];
    return list.map((v) => cleanScalar({ type: def.of || 'string', trim: def.trim }, v));
  }
  return cleanScalar(def, value);
};

const validateField = (Model, name, def, value, errors) => {
  const empty = value === undefined || value === null || value === '';
  if (def.required && empty) {
    errors.push(`${name}: Path \`${name}\` is required.`);
    return;
  }
  if (empty) return;
  if (def.type === 'number' || def.type === 'integer') {
    if (Number.isNaN(value)) errors.push(`${name}: Cast to Number failed`);
    if (def.min !== undefined && value < def.min) errors.push(`${name}: Path \`${name}\` (${value}) is less than minimum allowed value (${def.min}).`);
    if (def.max !== undefined && value > def.max) errors.push(`${name}: Path \`${name}\` (${value}) is more than maximum allowed value (${def.max}).`);
  }
  if (def.type === 'string') {
    if (def.enum && !def.enum.includes(value)) errors.push(`${name}: \`${value}\` is not a valid enum value for path \`${name}\`.`);
    if (def.maxlength && value.length > def.maxlength) errors.push(`${name}: Path \`${name}\` is longer than the maximum allowed length (${def.maxlength}).`);
  }
  if (def.type === 'array' && def.enum) {
    value.forEach((v) => {
      if (!def.enum.includes(v)) errors.push(`${name}: \`${v}\` is not a valid enum value for path \`${name}\`.`);
    });
  }
};

// Returns the cleaned values for the fields to write. `onlyPresent` is used when saving an
// existing document that may have been loaded with some fields left out (e.g. no passwordHash).
const normalize = (Model, source, { onlyPresent = false } = {}) => {
  const out = {};
  const errors = [];
  Object.entries(Model.fields).forEach(([name, def]) => {
    let value = source[name];
    if (onlyPresent && !(name in source)) return;
    if (value === undefined && def.default !== undefined) {
      value = typeof def.default === 'function' ? def.default() : def.default;
      if (Array.isArray(value)) value = [...value];
    }
    if (value === undefined && def.type === 'array') value = [];
    value = cleanValue(def, value);
    validateField(Model, name, def, value, errors);
    out[name] = value;
  });
  if (errors.length) throw new Error(`${Model.modelName} validation failed: ${errors.join(', ')}`);
  return out;
};

const toColumn = (def, value) => {
  if (value === undefined || value === null) return null;
  if (def.type === 'array') return JSON.stringify(value);
  if (def.type === 'boolean') return value ? 1 : 0;
  return value;
};

// ---------- field selection + populate ----------

const applySelect = (docs, select) => {
  if (!select) return docs;
  const tokens = String(select).split(/\s+/).filter(Boolean);
  const exclude = tokens.filter((t) => t.startsWith('-')).map((t) => t.slice(1));
  const include = tokens.filter((t) => !t.startsWith('-'));
  docs.forEach((doc) => {
    Object.keys(doc).forEach((key) => {
      if (key === '_id') return;
      if (exclude.length ? exclude.includes(key) : !include.includes(key)) delete doc[key];
    });
  });
  return docs;
};

const populateDocs = async (Model, docs, populates) => {
  for (const { path, select } of populates) {
    const def = Model.fields[path];
    if (!def || (def.type !== 'ref' && !(def.type === 'array' && def.of === 'ref'))) continue;
    const RefModel = registry[def.ref];
    const isArray = def.type === 'array';

    const ids = new Set();
    docs.forEach((doc) => {
      (isArray ? doc[path] : [doc[path]]).forEach((v) => {
        if (v !== null && v !== undefined && typeof v !== 'object') ids.add(String(v));
      });
    });

    const found = ids.size ? await RefModel.find({ _id: { $in: [...ids] } }).select(select) : [];
    const byId = new Map(found.map((d) => [String(d._id), d]));

    docs.forEach((doc) => {
      if (isArray) {
        doc[path] = doc[path].map((v) => (typeof v === 'object' ? v : byId.get(String(v)))).filter(Boolean);
      } else if (doc[path] !== null && doc[path] !== undefined && typeof doc[path] !== 'object') {
        doc[path] = byId.get(String(doc[path])) || null;
      }
    });
  }
  return docs;
};

// ---------- filter -> SQL ----------

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

const buildWhere = (Model, filter = {}) => {
  const clauses = [];
  const params = [];

  Object.entries(filter).forEach(([key, cond]) => {
    const def = key === '_id' ? { type: 'string' } : Model.fields[key];
    if (!def) throw new Error(`Unknown field "${key}" in ${Model.modelName} query`);
    const col = qi(key);
    const isArray = def.type === 'array';
    const norm = (v) => {
      const cleaned = def.type === 'boolean' ? (v ? 1 : 0) : idOf(v);
      return def.type === 'ref' || isArray ? String(cleaned) : cleaned;
    };

    const isOperatorObject = cond && typeof cond === 'object' && !Array.isArray(cond)
      && Object.keys(cond).some((k) => k.startsWith('$'));

    if (!isOperatorObject) {
      if (cond === null || cond === undefined) clauses.push(`${col} IS NULL`);
      else if (isArray) { clauses.push(`EXISTS (SELECT 1 FROM json_each(${col}) WHERE value = ?)`); params.push(norm(cond)); }
      else { clauses.push(`${col} = ?`); params.push(norm(cond)); }
      return;
    }

    Object.entries(cond).forEach(([op, val]) => {
      switch (op) {
        case '$in': {
          if (!val.length) { clauses.push('0'); break; }
          const marks = val.map(() => '?').join(', ');
          if (isArray) clauses.push(`EXISTS (SELECT 1 FROM json_each(${col}) WHERE value IN (${marks}))`);
          else clauses.push(`${col} IN (${marks})`);
          params.push(...val.map(norm));
          break;
        }
        case '$gte': clauses.push(`${col} >= ?`); params.push(norm(val)); break;
        case '$gt': clauses.push(`${col} > ?`); params.push(norm(val)); break;
        case '$lte': clauses.push(`${col} <= ?`); params.push(norm(val)); break;
        case '$lt': clauses.push(`${col} < ?`); params.push(norm(val)); break;
        case '$ne': clauses.push(`${col} IS NOT ?`); params.push(norm(val)); break;
        case '$regex': clauses.push(`${col} LIKE ? ESCAPE '\\'`); params.push(`%${escapeLike(String(val))}%`); break;
        case '$options': break; // only 'i' is used - SQLite LIKE is already case-insensitive
        default: throw new Error(`Unsupported query operator ${op}`);
      }
    });
  });

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
};

// ---------- model factory ----------

const defineModel = ({ name, table, fields, indexes = [], methods = {}, statics = {} }) => {
  class Doc {
    constructor(data = {}, isNew = true) {
      Object.assign(this, data);
      Object.defineProperty(this, '$isNew', { value: isNew, writable: true, enumerable: false });
    }
  }
  const Model = Doc;
  const hidden = (target, props) => Object.entries(props).forEach(([k, v]) => {
    Object.defineProperty(target, k, { value: v, writable: true, configurable: true, enumerable: false });
  });

  hidden(Model, { modelName: name, table, fields });

  // ----- schema -----
  hidden(Model, {
    createTableSQL() {
      const sqlType = { string: 'TEXT', ref: 'TEXT', array: 'TEXT', number: 'REAL', integer: 'INTEGER', boolean: 'INTEGER' };
      const cols = ['"_id" TEXT PRIMARY KEY'];
      Object.entries(fields).forEach(([f, def]) => {
        cols.push(`${qi(f)} ${sqlType[def.type]}${def.required ? ' NOT NULL' : ''}${def.unique ? ' UNIQUE' : ''}`);
      });
      cols.push('"createdAt" TEXT', '"updatedAt" TEXT');
      const sql = [`CREATE TABLE IF NOT EXISTS ${qi(table)} (${cols.join(', ')})`];
      Object.entries(fields).forEach(([f, def]) => {
        if (def.index && def.type !== 'array') sql.push(`CREATE INDEX IF NOT EXISTS ${qi(`idx_${table}_${f}`)} ON ${qi(table)} (${qi(f)})`);
      });
      indexes.forEach((ix) => {
        sql.push(`CREATE ${ix.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${qi(`idx_${table}_${ix.fields.join('_')}`)} ON ${qi(table)} (${ix.fields.map(qi).join(', ')})`);
      });
      return sql;
    },
    fromRow(row) {
      const data = { _id: row._id };
      Object.entries(fields).forEach(([f, def]) => {
        const v = row[f];
        if (def.type === 'array') data[f] = v ? JSON.parse(v) : [];
        else if (def.type === 'boolean') data[f] = Boolean(v);
        else data[f] = v === undefined ? null : v;
      });
      data.createdAt = row.createdAt;
      data.updatedAt = row.updatedAt;
      return new Model(data, false);
    },
  });

  // ----- instance methods -----
  hidden(Model.prototype, {
    toObject() {
      const plain = {};
      Object.keys(this).forEach((k) => {
        const v = this[k];
        if (Array.isArray(v)) plain[k] = v.map((x) => (x && typeof x.toObject === 'function' ? x.toObject() : x));
        else plain[k] = v && typeof v.toObject === 'function' ? v.toObject() : v;
      });
      return plain;
    },
    toJSON() { return this.toObject(); },

    async save() {
      const now = new Date().toISOString();
      if (this.$isNew) {
        const clean = normalize(Model, this);
        const _id = this._id || crypto.randomUUID();
        const names = Object.keys(fields);
        db.run(
          `INSERT INTO ${qi(table)} ("_id", ${names.map(qi).join(', ')}, "createdAt", "updatedAt") VALUES (?, ${names.map(() => '?').join(', ')}, ?, ?)`,
          [_id, ...names.map((f) => toColumn(fields[f], clean[f])), now, now]
        );
        Object.assign(this, clean, { _id, createdAt: now, updatedAt: now });
        this.$isNew = false;
      } else {
        const clean = normalize(Model, this, { onlyPresent: true });
        const names = Object.keys(clean);
        db.run(
          `UPDATE ${qi(table)} SET ${[...names.map((f) => `${qi(f)} = ?`), '"updatedAt" = ?'].join(', ')} WHERE "_id" = ?`,
          [...names.map((f) => toColumn(fields[f], clean[f])), now, this._id]
        );
        Object.assign(this, clean, { updatedAt: now });
      }
      return this;
    },

    async deleteOne() {
      db.run(`DELETE FROM ${qi(table)} WHERE "_id" = ?`, [this._id]);
      return this;
    },

    async populate(path, select) {
      await populateDocs(Model, [this], [{ path, select }]);
      return this;
    },

    ...methods,
  });

  // ----- query builder (chainable + awaitable) -----
  class Query {
    constructor(filter, { first = false } = {}) {
      this.filter = filter || {};
      this.first = first;
      this.populates = [];
      this.sorts = [];
      this.skipN = 0;
      this.limitN = null;
      this.selectStr = null;
      this.distinctField = null;
    }
    populate(path, select) { this.populates.push({ path, select }); return this; }
    sort(obj) { this.sorts = Object.entries(obj || {}); return this; }
    skip(n) { this.skipN = Number(n) || 0; return this; }
    limit(n) { this.limitN = Number(n); return this; }
    select(str) { this.selectStr = str; return this; }
    distinct(field) { this.distinctField = field; return this; }

    async exec() {
      const { where, params } = buildWhere(Model, this.filter);

      const orderParts = this.sorts.map(([f, dir]) => {
        if (f !== '_id' && f !== 'createdAt' && f !== 'updatedAt' && !fields[f]) throw new Error(`Unknown sort field "${f}"`);
        return `${qi(f)} ${dir < 0 ? 'DESC' : 'ASC'}`;
      });
      // rowid keeps insertion order stable for ties (like natural order in the old store).
      orderParts.push(`rowid ${this.sorts.length && this.sorts[0][1] < 0 ? 'DESC' : 'ASC'}`);

      let sql = `SELECT * FROM ${qi(table)} ${where} ORDER BY ${orderParts.join(', ')}`;
      const allParams = [...params];
      const limit = this.first ? 1 : this.limitN;
      if (limit !== null && !Number.isNaN(limit)) { sql += ' LIMIT ?'; allParams.push(limit); }
      else if (this.skipN) sql += ' LIMIT -1';
      if (this.skipN) { sql += ' OFFSET ?'; allParams.push(this.skipN); }

      const docs = db.all(sql, allParams).map((row) => Model.fromRow(row));

      if (this.distinctField) {
        const seen = new Set();
        const out = [];
        docs.forEach((d) => {
          const v = d[this.distinctField];
          (Array.isArray(v) ? v : [v]).forEach((x) => {
            if (x !== null && x !== undefined && !seen.has(x)) { seen.add(x); out.push(x); }
          });
        });
        return out;
      }

      applySelect(docs, this.selectStr);
      await populateDocs(Model, docs, this.populates);
      return this.first ? docs[0] || null : docs;
    }

    then(resolve, reject) { return this.exec().then(resolve, reject); }
    catch(reject) { return this.exec().catch(reject); }
    finally(fn) { return this.exec().finally(fn); }
  }

  // ----- static methods -----
  const equalityFields = (filter) => {
    const out = {};
    Object.entries(filter).forEach(([k, v]) => {
      if (!(v && typeof v === 'object' && !Array.isArray(v))) out[k] = v;
    });
    return out;
  };

  hidden(Model, {
    find: (filter) => new Query(filter),
    findOne: (filter) => new Query(filter, { first: true }),
    findById: (id) => new Query(id === undefined || id === null ? { _id: null } : { _id: id }, { first: true }),
    distinct: (field, filter) => new Query(filter).distinct(field),

    async countDocuments(filter = {}) {
      const { where, params } = buildWhere(Model, filter);
      return db.get(`SELECT COUNT(*) AS n FROM ${qi(table)} ${where}`, params).n;
    },

    async create(data) {
      const doc = new Model({ ...data }, true);
      await doc.save();
      return doc;
    },

    // update is a plain object of fields to set. Options: { upsert, new }.
    async findOneAndUpdate(filter, update, options = {}) {
      const attempt = async () => {
        const existing = await Model.findOne(filter);
        if (existing) {
          const before = options.new === false ? existing.toObject() : null;
          Object.assign(existing, update);
          await existing.save();
          return before ? new Model(before, false) : existing;
        }
        if (!options.upsert) return null;
        return Model.create({ ...equalityFields(filter), ...update });
      };
      try {
        return await attempt();
      } catch (err) {
        // Two simultaneous upserts: the loser hits the unique index - retry as an update.
        if (err.code === 11000 && options.upsert) return attempt();
        throw err;
      }
    },

    findByIdAndUpdate: (id, update, options) => Model.findOneAndUpdate({ _id: id }, update, options),

    async findOneAndDelete(filter) {
      const doc = await Model.findOne(filter);
      if (doc) await doc.deleteOne();
      return doc;
    },

    ...statics,
  });

  registry[name] = Model;
  return Model;
};

module.exports = { defineModel, registry };
