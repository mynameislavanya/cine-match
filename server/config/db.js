// SQLite connection + tiny helpers.
//
// Uses `better-sqlite3` (listed in package.json). If that package can't be loaded on your
// machine, it falls back to Node's built-in `node:sqlite` module (Node 22.5+).
//
// The database file path comes from SQLITE_PATH in .env (default: server/data/cinematch.sqlite).
// The file and all tables are created automatically the first time the server (or the seed
// script) starts - nothing is ever dropped or reset.

const fs = require('fs');
const path = require('path');

let Database;
try {
  Database = require('better-sqlite3');
} catch (err) {
  try {
    ({ DatabaseSync: Database } = require('node:sqlite'));
    console.warn('better-sqlite3 not found - using Node built-in node:sqlite instead.');
  } catch (err2) {
    console.error('No SQLite driver available. Run "npm install" in server/ (installs better-sqlite3).');
    process.exit(1);
  }
}

let db = null;
let dbPath = null;

const resolveDbPath = () => {
  const configured = process.env.SQLITE_PATH || './data/cinematch.sqlite';
  if (configured === ':memory:') return configured;
  return path.isAbsolute(configured) ? configured : path.resolve(__dirname, '..', configured);
};

// Opens the database (once) and makes sure every table exists.
const getDb = () => {
  if (db) return db;

  dbPath = resolveDbPath();
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const opened = new Database(dbPath);
  opened.exec('PRAGMA journal_mode = WAL;');

  // Required lazily to avoid a circular import (models need this file at query time).
  const { registry } = require('../models');
  Object.values(registry).forEach((Model) => {
    Model.createTableSQL().forEach((sql) => opened.exec(sql));
  });

  db = opened;
  return db;
};

// SQLite only accepts numbers/strings/null/bigint/buffers - convert the rest.
const toParam = (v) => {
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v;
};

// A UNIQUE-constraint failure is reported with code 11000 (the code the controllers already check for).
const wrapError = (err) => {
  if (/UNIQUE constraint failed/i.test(err.message || '')) {
    const dup = new Error(`Duplicate key error: ${err.message}`);
    dup.code = 11000;
    return dup;
  }
  return err;
};

const run = (sql, params = []) => {
  try {
    return getDb().prepare(sql).run(...params.map(toParam));
  } catch (err) {
    throw wrapError(err);
  }
};
const get = (sql, params = []) => getDb().prepare(sql).get(...params.map(toParam));
const all = (sql, params = []) => getDb().prepare(sql).all(...params.map(toParam));

const connectDB = async () => {
  try {
    getDb();
    console.log('SQLite connected:', dbPath);
  } catch (err) {
    console.error('SQLite connection error:', err.message);
    process.exit(1);
  }
};

const isConnected = () => db !== null;

const closeDB = () => {
  if (db) {
    db.close();
    db = null;
  }
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getDb = getDb;
module.exports.run = run;
module.exports.get = get;
module.exports.all = all;
module.exports.isConnected = isConnected;
module.exports.closeDB = closeDB;
