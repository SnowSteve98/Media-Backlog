import fs from 'fs';
const code = fs.readFileSync('src/App.bak.jsx', 'utf-8');

const importsEnd = code.indexOf('// --- CONSTANTS & ICONS ---');
const constsEnd = code.indexOf('// --- SEARCH SERVICE & API ---');
const apiEnd = code.indexOf('// --- UTILITIES ---');
const utilsEnd = code.indexOf('// --- COMPONENTS ---');
const componentsEnd = code.indexOf('// --- MAIN APP COMPONENT ---');

const consts = code.slice(importsEnd, constsEnd);
const api = code.slice(constsEnd, apiEnd);
const utils = code.slice(apiEnd, utilsEnd);
const components = code.slice(utilsEnd, componentsEnd);
const main = code.slice(componentsEnd);

// Extracts from CONSTANTS & ICONS
const providerArrStart = consts.indexOf('const STREAMING_PROVIDERS =');
const guessProvStart = consts.indexOf('const guessProviders =');
const providerIconStart = consts.indexOf('// Componente Icona Provider');

const streamingProviders = consts.slice(providerArrStart, guessProvStart);
const guessProvidersStr = consts.slice(guessProvStart, providerIconStart);
const providerIconStr = consts.slice(providerIconStart);

// Write utils.js
fs.writeFileSync('src/utils.js', `
export ${streamingProviders}
export ${guessProvidersStr}
${utils.replace('const INITIAL_DATA', 'export const INITIAL_DATA')
        .replace('const generateId', 'export const generateId')
        .replace('const getGenreColor', 'export const getGenreColor')}
`);

// Write api.js
fs.writeFileSync('src/api.js', `
import { guessProviders } from './utils.js';
${api.replace('const normalizeResult', 'export const normalizeResult')
     .replace('const searchMediaCandidates', 'export const searchMediaCandidates')
     .replace('const fetchMediaDetails', 'export const fetchMediaDetails')}
`);

// Write components.jsx
fs.writeFileSync('src/components.jsx', `
import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle, Settings, Cloud, CloudOff, X, Upload, Trash2, Edit2, BookOpen, Clock, Check, List, Hash, Minus, Plus, MonitorPlay, ChevronRight } from 'lucide-react';
import { STREAMING_PROVIDERS, getGenreColor } from './utils.js';

${providerIconStr.replace('const ProviderIcon =', 'export const ProviderIcon =')}
${components.replace(/const StatusBadge /g, 'export const StatusBadge ')
            .replace(/const RatingStars /g, 'export const RatingStars ')
            .replace(/const ProgressBar /g, 'export const ProgressBar ')
            .replace(/const DeleteConfirmationModal /g, 'export const DeleteConfirmationModal ')
            .replace(/const SettingsModal /g, 'export const SettingsModal ')
            .replace(/const Card /g, 'export const Card ')}
`);

let modifiedMain = main.replace(
  "useEffect(() => { localStorage.setItem('view_mode', viewMode); }, [viewMode]);",
  `// Capacitor Back Button Gesture natively
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

  useEffect(() => { localStorage.setItem('view_mode', viewMode); }, [viewMode]);`
);


// Rewrite App.jsx
fs.writeFileSync('src/App.jsx', `
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

${modifiedMain}
`);

console.log("Refactoring complete");
