import { Component, createSignal, createEffect, onMount } from 'solid-js';
import { useStore } from '../store';
import { defaultSettings } from '../store';
import styles from './Settings.module.css';

export const Settings: Component = () => {
  const { store, updateSettings } = useStore();
  const [isOpen, setIsOpen] = createSignal(false);
  const [importError, setImportError] = createSignal('');

  onMount(() => {
    document.querySelectorAll('[data-locale]').forEach(elem => {
      elem.innerText = chrome.i18n.getMessage(elem.dataset.locale)
    });
  });

  const resetToDefaults = () => {
    const confirmReset = window.confirm(chrome.i18n.getMessage('resetSettingsConfirmation'));
    if (confirmReset) {
      updateSettings(defaultSettings);
      setImportError('');
    }
  };

  const exportSettings = () => {
    const settingsToExport = JSON.stringify(store.settings, null, 2);
    const blob = new Blob([settingsToExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hakkani_extension_settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          updateSettings(importedSettings);
          setImportError('');
        } catch (error) {
          console.error('Invalid settings file', error);
          setImportError(chrome.i18n.getMessage('importSettingsError'));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSettingChange = (key: keyof typeof store.settings, value: any) => {
    updateSettings({ [key]: value });
  };

  createEffect(() => {
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) {
      if (isOpen()) {
        settingsPanel.classList.add(styles.open);
      } else {
        settingsPanel.classList.remove(styles.open);
      }
    }
  }, [isOpen]);

  return (
    <div class={styles.settingsContainer}>
      <button
        class={styles.settingsToggle}
        onClick={() => setIsOpen(!isOpen())}
        aria-expanded={isOpen()}
        aria-controls="settings-panel"
        aria-label="Open settings panel"
        title="Open Settings"
      >
        <svg
          class={styles.settingsIcon}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <div
        id="settings-panel"
        class={`${styles.settingsPanel} ${isOpen() ? styles.open : ''}`}
        role="dialog"
        aria-label="Settings panel"
      >
        <div class={styles.settingsPanelHeader}>
          <h3 data-locale="settings"></h3>
          <div class={styles.settingsActions}>
            {window.location.search !== '?o' && (
              <button
                class={styles.actionButton}
                onClick={() => {
                  window.open(`chrome-extension://${chrome.runtime.id}/index.html?o`, '_blank');
                }}
                title="Open in New Tab"
                aria-label="Open video in a new tab"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
            )}

            <button
              class={styles.actionButton}
              onClick={exportSettings}
              title="Export Settings"
              aria-label="Export settings to a file"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <label class={styles.actionButton}>
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                style="display: none;"
                aria-label="Import settings from a file"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </label>
            <button
              class={styles.actionButton}
              onClick={resetToDefaults}
              title="Reset to Defaults"
              aria-label="Reset all settings to default values"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2.5 2v6h6" />
                <path d="M22 12A10.002 10.002 0 0 0 4.33 7.5" />
                <path d="M21.5 22v-6h-6" />
                <path d="M2 12a10.002 10.002 0 0 0 17.67 4.5" />
              </svg>
            </button>
            <button
              class={styles.actionButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                width="24"
                height="24"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {importError() && (
          <div class={styles.errorMessage} role="alert">
            {importError()}
          </div>
        )}

        <div class={styles.settingsContent}>
          <div class={styles.settingItem}>
            <label for="imageSet" data-locale="imageSet"></label>
            <select
              id="imageSet"
              value={store.settings.imageSet}
              onChange={(e) => handleSettingChange('imageSet', e.currentTarget.value)}
              aria-label="Select background image set"
            >
              <option value="nature" data-locale="nature"></option>
              <option value="seyh-muhammed-nazim-adil-el-hakkani" data-locale="name"></option>
            </select>
          </div>
          <div class={styles.settingItem}>
            <label for="primaryLang" data-locale="primaryPreferedLanguage"></label>
            <select
              id="primaryLang"
              value={store.settings.primaryPreferredLanguage}
              onChange={(e) => handleSettingChange('primaryPreferredLanguage', e.currentTarget.value)}
              aria-label="Select primary language"
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
              <option value="ar">عَرَبِيّ</option>
            </select>
          </div>
          <div class={styles.settingItem}>
            <label for="secondaryLang" data-locale="secondaryPreferedLanguage"></label>
            <select
              id="secondaryLang"
              value={store.settings.secondaryPreferredLanguage}
              onChange={(e) => handleSettingChange('secondaryPreferredLanguage', e.currentTarget.value)}
              aria-label="Select secondary language"
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
              <option value="ar">عَرَبِيّ</option>
            </select>
          </div>
          <div class={styles.settingItem}>
            <label for="sort" data-locale="defaultSorting"></label>
            <select
              id="sort"
              value={store.settings.sort}
              onChange={(e) => handleSettingChange('sort', e.currentTarget.value)}
              aria-label="Choose how videos are sorted"
            >
              <option value="date-desc" data-locale="sortByRecordDateDesc"></option>
              <option value="date-asc" data-locale="sortByRecordDateAsc"></option>
              <option value="duration-desc" data-locale="sortByRecordDurationDesc"></option>
              <option value="duration-asc" data-locale="sortByRecordDurationAsc"></option>
            </select>
          </div>
          <div class={styles.settingItem}>
            <label for="filter" data-locale="defaultFilter"></label>
            <select
              id="filter"
              value={store.settings.filter}
              onChange={(e) => handleSettingChange('filter', e.currentTarget.value)}
              aria-label="Filter videos by language or favorites"
            >
              <option value="all" data-locale="displayAll"></option>
              <option value="fav" data-locale="displayMyFavorites"></option>
              <option value="en" data-locale="displayOnlyEnglishRecords"></option>
              <option value="ar" data-locale="displayOnlyArabicRecords"></option>
              <option value="tr" data-locale="displayOnlyTurkishRecords"></option>
            </select>
          </div>
          <div class={styles.settingItem}>
            <label class={styles.checkboxLabel} for="displayWatchedRecords" data-locale="displayWatchedRecords"></label>
            <input
              type="checkbox"
              id="displayWatchedRecords"
              checked={store.settings.displayWatchedRecords}
              onChange={(e) => handleSettingChange('displayWatchedRecords', e.currentTarget.checked)}
            />
          </div>
          <div class={styles.settingItem}>
            <label class={styles.checkboxLabel} for="autoPlayVideo" data-locale="autoPlayVideo"></label>
            <input
              type="checkbox"
              id="autoPlayVideo"
              checked={store.settings.autoPlayVideo}
              onChange={(e) => handleSettingChange('autoPlayVideo', e.currentTarget.checked)}
            />
          </div>
          <div class={styles.settingItem}>
            <label class={styles.checkboxLabel} for="autoMarkWatched" data-locale="autoMarkWatched"></label>
            <input
              type="checkbox"
              id="autoMarkWatched"
              checked={store.settings.autoMarkWatched}
              onChange={(e) => handleSettingChange('autoMarkWatched', e.currentTarget.checked)}
            />
          </div>
        </div>

        <div class={styles.signature}>
          <img src="/images/signature.png" alt="Signature" />
        </div>
      </div>
    </div>
  );
};
