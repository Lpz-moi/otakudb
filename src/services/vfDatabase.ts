/**
 * Base de données VF française améliorée
 * Basée sur les licences connues des plateformes françaises (ADN, Crunchyroll FR, Netflix FR)
 */

// Studios connus pour produire des doublages VF
const VF_FRIENDLY_STUDIOS = new Set([
  'Toei Animation', // Dragon Ball, One Piece, etc.
  'MAPPA',
  'ufotable',
  'Wit Studio',
  'CloverWorks',
  'A-1 Pictures',
  'Bones',
  'Madhouse',
  'Production I.G',
  'Kyoto Animation',
  'Studio Pierrot',
  'TMS Entertainment',
]);

// Genres populaires qui obtiennent souvent des VF
const VF_PRIORITY_GENRES = new Set([
  'Action',
  'Adventure', 
  'Comedy',
  'Fantasy',
  'Shounen',
]);

// Franchises connues avec VF disponible
const VF_FRANCHISES = [
  'dragon ball',
  'one piece',
  'naruto',
  'boruto',
  'bleach',
  'my hero academia',
  'boku no hero',
  'attack on titan',
  'shingeki no kyojin',
  'demon slayer',
  'kimetsu no yaiba',
  'jujutsu kaisen',
  'spy x family',
  'chainsaw man',
  'one punch man',
  'mob psycho',
  'tokyo ghoul',
  'death note',
  'fullmetal alchemist',
  'hunter x hunter',
  'fairy tail',
  'black clover',
  'sword art online',
  're:zero',
  'konosuba',
  'danmachi',
  'overlord',
  'mushoku tensei',
  'oshi no ko',
  'frieren',
  'solo leveling',
  'kaiju no. 8',
  'blue lock',
  'haikyuu',
  'kuroko no basket',
  'slam dunk',
  'captain tsubasa',
  'detective conan',
  'case closed',
  'pokemon',
  'digimon',
  'yu-gi-oh',
  'beyblade',
  'dr. stone',
  'fire force',
  'vinland saga',
  'tokyo revengers',
  'hell\'s paradise',
  'undead unluck',
  'mashle',
  'sakamoto days',
  'dandadan',
];

// IDs MAL spécifiques connus pour avoir des VF
const KNOWN_VF_MAL_IDS = new Set([
  21, // One Punch Man
  20, // Naruto
  1735, // Naruto Shippuden
  5114, // Fullmetal Alchemist: Brotherhood
  11061, // Hunter x Hunter 2011
  16498, // Shingeki no Kyojin
  31964, // Boku no Hero Academia
  38000, // Kimetsu no Yaiba
  40748, // Jujutsu Kaisen
  50265, // Spy x Family
  44511, // Chainsaw Man
  21, // One Piece (different entries)
  51009, // Jujutsu Kaisen S2
  145064, // Mushoku Tensei S2
  52991, // Frieren
  151807, // Solo Leveling
  54112, // Kaiju No. 8
  137270, // Blue Lock
  54968, // Oshi no Ko S2
  52034, // Hell's Paradise S2
]);

interface VFCheckResult {
  hasVF: boolean;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  estimatedDelay?: string;
}

/**
 * Vérifie si un anime a une VF disponible
 */
export const checkVFAvailability = (anime: {
  mal_id: number;
  title: string;
  title_english?: string | null;
  score?: number | null;
  members?: number | null;
  popularity?: number | null;
  genres?: { name: string }[];
  studios?: { name: string }[];
}): VFCheckResult => {
  const title = (anime.title || '').toLowerCase();
  const titleEnglish = (anime.title_english || '').toLowerCase();
  
  // 1. Check explicit VF markers in title
  if (/\(vf\)/i.test(title) || /\[vf\]/i.test(title) || 
      /version française/i.test(title) || /doublage/i.test(title)) {
    return { hasVF: true, confidence: 'high', source: 'Titre explicite' };
  }
  
  // 2. Check known MAL IDs
  if (KNOWN_VF_MAL_IDS.has(anime.mal_id)) {
    return { hasVF: true, confidence: 'high', source: 'Licence connue' };
  }
  
  // 3. Check franchise names
  for (const franchise of VF_FRANCHISES) {
    if (title.includes(franchise) || titleEnglish.includes(franchise)) {
      return { hasVF: true, confidence: 'high', source: 'Franchise populaire' };
    }
  }
  
  // 4. Calculate probability based on factors
  let score = 0;
  const factors: string[] = [];
  
  // Popularity factor
  if (anime.members && anime.members > 500000) {
    score += 30;
    factors.push('Très populaire');
  } else if (anime.members && anime.members > 100000) {
    score += 15;
    factors.push('Populaire');
  }
  
  // Score factor
  if (anime.score && anime.score >= 8.0) {
    score += 20;
    factors.push('Note élevée');
  } else if (anime.score && anime.score >= 7.5) {
    score += 10;
  }
  
  // Studio factor
  if (anime.studios?.some(s => VF_FRIENDLY_STUDIOS.has(s.name))) {
    score += 20;
    factors.push('Studio majeur');
  }
  
  // Genre factor
  if (anime.genres?.some(g => VF_PRIORITY_GENRES.has(g.name))) {
    score += 15;
    factors.push('Genre prioritaire');
  }
  
  // Rank factor
  if (anime.popularity && anime.popularity <= 100) {
    score += 25;
    factors.push('Top 100');
  } else if (anime.popularity && anime.popularity <= 500) {
    score += 10;
  }
  
  // Determine result
  if (score >= 60) {
    return { 
      hasVF: true, 
      confidence: 'medium', 
      source: factors.join(', '),
      estimatedDelay: '2-4 semaines après VOSTFR'
    };
  } else if (score >= 40) {
    return { 
      hasVF: true, 
      confidence: 'low', 
      source: factors.join(', ') || 'Estimation',
      estimatedDelay: 'Possible, à confirmer'
    };
  }
  
  return { hasVF: false, confidence: 'high', source: 'Non licencié VF' };
};

/**
 * Batch check VF for multiple anime
 */
export const batchCheckVF = (animes: Array<{
  mal_id: number;
  title: string;
  title_english?: string | null;
  score?: number | null;
  members?: number | null;
  popularity?: number | null;
  genres?: { name: string }[];
  studios?: { name: string }[];
}>): Map<number, VFCheckResult> => {
  const results = new Map<number, VFCheckResult>();
  
  for (const anime of animes) {
    results.set(anime.mal_id, checkVFAvailability(anime));
  }
  
  return results;
};

/**
 * Get VF-only filtered list
 */
export const filterVFOnly = <T extends { mal_id: number; title: string; title_english?: string | null; score?: number | null; members?: number | null; genres?: { name: string }[]; studios?: { name: string }[] }>(
  animes: T[]
): T[] => {
  return animes.filter(anime => {
    const result = checkVFAvailability(anime);
    return result.hasVF;
  });
};