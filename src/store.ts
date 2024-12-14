import { createStore } from 'solid-js/store';
import { createSignal, createMemo } from 'solid-js';
import { VideoRecord, Settings } from './types';
import videoData from '../data.json';

export const defaultSettings: Settings = {
  imageSet: 'nature',
  primaryPreferredLanguage: 'en',
  secondaryPreferredLanguage: 'tr',
  sort: 'date-desc',
  filter: 'all',
  displayWatchedRecords: true,
  autoPlayVideo: true,
  autoMarkWatched: true,
};

interface StoreState {
  records: VideoRecord[];
  currentPage: number;
  settings: Settings;
  watchedRecords: string[];
  favorites: string[];
  searchTerm: string;
}

const ITEMS_PER_PAGE = 20;

// Initialize store with default values
const [store, setStore] = createStore<StoreState>({
  records: [],
  currentPage: 0,
  settings: defaultSettings,
  watchedRecords: [],
  favorites: [],
  searchTerm: ''
});

// Create signals for search and filtering
export const [searchQuery, setSearchQuery] = createSignal('');

// Load video data
const loadVideoData = () => {
  setStore('records', videoData);
};

const onlyUnique = function (value, index, array) {
  return array.indexOf(value) === index;
};
// Create memoized selectors
const videos = createMemo(() => {
  let filtered = [...store.records];

  // Apply filters based on settings
  filtered = filtered.filter(record => {
    if (store.settings.filter === 'fav') {
      return store.favorites.includes(record.id);
    }
    if (store.settings.filter === 'en') {
      return record.lang === 'english';
    }
    if (store.settings.filter === 'tr') {
      return record.lang === 'turkish';
    }
    if (store.settings.filter === 'ar') {
      return record.lang === 'arabic';
    }
    return true;
  });

  // Filter out watched videos if displayWatchedRecords is false
  if (!store.settings.displayWatchedRecords) {
    filtered = filtered.filter(record => !store.watchedRecords.includes(record.id));
  }

  // Sort records based on language preferences
  const infoPreferredLanguage = store.settings.primaryPreferredLanguage === 'tr' ? 'turkish'
    : store.settings.primaryPreferredLanguage === 'ar' ? 'arabic'
      : 'english';

  const infoSecondaryPreferredLanguage = store.settings.secondaryPreferredLanguage === 'tr' ? 'turkish'
    : store.settings.secondaryPreferredLanguage === 'ar' ? 'arabic'
      : 'english';

  const titlePreferredLanguage = store.settings.primaryPreferredLanguage === 'tr' ? 'turkish'
    : store.settings.primaryPreferredLanguage === 'ar' ? 'arabic'
      : 'english';

  const titleSecondaryPreferredLanguage = store.settings.secondaryPreferredLanguage === 'tr' ? 'turkish'
    : store.settings.secondaryPreferredLanguage === 'ar' ? 'arabic'
      : 'english';

  // Sort titles and info based on language preferences
  filtered = filtered.map(record => ({
    ...record,
    info: [...record.info].sort((x, y) => {
      const xPow = x.lang === infoPreferredLanguage ? 2 : x.lang === infoSecondaryPreferredLanguage ? 1 : 0;
      const yPow = y.lang === infoPreferredLanguage ? 2 : y.lang === infoSecondaryPreferredLanguage ? 1 : 0;
      return yPow - xPow;
    }),
    title: [...record.title].sort((x, y) => {
      const xPow = x.lang === titlePreferredLanguage ? 2 : x.lang === titleSecondaryPreferredLanguage ? 1 : 0;
      const yPow = y.lang === titlePreferredLanguage ? 2 : y.lang === titleSecondaryPreferredLanguage ? 1 : 0;
      return yPow - xPow;
    })
  }));

  // Apply search filter if search term is present
  if (searchQuery().length > 2) {
    filtered = filtered.filter(record => {
      const regex = new RegExp(searchQuery(), 'gi');
      const titleMatch = record.title[0].text.match(regex);
      const infoMatch = record.info[0].text.match(regex);
      return titleMatch || infoMatch;
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (store.settings.sort) {
      case 'date-desc':
        return b.created - a.created;
      case 'date-asc':
        return a.created - b.created;
      case 'duration-asc':
        return a.duration - b.duration;
      case 'duration-desc':
        return b.duration - a.duration;
      default:
        return b.created - a.created;
    }
  });

  return filtered;
});

const watchedVideos = createMemo(() => store.watchedRecords);
const favoriteVideos = createMemo(() => store.favorites);

// Load settings from Chrome storage
const loadSettings = async () => {
  const keys = [
    'settingImageSet',
    'settingPrimaryPreferredLanguage',
    'settingSecondaryPreferredLanguage',
    'settingSort',
    'settingFilter',
    'settingDisplayWatchedRecords',
    'settingWatched',
    'settingFavorites',
    'settingAutoPlayVideo',
    'settingAutoMarkWatched'
  ];

  const result = await chrome.storage.sync.get(keys);

  setStore('settings', {
    imageSet: result['settingImageSet'] || defaultSettings.imageSet,
    primaryPreferredLanguage: result['settingPrimaryPreferredLanguage'] || defaultSettings.primaryPreferredLanguage,
    secondaryPreferredLanguage: result['settingSecondaryPreferredLanguage'] || defaultSettings.secondaryPreferredLanguage,
    sort: result['settingSort'] || defaultSettings.sort,
    filter: result['settingFilter'] || defaultSettings.filter,
    displayWatchedRecords: result['settingDisplayWatchedRecords'] ?? defaultSettings.displayWatchedRecords,
    autoPlayVideo: result['settingAutoPlayVideo'] ?? defaultSettings.autoPlayVideo,
    autoMarkWatched: result['settingAutoMarkWatched'] ?? defaultSettings.autoMarkWatched
  });

  // Load video data after settings are loaded
  loadVideoData();

  setStore('watchedRecords', (result['settingWatched'] || '').split(',').filter(onlyUnique).filter(Boolean));
  setStore('favorites', (result['settingFavorites'] || '').split(',').filter(Boolean));
};
// Load watched records from Chrome storage
const loadWatchedRecords = async () => {
  const result = await chrome.storage.sync.get(['settingWatched']);

  const watchedRecords = (result['settingWatched'] || '').split(',').filter(onlyUnique).filter(Boolean);
  setStore('watchedRecords', watchedRecords);
};

// Load favorites from Chrome storage
const loadFavorites = async () => {
  const result = await chrome.storage.sync.get(['settingFavorites']);
  const favorites = (result['settingFavorites'] || '').split(',').filter(Boolean);
  setStore('favorites', favorites);
};

// Save a setting to Chrome storage
const saveSetting = async (key: string, value: any) => {
  await chrome.storage.sync.set({ [`setting${key.charAt(0).toUpperCase()}${key.slice(1)}`]: value });
};

// Update watched/favorites
const updateWatchedStatus = async (videoId: string, isWatched: boolean) => {
  const newWatched = isWatched
    ? [...store.watchedRecords, videoId]
    : store.watchedRecords.filter(id => id !== videoId);

  setStore('watchedRecords', newWatched.filter(onlyUnique));
  await saveSetting('watched', newWatched.filter(onlyUnique).join(','));
};

const updateFavoriteStatus = async (videoId: string, isFavorite: boolean) => {
  const newFavorites = isFavorite
    ? [...store.favorites, videoId]
    : store.favorites.filter(id => id !== videoId);

  setStore('favorites', newFavorites);
  await saveSetting('favorites', newFavorites.join(','));
};

// Update settings
const updateSettings = async (newSettings: Partial<Settings>) => {
  setStore('settings', settings => ({ ...settings, ...newSettings }));
  console.log(newSettings);

  // Save each changed setting
  for (const [key, value] of Object.entries(newSettings)) {
    await saveSetting(key, value);
  }
};

// Update search term
const updateSearchTerm = (term: string) => {
  setSearchQuery(term);
};

// Get video URL
const getVideoUrl = (path: string) => {
  return `http://d2jkz25f7wglz0.cloudfront.net/${path}`;
};

// Check if video is watched/favorite
const isWatched = (videoId: string) => store.watchedRecords.includes(videoId);
const isFavorite = (videoId: string) => store.favorites.includes(videoId);

export const useStore = () => ({
  store,
  videos,
  watchedVideos,
  favoriteVideos,
  searchQuery,
  setSearchTerm: updateSearchTerm,
  loadSettings,
  loadWatchedRecords,
  loadFavorites,
  updateSettings,
  updateWatchedStatus,
  updateFavoriteStatus,
  getVideoUrl,
  isWatched,
  isFavorite,
  ITEMS_PER_PAGE
});
