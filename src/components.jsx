
import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle, Settings, Cloud, CloudOff, X, Upload, Trash2, Edit2, BookOpen, Clock, Check, List, Hash, Minus, Plus, MonitorPlay, ChevronRight } from 'lucide-react';
import { STREAMING_PROVIDERS, getGenreColor } from './utils.js';

// Componente Icona Provider con Fallback Intelligente (SimpleIcon -> Favicon -> Badge)
export const ProviderIcon = ({ provider, className = "w-full h-full" }) => {
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


// --- COMPONENTS ---

export const StatusBadge = ({ status }) => {
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

export const RatingStars = ({ rating, setRating, readOnly = false }) => {
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

export const ProgressBar = ({ current, total, label, subLabel }) => {
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

export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
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

export const SettingsModal = ({ isOpen, onClose, config, onSave, dbStatus, onUploadLocal }) => {
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

export const Card = ({ item, viewMode, onRequestDelete, onEdit, onStatusChange, onUpdateProgress }) => {
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

  const ActionButtons = () => (
    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 translate-x-1 group-hover:translate-x-0">
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(item); }} className="p-1.5 bg-black/50 backdrop-blur-md rounded-full text-blue-300 hover:bg-blue-500 hover:text-white transition-colors border border-white/10"><Edit2 size={12}/></button>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRequestDelete(item.id); }} className="p-1.5 bg-black/50 backdrop-blur-md rounded-full text-rose-300 hover:bg-rose-500 hover:text-white transition-colors border border-white/10"><Trash2 size={12}/></button>
    </div>
  );

  const ProvidersBar = () => {
    if (!item.providers || item.providers.length === 0 || isCompact || isList) return null;
    return (
      <div className="flex gap-1 mt-2">
        {item.providers.map(provId => {
          const provider = STREAMING_PROVIDERS.find(p => p.id === provId);
          if(!provider) return null;
          return (
            <div key={provId} className="w-5 h-5 rounded overflow-hidden">
              <ProviderIcon provider={provider} />
            </div>
          );
        })}
      </div>
    );
  };

  // 1. LIST MODE (Minimal row)
  if (isList) {
    return (
      <div className="group relative flex items-center gap-4 p-3 bg-[#0c0e12] border-b border-white/5 hover:bg-[#12161c] transition-colors">
        <img src={item.image} alt={item.title} className="w-12 h-16 object-cover rounded shadow-md" onError={(e) => { e.target.src = 'https://placehold.co/100x150/1e293b/FFF'; }} />
        <div className="flex-grow flex flex-col justify-center">
           <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
           <div className="text-xs text-slate-400 mt-0.5">{item.category.toUpperCase()} • {item.genre[0] || 'Genere'}</div>
        </div>
        <StatusBadge status={item.status} />
        <ActionButtons />
      </div>
    );
  }

  // 2. FILMS, SERIES, ANIME (Cinematic Poster)
  if (['movie', 'series', 'anime'].includes(item.category)) {
    return (
      <div className="group relative rounded-xl overflow-hidden bg-slate-950 aspect-[2/3] shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 hover:-translate-y-1.5 border border-white/5 h-full">
        <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100" onError={(e) => { e.target.src = 'https://placehold.co/600x900/1e293b/FFF?text=Poster'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/40 to-transparent opacity-90 transition-opacity duration-300" />
        <ActionButtons />
        
        <div className="absolute top-3 left-3 z-20 shadow-lg"><StatusBadge status={item.status} /></div>

        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col z-20 translate-y-3 group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <h3 className={`font-black text-white leading-tight drop-shadow-md mb-1 ${isCompact ? 'text-sm' : 'text-lg'}`}>{item.title}</h3>
          
          <div className="flex flex-wrap gap-1 mb-2">
            {item.genre && item.genre.slice(0, isCompact?1:2).map((g, idx) => (<span key={idx} className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold border ${getGenreColor(g)} backdrop-blur-sm`}>{g}</span>))}
          </div>

          {!isCompact && item.category !== 'movie' && (
            <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-200 bg-white/10 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/10">
               <span className="flex items-center gap-1"><Hash size={12} className="text-orange-400"/> {item.category==='series' ? `S${item.season||1} E${item.episode||1}` : `Ep ${item.episode||1}`}</span>
               <div className="flex gap-1.5">
                 <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateProgress(item.id, -1); }} className="hover:text-white bg-white/10 rounded p-0.5"><Minus size={12}/></button>
                 <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateProgress(item.id, 1); }} className="hover:text-white bg-white/10 rounded p-0.5"><Plus size={12}/></button>
               </div>
            </div>
          )}

          <ProvidersBar />
        </div>
      </div>
    );
  }

  // 3. GAMES (Neon Ticket)
  if (item.category === 'game') {
    return (
      <div className="group relative flex flex-col rounded-xl overflow-hidden bg-[#0d1218] shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] border border-slate-800 h-full">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-500 z-20" />
        
        <div className={`relative ${isCompact ? 'h-24' : 'h-36'} overflow-hidden flex-shrink-0`}>
          <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" onError={(e) => { e.target.src = 'https://placehold.co/600x300/1e293b/FFF?text=Screenshot'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1218] to-transparent" />
          <ActionButtons />
          <div className="absolute bottom-2 left-3 z-20 shadow-lg"><StatusBadge status={item.status} /></div>
        </div>

        <div className="p-3 flex flex-col justify-between flex-grow">
           <div>
             <h3 className={`font-bold text-white leading-tight ${isCompact ? 'text-xs mb-1' : 'text-base mb-2'}`}>{item.title}</h3>
             {!isCompact && <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>}
           </div>
           
           {!isCompact && (
             <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-800/80">
               {item.status !== 'playing' ? (
                 <button onClick={() => onStatusChange(item.id, 'playing')} className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-1 rounded transition-colors uppercase tracking-wider">Start</button>
               ) : (
                 <button onClick={() => onStatusChange(item.id, 'finished')} className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-1 rounded transition-colors uppercase tracking-wider">Finish</button>
               )}
               <ProvidersBar />
             </div>
           )}
        </div>
      </div>
    );
  }

  // 4. BOOKS / COMICS (Book Spine Effect)
  if (['book', 'comic'].includes(item.category)) {
    return (
      <div className="group relative flex rounded-xl overflow-hidden bg-[#1a1714] aspect-[3/4] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 border border-[#3b342e] h-full">
        {/* Spine shadow effect */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-white/10 z-20 pointer-events-none" />
        
        <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" onError={(e) => { e.target.src = 'https://placehold.co/400x600/3b342e/FFF?text=Cover'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151210] via-transparent to-transparent opacity-90" />
        
        <ActionButtons />
        <div className="absolute top-2 right-2 z-20 scale-90 origin-top-right"><StatusBadge status={item.status} /></div>

        <div className="relative z-20 mt-auto p-3 flex flex-col w-full bg-gradient-to-t from-black via-black/80 to-transparent">
          <h3 className={`font-bold text-[#f4eee6] leading-tight drop-shadow-md mb-1 ${isCompact ? 'text-[10px]' : 'text-sm'}`}>{item.title}</h3>
          
          {!isCompact && (
            <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-[#cbb59e] bg-[#2a221c]/80 px-2 py-1.5 rounded border border-[#3b342e]">
               <span className="flex items-center gap-1"><BookOpen size={10} className="text-yellow-600"/> {item.currentPage||0} / {item.totalPages||'?'}</span>
               <div className="text-[#8c7e6a]">{item.totalPages ? Math.round(((item.currentPage||0) / item.totalPages) * 100) : 0}%</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return null;
};


