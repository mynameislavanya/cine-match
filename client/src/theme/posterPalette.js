// Curated duotone gradients used for the "poster card" fallback when a movie has
// no posterUrl (which is every movie in the seed data - this keeps the catalogue
// working with zero external image API, as required).
//
// A movie is assigned one of these deterministically (by hashing its title), so a
// given movie always renders with the same poster treatment.
const PALETTES = [
  ['#1F2A44', '#CBA135'], // navy -> gold
  ['#2B1E3A', '#D98A4B'], // plum -> amber
  ['#15263A', '#8FAE9B'], // deep teal -> sage
  ['#301A22', '#C97B5B'], // maroon -> terracotta
  ['#10243A', '#6E9CC9'], // navy -> steel blue
  ['#241A33', '#B98FD1'], // aubergine -> lilac
];

export const paletteForTitle = (title = '') => {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
};
