export interface LocalizedText {
  lang: string;
  text: string;
}

export interface Transcription {
  lang: string;
  url: string;
}

export interface VideoRecord {
  id: string;
  title: LocalizedText[];
  info: LocalizedText[];
  url: string;
  transcriptions: Transcription[];
  created: number;
  lang: string;
  duration: number;
}

export interface Settings {
  imageSet: 'nature' | 'seyh-muhammed-nazim-adil-el-hakkani';
  primaryPreferredLanguage: 'en' | 'tr' | 'ar';
  secondaryPreferredLanguage: 'en' | 'tr' | 'ar';
  sort: 'default' | 'date-asc' | 'date-desc' | 'duration-asc' | 'duration-desc';
  filter: 'all' | 'fav' | 'en' | 'tr' | 'ar';
  displayWatchedRecords: boolean;
  autoPlayVideo: boolean;
  autoMarkWatched?: boolean; // New setting to control auto-watched behavior
}

export interface Store {
  records: VideoRecord[];
  currentPage: number;
  settings: Settings;
  watchedRecords: string[];
  favorites: string[];
  searchTerm: string;
}
