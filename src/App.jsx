
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

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth'; 
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { App as CapacitorApp } from '@capacitor/app';

import { STREAMING_PROVIDERS, guessProviders, INITIAL_DATA, generateId, getGenreColor } from './utils.js';
import { searchMediaCandidates, fetchMediaDetails } from './api.js';
import { ProviderIcon, StatusBadge, RatingStars, ProgressBar, DeleteConfirmationModal, SettingsModal, Card } from './components.jsx';

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

  // Capacitor Back Button Gesture natively
  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (isModalOpen) {
        setIsModalOpen(false);
      } else if (isSettingsOpen) {
        setIsSettingsOpen(false);
      } else if (itemToDelete) {
        setItemToDelete(null);
      } else if (activeTab !== 'all') {
        setActiveTab('all');
      } else {
        CapacitorApp.exitApp();
      }
    });
    return () => {
      backListener.remove();
    };
  }, [isModalOpen, isSettingsOpen, itemToDelete, activeTab]);

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

  const handleUpdateRating = async (id, newRating) => {
    if (db) {
      const item = items.find(i => i.id === id);
      if (item) await setDoc(doc(db, "media_items", id), { ...item, rating: newRating });
    } else {
      setItems(prev => prev.map(item => item.id === id ? { ...item, rating: newRating } : item));
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
      case 'compact': return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 items-start';
      default: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 items-start'; 
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
              <Card key={item.id} item={item} viewMode={viewMode} onRequestDelete={handleRequestDelete} onEdit={handleEdit} onStatusChange={handleStatusChange} onUpdateProgress={handleUpdateProgress} onUpdateRating={handleUpdateRating} />
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
