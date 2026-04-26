
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


