import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, Tv, Gamepad2, Plus, Search, Filter, 
  Download, Upload, X, Check, Clock, List, 
  Trash2, Star, Save, MoreVertical, Edit2,
  ExternalLink, Hash, RefreshCw, AlertCircle,
  AlertTriangle, BookOpen, Ghost, Library,
  ChevronRight, Book, Settings, Cloud, CloudOff,
  LayoutList, LayoutGrid, Grid, Minus, ArrowUpDown, 
  MonitorPlay, HelpCircle 
} from 'lucide-react';

// Import Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth'; 
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// --- CONSTANTS & ICONS ---

// LISTA PROVIDER con DOMINI per il fallback FAVICON
const STREAMING_PROVIDERS = [
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

const guessProviders = (text) => {
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

// Componente Icona Provider con Fallback Intelligente (SimpleIcon -> Favicon -> Badge)
const ProviderIcon = ({ provider, className = "w-full h-full" }) => {
  const [imgSrc, setImgSrc] = useState(provider.icon);
  const [useFallbackText, setUseFallbackText] = useState(false);

  const handleError = () => {
    // Se fallisce l'icona principale e abbiamo un dominio, proviamo la favicon di Google
    if (imgSrc === provider.icon && provider.domain) {
      setImgSrc(`https://www.google.com/s2/favicons?domain=${provider.domain}&sz=128`);
    } else {
      // Se fallisce anche la favicon, usiamo il testo
      setUseFallbackText(true);
    }
  };

  if (useFallbackText) {
    const initials = provider.name.substring(0, 2).toUpperCase();
    return (
      <div 
        className={`${className} flex items-center justify-center font-bold text-white rounded-sm text-[8px]`}
        style={{ backgroundColor: provider.color || '#334155' }}
        title={provider.name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={provider.name} 
      className={`${className} object-contain`} 
      onError={handleError}
      title={provider.name}
    />
  );
};

// --- SEARCH SERVICE & API ---

const normalizeResult = (source, item) => {
  if (source === 'tvmaze') {
    return {
      id: String(item.show.id),
      title: item.show.name,
      year: item.show.premiered ? item.show.premiered.split('-')[0] : '',
      extra: item.show.network ? item.show.network.name : (item.show.webChannel ? item.show.webChannel.name : ''),
      sourceData: item.show,
      source: 'tvmaze'
    };
  }
  if (source === 'itunes') {
    return {
      id: String(item.trackId),
      title: item.trackName,
      year: item.releaseDate ? item.releaseDate.split('-')[0] : '',
      extra: item.directorName || '',
      sourceData: item,
      source: 'itunes'
    };
  }
  if (source === 'googlebooks') {
    const info = item.volumeInfo;
    return {
      id: item.id,
      title: info.title,
      year: info.publishedDate ? info.publishedDate.split('-')[0] : '',
      extra: info.authors ? info.authors.join(', ') : '',
      sourceData: item,
      source: 'googlebooks'
    };
  }
  if (source === 'jikan') {
    return {
      id: String(item.mal_id),
      title: item.title,
      year: item.year || '',
      extra: item.type || 'Anime',
      sourceData: item,
      source: 'jikan'
    };
  }
  if (source === 'wikipedia') {
    return {
      id: String(item.pageid),
      title: item.title,
      year: '',
      extra: 'Wikipedia',
      sourceData: item,
      source: 'wikipedia'
    };
  }
  return null;
};

const searchMediaCandidates = async (query, category) => {
  const results = [];
  try {
    if (category === 'series') {
      const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      data.forEach(item => results.push(normalizeResult('tvmaze', item)));
    } else if (category === 'movie') {
      let itunesSuccess = false;
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=movie&entity=movie&limit=10&country=IT&lang=it_it`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            data.results.forEach(item => results.push(normalizeResult('itunes', item)));
            itunesSuccess = true;
          }
        }
      } catch (e) { console.warn("iTunes fallback"); }

      if (!itunesSuccess) {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + " film")}&format=json&origin=*&srlimit=10`);
        const data = await res.json();
        if (data.query.search) {
          data.query.search.forEach(item => results.push(normalizeResult('wikipedia', item)));
        }
      }
    } else if (category === 'book' || category === 'comic') {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`);
      const data = await res.json();
      if (data.items) {
        data.items.forEach(item => results.push(normalizeResult('googlebooks', item)));
      }
    } else if (category === 'anime') {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      if (data.data) {
        data.data.forEach(item => results.push(normalizeResult('jikan', item)));
      }
    } else if (category === 'game') {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + " video game")}&format=json&origin=*&srlimit=10`);
      const data = await res.json();
      if (data.query.search) {
        data.query.search.forEach(item => results.push(normalizeResult('wikipedia', item)));
      }
    }
  } catch (error) { console.error("Search Error", error); }
  return results;
};

const fetchMediaDetails = async (candidate, category) => {
  const { source, sourceData, title } = candidate;

  if (source === 'tvmaze') {
    const res = await fetch(`https://api.tvmaze.com/shows/${sourceData.id}?embed=episodes`);
    const data = await res.json();
    const seasonsMap = {};
    let totalEps = 0;
    if (data._embedded?.episodes) {
      data._embedded.episodes.forEach(ep => {
        seasonsMap[ep.season] = (seasonsMap[ep.season] || 0) + 1;
        totalEps++;
      });
    }
    
    const networkName = data.network ? data.network.name : (data.webChannel ? data.webChannel.name : '');
    const detectedProviders = guessProviders(networkName);

    return {
      title: data.name,
      description: data.summary ? data.summary.replace(/<[^>]*>?/gm, '') : '',
      genre: data.genres || [],
      image: data.image?.original || '',
      totalEpisodes: totalEps,
      seasonsMap: seasonsMap,
      providers: detectedProviders
    };
  }
  if (source === 'itunes') {
    let img = sourceData.artworkUrl100 || '';
    if (img) img = img.replace('100x100bb', '1000x1000bb');
    return {
      title: sourceData.trackName,
      description: sourceData.longDescription || sourceData.shortDescription || '',
      genre: [sourceData.primaryGenreName],
      image: img,
      providers: [] 
    };
  }
  if (source === 'googlebooks') {
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${sourceData.id}`);
      const data = await res.json();
      const info = data.volumeInfo;
      const links = info.imageLinks || {};
      let img = links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail || '';
      if (img) {
        img = img.replace('http:', 'https:').replace('&edge=curl', ''); 
      }
      return {
        title: info.title,
        description: info.description ? info.description.replace(/<[^>]*>?/gm, '') : '',
        genre: info.categories || ['Libro'],
        image: img,
        totalPages: info.pageCount || 0
      };
    } catch (e) {
      const info = sourceData.volumeInfo;
      let img = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
      if (img) img = img.replace('http:', 'https:');
      return {
        title: info.title,
        description: info.description || '',
        genre: info.categories || ['Libro'],
        image: img,
        totalPages: info.pageCount || 0
      };
    }
  }
  if (source === 'jikan') {
    let detectedProviders = [];
    if (sourceData.licensors) {
      sourceData.licensors.forEach(l => {
        const found = guessProviders(l.name);
        detectedProviders = [...new Set([...detectedProviders, ...found])];
      });
    }
    if (sourceData.producers) {
      sourceData.producers.forEach(p => {
        const found = guessProviders(p.name);
        detectedProviders = [...new Set([...detectedProviders, ...found])];
      });
    }

    return {
      title: sourceData.title,
      description: sourceData.synopsis || '',
      genre: sourceData.genres ? sourceData.genres.map(g => g.name) : ['Anime'],
      image: sourceData.images?.jpg?.large_image_url || '',
      totalEpisodes: sourceData.episodes || 0,
      providers: detectedProviders
    };
  }
  if (source === 'wikipedia') {
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      const details = await res.json();
      const extractGenres = (txt) => {
        if(!txt) return category === 'game' ? ['Video Game'] : ['Film'];
        const kws = {'rpg': 'RPG', 'action': 'Action', 'adventure': 'Adventure', 'shooter': 'Shooter', 'strategy': 'Strategy', 'platform': 'Platform', 'horror': 'Horror', 'racing': 'Racing', 'simulation': 'Simulation', 'drama': 'Drammatico', 'comedy': 'Commedia', 'thriller': 'Thriller', 'sci-fi': 'Sci-Fi'};
        const f = new Set();
        Object.keys(kws).forEach(k => { if(txt.toLowerCase().includes(k)) f.add(kws[k]); });
        return f.size > 0 ? Array.from(f) : (category === 'game' ? ['Video Game'] : ['Film']);
      };
      
      const detectedProviders = category === 'game' ? guessProviders(details.extract) : [];

      const img = details.originalimage?.source || details.thumbnail?.source?.replace(/\/\d+px-/, '/800px-') || '';
      return {
        title: details.title,
        description: details.extract || '',
        genre: extractGenres(details.extract),
        image: img,
        providers: detectedProviders
      };
    } catch (e) { return null; }
  }
  return null;
};

// --- UTILITIES ---

const INITIAL_DATA = [];
const generateId = () => Math.random().toString(36).substr(2, 9);
const getGenreColor = (genre) => {
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

// --- COMPONENTS ---

const StatusBadge = ({ status }) => {
  const config = {
    backlog: { color: 'bg-slate-700 text-slate-300', icon: List, label: 'In Lista' },
    playing: { color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', icon: Clock, label: 'In Corso' },
    finished: { color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', icon: Check, label: 'Finito' },
  };
  const current = config[status] || config.backlog;
  const Icon = current.icon;
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${current.color}`}>
      <Icon size={10} className="sm:w-3 sm:h-3" /> {current.label}
    </span>
  );
};

const RatingStars = ({ rating, setRating, readOnly = false }) => {
  return (
    <div className="flex gap-0.5 sm:gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={(e) => {
            e.stopPropagation();
            if (!readOnly && setRating) setRating(star);
          }}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
        >
          <Star size={readOnly ? 12 : 20} className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-700 text-slate-600'}`} />
        </button>
      ))}
    </div>
  );
};

const ProgressBar = ({ current, total, label, subLabel }) => {
  if (!total || total <= 0) return null;
  const percentage = Math.min(100, Math.round((current / total) * 100));
  let barColor = 'bg-indigo-500';
  if (percentage > 90) barColor = 'bg-emerald-500';
  else if (percentage < 10) barColor = 'bg-slate-600';
  return (
    <div className="w-full mt-1.5 sm:mt-2 group relative cursor-help">
      <div className="flex justify-between text-[8px] sm:text-[10px] text-slate-400 mb-0.5 sm:mb-1">
        <span>{label || 'Progresso'}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-1 sm:h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 hidden sm:block shadow-lg border border-slate-800">
        {subLabel || `${current} su ${total}`}
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Elimina Elemento</h3>
            <p className="text-sm text-slate-400 mt-1">Sei sicuro? L'azione non può essere annullata.</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Annulla</button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium">Elimina</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose, config, onSave, dbStatus, onUploadLocal }) => {
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    if (config) setJsonInput(JSON.stringify(config, null, 2));
  }, [config]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.apiKey) { alert("Errore JSON: Manca il campo 'apiKey'."); return; }
      if (!parsed.projectId) { alert("Errore JSON: Manca il campo 'projectId'."); return; }
      onSave(parsed);
      onClose();
    } catch (e) {
      alert("JSON non valido.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Settings size={24} className="text-indigo-400"/> Impostazioni Firebase</h3>
          <button onClick={onClose}><X size={20} className="text-slate-500 hover:text-white"/></button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-grow space-y-4">
          <div className={`p-3 rounded-lg border flex items-center gap-3 ${dbStatus ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
            {dbStatus ? <Cloud size={24} className="text-emerald-400"/> : <CloudOff size={24} className="text-slate-500"/>}
            <div>
              <div className={`text-sm font-bold ${dbStatus ? 'text-emerald-400' : 'text-slate-400'}`}>{dbStatus ? 'Sincronizzazione Attiva' : 'Modalità Offline'}</div>
              <div className="text-xs text-slate-500">{dbStatus ? 'Dati nel cloud.' : 'Dati nel browser.'}</div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Configurazione Firebase (JSON)</label>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 resize-none" placeholder={'{\n  "apiKey": "...",\n  ...}'} />
          </div>
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-sm font-bold text-white mb-2">Gestione Dati</h4>
            <button onClick={onUploadLocal} disabled={!dbStatus} className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"><Upload size={16} /> Carica dati locali su Cloud</button>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { onSave(null); setJsonInput(''); onClose(); }} className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm">Disconnetti</button>
          <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-indigo-500/20">Salva Config</button>
        </div>
      </div>
    </div>
  );
};

const Card = ({ item, viewMode, onRequestDelete, onEdit, onStatusChange, onUpdateProgress }) => {
  const categoryConfig = {
    movie: { color: 'border-purple-500/30 hover:border-purple-500/50', label: 'Film' },
    series: { color: 'border-orange-500/30 hover:border-orange-500/50', label: 'Serie TV' },
    game: { color: 'border-green-500/30 hover:border-green-500/50', label: 'Gioco' },
    book: { color: 'border-yellow-500/30 hover:border-yellow-500/50', label: 'Libro' },
    anime: { color: 'border-pink-500/30 hover:border-pink-500/50', label: 'Anime' },
    comic: { color: 'border-blue-500/30 hover:border-blue-500/50', label: 'Fumetto' },
  };
  const config = categoryConfig[item.category] || categoryConfig.movie;
  const isCompact = viewMode === 'compact';
  const isList = viewMode === 'list';

  const getSeriesProgress = () => {
    let current = item.episode || 0;
    if (item.seasonsMap && Object.keys(item.seasonsMap).length > 0) {
       current = 0;
       for (let s = 1; s < (item.season || 1); s++) { current += (item.seasonsMap[s] || 0); }
       current += (item.episode || 1);
    } else if (item.season > 1) { current = ((item.season - 1) * 10) + (item.episode || 1); }
    return current;
  };

  return (
    <div className={`group relative flex ${isList ? 'flex-row h-40' : 'flex-col'} bg-slate-800 rounded-xl overflow-hidden border border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${config.color}`}>
      <div className={`relative ${isList ? 'w-28' : isCompact ? 'h-32' : 'h-40 sm:h-48'} overflow-hidden bg-slate-900 flex-shrink-0`}>
        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100" onError={(e) => { e.target.src = 'https://placehold.co/600x600/1e293b/FFF?text=No+Image'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        
        {!isList && (
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 flex justify-between items-end">
            <StatusBadge status={item.status} />
            {item.status === 'finished' && !isCompact && <RatingStars rating={item.rating || 0} readOnly />}
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1 sm:p-1.5 bg-slate-900/90 rounded-full text-blue-400 hover:bg-blue-500 hover:text-white transition-colors border border-slate-700 shadow-lg"><Edit2 size={12} className="sm:w-3.5 sm:h-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onRequestDelete(item.id); }} className="p-1 sm:p-1.5 bg-slate-900/90 rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-slate-700 shadow-lg"><Trash2 size={12} className="sm:w-3.5 sm:h-3.5" /></button>
        </div>
      </div>

      <div className={`p-3 sm:p-4 flex flex-col flex-grow ${isList ? 'justify-between' : ''}`}>
        <div>
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <h3 className={`${isCompact ? 'text-xs' : 'text-sm sm:text-lg'} font-bold text-slate-100 leading-tight line-clamp-1`}>{item.title}</h3>
            {isList && <StatusBadge status={item.status} />}
          </div>
          <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">{item.genre && item.genre.slice(0, 2).map((g, idx) => (<span key={idx} className={`text-[9px] sm:text-[10px] uppercase tracking-wider px-1 py-0.5 sm:px-1.5 rounded font-semibold border ${getGenreColor(g)}`}>{g}</span>))}</div>
          {!isCompact && <p className="text-[10px] sm:text-sm text-slate-400 line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-4 flex-grow">{item.description || "Nessuna descrizione."}</p>}
        </div>

        <div>
          {/* STREAMING ICONS ROW */}
          {item.providers && item.providers.length > 0 && !isCompact && (
            <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar pb-1">
              {item.providers.map(provId => {
                const provider = STREAMING_PROVIDERS.find(p => p.id === provId);
                if(!provider) return null;
                return (
                  <div key={provId} className="w-5 h-5 min-w-[20px] rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center p-0.5 overflow-hidden" title={provider.name}>
                    <ProviderIcon provider={provider} />
                  </div>
                );
              })}
            </div>
          )}

          {(item.category === 'series' || item.category === 'anime') && (
            <div className="mb-2 sm:mb-3 bg-slate-900/50 p-1.5 sm:p-2 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-300">
                <div className="flex items-center gap-1">
                  <Hash size={10} className="sm:w-3 sm:h-3 text-orange-400"/>
                  {item.category === 'series' && (<><span>Stg <strong className="text-white">{item.season || 1}</strong></span><span className="text-slate-600 mx-0.5">|</span></>)}
                  <div className="flex items-center gap-1"><span>Ep</span><button onClick={(e) => { e.stopPropagation(); onUpdateProgress(item.id, -1); }} className="hover:text-white text-slate-500 cursor-pointer p-0.5"><Minus size={10}/></button><strong className="text-white">{item.episode || 1}</strong><button onClick={(e) => { e.stopPropagation(); onUpdateProgress(item.id, 1); }} className="hover:text-white text-slate-500 cursor-pointer p-0.5"><Plus size={10}/></button></div>
                </div>
              </div>
              <ProgressBar current={item.status === 'backlog' ? 0 : getSeriesProgress()} total={item.totalEpisodes} label="Avanzamento" />
            </div>
          )}
          {(item.category === 'book' || item.category === 'comic') && (
            <div className="mb-2 sm:mb-3 bg-slate-900/50 p-1.5 sm:p-2 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-300">
                <div className="flex items-center gap-1">{item.category === 'comic' && item.issueNumber && (<span className="mr-1 sm:mr-2 text-blue-400 font-bold">#{item.issueNumber}</span>)}<BookOpen size={10} className="sm:w-3 sm:h-3 text-yellow-400"/><span>Pag <strong className="text-white">{item.currentPage || 0}</strong></span></div>
                {item.totalPages > 0 && <span className="text-[8px] sm:text-[10px] text-slate-500">/{item.totalPages}</span>}
              </div>
              <ProgressBar current={item.status === 'backlog' ? 0 : item.currentPage || 0} total={item.totalPages} label="Lettura" subLabel={`${item.currentPage || 0} di ${item.totalPages} pag.`} />
            </div>
          )}
          <div className="pt-2 sm:pt-3 border-t border-slate-700/50 flex justify-between items-center">
            <div className="flex gap-1">
              {item.status !== 'playing' && (<button onClick={() => onStatusChange(item.id, 'playing')} className="text-[10px] sm:text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors">Inizia</button>)}
              {item.status === 'playing' && (<button onClick={() => onStatusChange(item.id, 'finished')} className="text-[10px] sm:text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors">Finisci</button>)}
            </div>
            <span className="text-[8px] sm:text-[10px] text-slate-600 uppercase font-bold tracking-wider">{config.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function MediaBacklogApp() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('backlog_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('view_mode') || 'grid');
  const [sortBy, setSortBy] = useState('status'); 

  // Firebase State
  const [firebaseConfig, setFirebaseConfig] = useState(() => {
    const saved = localStorage.getItem('firebase_config');
    return saved ? JSON.parse(saved) : null;
  });
  const [db, setDb] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('all'); 
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', category: 'movie', status: 'backlog', genre: '', description: '', image: '', rating: 0,
    season: 1, episode: 1, totalEpisodes: 0, seasonsMap: {}, currentPage: 0, totalPages: 0, issueNumber: '',
    providers: []
  });

  useEffect(() => { localStorage.setItem('view_mode', viewMode); }, [viewMode]);
  useEffect(() => { if (!db) localStorage.setItem('backlog_data', JSON.stringify(items)); }, [items, db]);

  useEffect(() => {
    if (firebaseConfig && firebaseConfig.apiKey) {
      try {
        const app = initializeApp(firebaseConfig);
        const database = getFirestore(app);
        const auth = getAuth(app);
        signInAnonymously(auth).then(() => setDb(database)).catch(e => console.error(e));
      } catch (e) { console.error(e); }
    }
  }, [firebaseConfig]);

  useEffect(() => {
    if (db) {
      const unsubscribe = onSnapshot(collection(db, "media_items"), (snapshot) => {
        const cloudItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(cloudItems);
      });
      return () => unsubscribe();
    }
  }, [db]);

  const handleSaveConfig = (newConfig) => {
    if (newConfig) { localStorage.setItem('firebase_config', JSON.stringify(newConfig)); setFirebaseConfig(newConfig); } 
    else { localStorage.removeItem('firebase_config'); setFirebaseConfig(null); setDb(null); }
  };

  const handleUploadLocalData = async () => {
    if (!db || !window.confirm("Caricare dati su Cloud?")) return;
    for (const item of items) await setDoc(doc(db, "media_items", item.id), item);
    alert("Dati caricati.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanData = {
        ...formData,
        season: formData.season === '' ? 1 : Number(formData.season),
        episode: formData.episode === '' ? 1 : Number(formData.episode),
        totalEpisodes: formData.totalEpisodes === '' ? 0 : Number(formData.totalEpisodes),
        currentPage: formData.currentPage === '' ? 0 : Number(formData.currentPage),
        totalPages: formData.totalPages === '' ? 0 : Number(formData.totalPages),
        rating: Number(formData.rating)
    };
    const newItem = { id: editingItem ? editingItem.id : generateId(), ...cleanData, genre: formData.genre.split(',').map(g => g.trim()).filter(g => g), addedAt: editingItem ? editingItem.addedAt : Date.now() };

    if (db) {
      try { await setDoc(doc(db, "media_items", newItem.id), newItem); setIsModalOpen(false); resetForm(); } catch (e) { alert("Errore Cloud: " + e.message); }
    } else {
      if (editingItem) setItems(prev => prev.map(item => item.id === newItem.id ? newItem : item));
      else setItems(prev => [newItem, ...prev]);
      setIsModalOpen(false); resetForm();
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      if (db) await deleteDoc(doc(db, "media_items", itemToDelete));
      else setItems(prev => prev.filter(item => item.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (db) {
      const item = items.find(i => i.id === id);
      if (item) await setDoc(doc(db, "media_items", id), { ...item, status: newStatus });
    } else {
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    }
  };

  const handleUpdateProgress = async (id, delta) => {
    const item = items.find(i => i.id === id);
    if (!item || !['series', 'anime'].includes(item.category)) return;
    const newValue = (item.episode || 0) + delta;
    if (newValue < 0) return;
    if (db) await setDoc(doc(db, "media_items", id), { ...item, episode: newValue });
    else setItems(prev => prev.map(i => i.id === id ? { ...i, episode: newValue } : i));
  };

  const handleRequestDelete = (id) => setItemToDelete(id);
  const handleEdit = (item) => {
    setEditingItem(item); setSearchResults([]); 
    setFormData({ ...item, genre: item.genre.join(', '), issueNumber: item.issueNumber || '', currentPage: item.currentPage || 0, totalPages: item.totalPages || 0, providers: item.providers || [] });
    setIsModalOpen(true);
  };
  const resetForm = () => {
    setFormData({ title: '', category: activeTab === 'all' ? 'movie' : activeTab, status: 'backlog', genre: '', description: '', image: '', rating: 0, season: 1, episode: 1, totalEpisodes: 0, seasonsMap: {}, currentPage: 0, totalPages: 0, issueNumber: '', providers: [] });
    setEditingItem(null); setSearchResults([]);
  };
  const handleSearchCandidates = async () => {
    if (!formData.title) return; setIsSearching(true); setSearchResults([]);
    const results = await searchMediaCandidates(formData.title, formData.category);
    if (results.length === 0) alert("Nessun risultato."); else setSearchResults(results); setIsSearching(false);
  };
  const handleSelectCandidate = async (candidate) => {
    setIsSearching(true);
    const details = await fetchMediaDetails(candidate, formData.category);
    setIsSearching(false);
    if (details) {
      setFormData(prev => ({ ...prev, 
        title: details.title, 
        description: details.description, 
        genre: details.genre.join(', '), 
        image: details.image, 
        totalEpisodes: details.totalEpisodes || prev.totalEpisodes, 
        totalPages: details.totalPages || prev.totalPages, 
        seasonsMap: details.seasonsMap || prev.seasonsMap,
        providers: details.providers || prev.providers || [] 
      }));
      setSearchResults([]); 
    } else alert("Errore dettagli.");
  };
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items));
    const a = document.createElement('a'); a.setAttribute("href", dataStr); a.setAttribute("download", "backup.json"); document.body.appendChild(a); a.click(); a.remove();
  };
  const fileInputRef = useRef(null);
  const handleImportFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = (event) => { try { const parsed = JSON.parse(event.target.result); if (Array.isArray(parsed)) setItems(parsed); } catch (err) {} }; reader.readAsText(file);
  };

  const calculateProgressPct = (item) => {
    if (['movie', 'game'].includes(item.category)) return 0;
    let current = 0; let total = 0;
    if (['series', 'anime'].includes(item.category)) {
        total = item.totalEpisodes || 0; current = item.episode || 0;
        if (item.seasonsMap && Object.keys(item.seasonsMap).length > 0) { current = 0; for (let s = 1; s < (item.season || 1); s++) { current += (item.seasonsMap[s] || 0); } current += (item.episode || 1); } 
        else if (item.season > 1) { current = ((item.season - 1) * 10) + (item.episode || 1); }
    } else if (['book', 'comic'].includes(item.category)) { total = item.totalPages || 0; current = item.currentPage || 0; }
    if (total === 0) return 0;
    return (current / total);
  };

  const getProcessedItems = () => {
    let processed = items.filter(item => {
      const matchCategory = activeTab === 'all' || item.category === activeTab;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchStatus && matchSearch;
    });
    processed.sort((a, b) => {
      if (sortBy === 'status') {
        const statusOrder = { playing: 0, backlog: 1, finished: 2 };
        const orderA = statusOrder[a.status] ?? 99; const orderB = statusOrder[b.status] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return b.addedAt - a.addedAt;
      }
      if (sortBy === 'date') return b.addedAt - a.addedAt;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'progress') return calculateProgressPct(b) - calculateProgressPct(a);
      return 0;
    });
    return processed;
  };

  const filteredItems = getProcessedItems();
  const tabs = [ { id: 'all', label: 'Tutti', icon: List, color: 'text-slate-400' }, { id: 'movie', label: 'Film', icon: Film, color: 'text-purple-400' }, { id: 'series', label: 'Serie', icon: Tv, color: 'text-orange-400' }, { id: 'game', label: 'Giochi', icon: Gamepad2, color: 'text-emerald-400' }, { id: 'anime', label: 'Anime', icon: Ghost, color: 'text-pink-400' }, { id: 'book', label: 'Libri', icon: Book, color: 'text-yellow-400' }, { id: 'comic', label: 'Fumetti', icon: Library, color: 'text-blue-400' } ];
  const getGridClasses = () => {
    switch (viewMode) {
      case 'list': return 'grid-cols-1 max-w-3xl mx-auto';
      case 'compact': return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2';
      default: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6'; 
    }
  };

  const toggleProvider = (pid) => {
    setFormData(prev => {
      const exists = prev.providers.includes(pid);
      return { ...prev, providers: exists ? prev.providers.filter(p => p !== pid) : [...prev.providers, pid] };
    });
  };

  const handleJustWatchSearch = () => {
    if(!formData.title) return;
    const query = encodeURIComponent(formData.title);
    window.open(`https://www.justwatch.com/it/cerca?q=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <DeleteConfirmationModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} config={firebaseConfig} onSave={handleSaveConfig} dbStatus={!!db} onUploadLocal={handleUploadLocalData} />

      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-20 py-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <List className="text-white" size={24} />
              </div>
              <div><h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Media Backlog</h1><p className="text-xs text-slate-500 font-medium">{items.length} Elementi {db && <span className="text-emerald-400 font-bold">• Cloud</span>}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSettingsOpen(true)} className={`p-2 rounded-lg transition-colors ${db ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Impostazioni"><Settings size={20} /></button>
              <div className="w-px h-6 bg-slate-800 mx-1"></div>
              <button onClick={handleExport} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><Download size={20} /></button>
              <button onClick={() => fileInputRef.current.click()} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><Upload size={20} /></button>
              <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".json" />
              <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"><Plus size={18} /> <span className="hidden sm:inline">Aggiungi</span></button>
            </div>
          </div>
          <div className="pb-4 flex flex-col gap-4 border-t border-slate-800/50 pt-4">
            <div className="flex overflow-x-auto pb-2 gap-1 no-scrollbar">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                  <tab.icon size={16} className={activeTab === tab.id ? tab.color : ''} /><span>{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow flex items-center gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="text" placeholder="Filtra..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
                <div className="relative">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none bg-slate-900 border border-slate-800 text-slate-400 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:border-indigo-500 text-sm h-full cursor-pointer"><option value="status">Stato (Default)</option><option value="date">Data Agg.</option><option value="title">Nome (A-Z)</option><option value="rating">Voto</option><option value="progress">Progresso</option></select>
                  <ArrowUpDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
                <div className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`} title="Lista"><LayoutList size={18} /></button>
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`} title="Griglia"><LayoutGrid size={18} /></button>
                  <button onClick={() => setViewMode('compact')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'compact' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`} title="Compatta"><Grid size={18} /></button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                 {['all', 'backlog', 'playing', 'finished'].map(status => (
                  <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${filterStatus === status ? 'bg-slate-700 text-white border-slate-600' : 'border-slate-800 text-slate-500'}`}>{status === 'all' ? 'Tutti' : status === 'backlog' ? 'In Lista' : status === 'playing' ? 'In Corso' : 'Finito'}</button>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredItems.length === 0 ? <div className="text-center py-20 text-slate-500">Nessun elemento trovato.</div> : 
          <div className={`grid ${getGridClasses()}`}>
            {filteredItems.map(item => (
              <Card key={item.id} item={item} viewMode={viewMode} onRequestDelete={handleRequestDelete} onEdit={handleEdit} onStatusChange={handleStatusChange} onUpdateProgress={handleUpdateProgress} />
            ))}
          </div>
        }
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{editingItem ? 'Modifica' : 'Nuovo'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-500 hover:text-white"/></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
              <form id="itemForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase">Titolo & Ricerca</label>
                   <div className="flex gap-2">
                     <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Es. Dark Souls" className="flex-grow bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                     <button type="button" onClick={handleSearchCandidates} disabled={isSearching || !formData.title} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors" title="Cerca e Disambigua">{isSearching ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search size={18} />}</button>
                   </div>
                   {searchResults.length > 0 && (
                     <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden max-h-40 overflow-y-auto mt-2 shadow-lg z-10 animate-in fade-in zoom-in-95 duration-200">
                       {searchResults.map(res => (
                         <button key={res.id + res.source} type="button" onClick={() => handleSelectCandidate(res)} className="w-full text-left px-4 py-2 hover:bg-indigo-600/20 border-b border-slate-700/50 last:border-0 flex justify-between items-center group transition-colors">
                           <div><div className="text-sm font-bold text-white group-hover:text-indigo-300">{res.title}</div><div className="text-xs text-slate-500">{res.year} {res.extra ? `• ${res.extra}` : ''}</div></div>
                           <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400"/>
                         </button>
                       ))}
                     </div>
                   )}
                </div>
                
                {/* PLATFORM SELECTOR */}
                <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Disponibile su (Streaming/Piattaforma)</label>
                    <button type="button" onClick={handleJustWatchSearch} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><MonitorPlay size={10}/> Cerca su JustWatch</button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {STREAMING_PROVIDERS.map(prov => {
                      const isSelected = formData.providers.includes(prov.id);
                      return (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => toggleProvider(prov.id)}
                          className={`h-8 rounded-lg flex items-center justify-center border transition-all ${isSelected ? 'border-white bg-slate-700 scale-105 shadow-lg' : 'border-slate-700 bg-slate-900 opacity-60 hover:opacity-100 hover:border-slate-500'}`}
                          title={prov.name}
                        >
                          <ProviderIcon provider={prov} className="w-5 h-5" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categoria</label>
                    <select value={formData.category} onChange={(e) => { setFormData({...formData, category: e.target.value}); setSearchResults([]); }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
                      <option value="movie">Film</option><option value="series">Serie TV</option><option value="game">Videogioco</option><option value="anime">Anime</option><option value="book">Libro</option><option value="comic">Fumetto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Stato</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
                      <option value="backlog">In Lista</option><option value="playing">In Corso</option><option value="finished">Completato</option>
                    </select>
                  </div>
                </div>
                {(formData.category === 'series' || formData.category === 'anime') && (
                   <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 grid grid-cols-3 gap-3">
                      {formData.category === 'series' && (<div><label className="text-xs font-semibold text-orange-400 uppercase">Stagione</label><input type="number" min="1" value={formData.season} onChange={(e) => setFormData({...formData, season: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"/></div>)}
                      <div className={formData.category === 'anime' ? 'col-span-2' : ''}><label className="text-xs font-semibold text-orange-400 uppercase">Episodio</label><input type="number" min="1" value={formData.episode} onChange={(e) => setFormData({...formData, episode: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"/></div>
                      <div><label className="text-xs font-semibold text-slate-500 uppercase">Totali</label><input type="number" min="0" value={formData.totalEpisodes} onChange={(e) => setFormData({...formData, totalEpisodes: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" placeholder="Auto"/></div>
                   </div>
                )}
                {(formData.category === 'book' || formData.category === 'comic') && (
                   <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 space-y-3">
                      {formData.category === 'comic' && (<div><label className="text-xs font-semibold text-blue-400 uppercase block mb-1">Numero Albo</label><input type="text" value={formData.issueNumber} onChange={(e) => setFormData({...formData, issueNumber: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" placeholder="#1"/></div>)}
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-semibold text-yellow-400 uppercase">Pagina Attuale</label><input type="number" min="0" value={formData.currentPage} onChange={(e) => setFormData({...formData, currentPage: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"/></div>
                        <div><label className="text-xs font-semibold text-slate-500 uppercase">Pagine Totali</label><input type="number" min="0" value={formData.totalPages} onChange={(e) => setFormData({...formData, totalPages: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" placeholder="Auto"/></div>
                      </div>
                   </div>
                )}
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Genere</label><input type="text" value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"/></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrizione</label><textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none"/></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL Immagine</label><input type="text" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"/></div>
                {formData.status === 'finished' && (
                  <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Voto</label><div className="bg-slate-800 border border-slate-700 rounded-lg p-2 flex justify-center"><RatingStars rating={formData.rating} setRating={(r) => setFormData({...formData, rating: r})} /></div></div>
                )}
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">Annulla</button>
              <button type="submit" form="itemForm" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-indigo-500/20 flex items-center gap-2"><Save size={18} /> Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}