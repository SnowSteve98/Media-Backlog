
export const STREAMING_PROVIDERS = [
  // Video
  { id: 'netflix', name: 'Netflix', color: '#E50914', icon: 'https://cdn.simpleicons.org/netflix/E50914', domain: 'netflix.com' },
  { id: 'prime', name: 'Prime Video', color: '#00A8E1', icon: 'https://cdn.simpleicons.org/primevideo/00A8E1', domain: 'primevideo.com' }, // Slug corretto
  { id: 'disney', name: 'Disney+', color: '#113CCF', icon: 'https://cdn.simpleicons.org/disneyplus/113CCF', domain: 'disneyplus.com' },
  { id: 'appletv', name: 'Apple TV+', color: '#A3AAAE', icon: 'https://cdn.simpleicons.org/appletv/A3AAAE', domain: 'tv.apple.com' },
  { id: 'now', name: 'Now TV', color: '#94CE00', icon: 'https://cdn.simpleicons.org/now/94CE00', domain: 'nowtv.it' },
  { id: 'rai', name: 'RaiPlay', color: '#0055A6', icon: 'https://cdn.simpleicons.org/rai/0055A6', domain: 'raiplay.it' }, // Fallback su favicon
  { id: 'hbo', name: 'HBO / Max', color: '#FFF', icon: 'https://cdn.simpleicons.org/hbo/FFF', domain: 'max.com' },
  { id: 'hulu', name: 'Hulu', color: '#1CE783', icon: 'https://cdn.simpleicons.org/hulu/1CE783', domain: 'hulu.com' },
  { id: 'peacock', name: 'Peacock', color: '#FFF', icon: 'https://cdn.simpleicons.org/peacock/FFF', domain: 'peacocktv.com' },
  { id: 'paramount', name: 'Paramount+', color: '#0064FF', icon: 'https://cdn.simpleicons.org/paramountplus/0064FF', domain: 'paramountplus.com' },
  { id: 'crunchyroll', name: 'Crunchyroll', color: '#F47521', icon: 'https://cdn.simpleicons.org/crunchyroll/F47521', domain: 'crunchyroll.com' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: 'https://cdn.simpleicons.org/youtube/FF0000', domain: 'youtube.com' },
  
  // Games
  { id: 'steam', name: 'Steam', color: '#00ADEE', icon: 'https://cdn.simpleicons.org/steam/00ADEE', domain: 'steampowered.com' },
  { id: 'xbox', name: 'Xbox', color: '#107C10', icon: 'https://cdn.simpleicons.org/xbox/107C10', domain: 'xbox.com' },
  { id: 'playstation', name: 'PlayStation', color: '#003791', icon: 'https://cdn.simpleicons.org/playstation/003791', domain: 'playstation.com' },
  { id: 'nintendo', name: 'Nintendo', color: '#E60012', icon: 'https://cdn.simpleicons.org/nintendo/E60012', domain: 'nintendo.com' },
  { id: 'epic', name: 'Epic Games', color: '#313131', icon: 'https://cdn.simpleicons.org/epicgames/FFF', domain: 'store.epicgames.com' },
  { id: 'gog', name: 'GOG', color: '#86328A', icon: 'https://cdn.simpleicons.org/gogdotcom/86328A', domain: 'gog.com' },
  { id: 'ubisoft', name: 'Ubisoft', color: '#0091DA', icon: 'https://cdn.simpleicons.org/ubisoft/0091DA', domain: 'ubisoft.com' },
  { id: 'ea', name: 'EA App', color: '#FF4747', icon: 'https://cdn.simpleicons.org/ea/FF4747', domain: 'ea.com' },
  { id: 'battlenet', name: 'Battle.net', color: '#00AEFF', icon: 'https://cdn.simpleicons.org/battlenet/00AEFF', domain: 'battle.net' },
  { id: 'geforce', name: 'GeForce Now', color: '#76B900', icon: 'https://cdn.simpleicons.org/nvidia/76B900', domain: 'nvidia.com' },
];


export const guessProviders = (text) => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const detected = [];

  const rules = {
    'netflix': 'netflix',
    'amazon': 'prime', 'prime video': 'prime',
    'disney': 'disney',
    'apple tv': 'appletv',
    'now': 'now', 'sky': 'now',
    'rai': 'rai', 'raiplay': 'rai',
    'hbo': 'hbo', 'max': 'hbo',
    'hulu': 'hulu',
    'peacock': 'peacock',
    'paramount': 'paramount',
    'crunchyroll': 'crunchyroll',
    'youtube': 'youtube',
    'steam': 'steam', 'valve': 'steam',
    'xbox': 'xbox', 'microsoft': 'xbox',
    'playstation': 'playstation', 'sony': 'playstation',
    'nintendo': 'nintendo', 'switch': 'nintendo',
    'epic': 'epic', 'epic games': 'epic',
    'ubisoft': 'ubisoft', 'uplay': 'ubisoft',
    'ea': 'ea', 'origin': 'ea', 'electronic arts': 'ea',
    'gog': 'gog', 'cd projekt': 'gog',
    'battle.net': 'battlenet', 'blizzard': 'battlenet',
    'geforce': 'geforce', 'nvidia': 'geforce'
  };

  Object.entries(rules).forEach(([keyword, providerId]) => {
    if (lowerText.includes(keyword)) {
      if (!detected.includes(providerId)) detected.push(providerId);
    }
  });

  return detected;
};


// --- UTILITIES ---

export const INITIAL_DATA = [];
export const generateId = () => Math.random().toString(36).substr(2, 9);
export const getGenreColor = (genre) => {
  const colors = [
    'bg-red-500/20 text-red-300 border-red-500/30',
    'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'bg-green-500/20 text-green-300 border-green-500/30',
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'bg-teal-500/20 text-teal-300 border-teal-500/30',
    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'bg-sky-500/20 text-sky-300 border-sky-500/30',
    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    'bg-violet-500/20 text-violet-300 border-violet-500/30',
    'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'bg-rose-500/20 text-rose-300 border-rose-500/30',
  ];
  if (!genre) return colors[0];
  let hash = 0;
  for (let i = 0; i < genre.length; i++) {
    hash = genre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};


