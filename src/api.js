
import { guessProviders } from './utils.js';
// --- SEARCH SERVICE & API ---

export const normalizeResult = (source, item) => {
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

export const searchMediaCandidates = async (query, category) => {
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

export const fetchMediaDetails = async (candidate, category) => {
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


