/**
 * starMap.js — Pleiades star type definitions for the Seven Stars arcade system.
 * Each entry maps a star id to its sister name, virtue, spectral classification,
 * and SVG asset path served from /assets/svg/stars/.
 */

export const STAR_TYPES = {
  electra: {
    id: 'electra',
    name: 'Electra',
    sister: 'Electra',
    virtue: 'Vision',
    spectralType: 'A',
    svg: '/assets/svg/stars/star-electra.svg',
    gem: '/assets/svg/gems/gem-electra.svg'
  },
  taygete: {
    id: 'taygete',
    name: 'Taygete',
    sister: 'Taygete',
    virtue: 'Courage',
    spectralType: 'B',
    svg: '/assets/svg/stars/star-taygete.svg',
    gem: '/assets/svg/gems/gem-taygete.svg'
  },
  alcyone: {
    id: 'alcyone',
    name: 'Alcyone',
    sister: 'Alcyone',
    virtue: 'Serenity',
    spectralType: 'F',
    svg: '/assets/svg/stars/star-alcyone.svg',
    gem: '/assets/svg/gems/gem-alcyone.svg'
  },
  maia: {
    id: 'maia',
    name: 'Maia',
    sister: 'Maia',
    virtue: 'Autonomy',
    spectralType: 'O',
    svg: '/assets/svg/stars/star-maia.svg',
    gem: '/assets/svg/gems/gem-maia.svg'
  },
  celaeno: {
    id: 'celaeno',
    name: 'Celaeno',
    sister: 'Celaeno',
    virtue: 'Sustenance',
    spectralType: 'Neutral',
    svg: '/assets/svg/stars/star-celaeno.svg',
    gem: '/assets/svg/gems/gem-celaeno.svg'
  },
  sterope: {
    id: 'sterope',
    name: 'Sterope',
    sister: 'Sterope',
    virtue: 'Patience',
    spectralType: 'G',
    svg: '/assets/svg/stars/star-sterope.svg',
    gem: '/assets/svg/gems/gem-sterope.svg'
  },
  merope: {
    id: 'merope',
    name: 'Merope',
    sister: 'Merope',
    virtue: 'Humility',
    spectralType: 'M',
    svg: '/assets/svg/stars/star-merope.svg',
    gem: '/assets/svg/gems/gem-merope.svg'
  }
};
