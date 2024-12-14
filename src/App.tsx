import { Component, createSignal, onMount, Show } from 'solid-js';
import styles from './App.module.css';
import { VideoRecord } from './types';
import { VideoList } from './components/VideoList';
import { Modal } from './components/Modal';
import Header from './components/Header';
import { useStore, searchQuery } from './store';

const App: Component = () => {
  const { store, loadSettings, loadWatchedRecords, loadFavorites } = useStore();
  const [selectedVideo, setSelectedVideo] = createSignal<VideoRecord | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  // Load initial data
  onMount(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load settings first as they affect how videos are displayed
      await loadSettings();

      // Load watched and favorites in parallel
      await Promise.all([
        loadWatchedRecords(),
        loadFavorites()
      ]);

      // Check for video ID in URL params
      const params = new URLSearchParams(window.location.search);
      const videoId = params.get('videoId');
      if (videoId) {
        const video = store.records.find(v => v.id === videoId);
        if (video) {
          setSelectedVideo(video);
        }
      }

      document.querySelectorAll('[data-locale]').forEach(elem => {
        elem.innerText = chrome.i18n.getMessage(elem.dataset.locale)
      });
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load data. Please refresh the page or try again later.');
    } finally {
      setIsLoading(false);
    }
  });

  const handleVideoSelect = (video: VideoRecord, event: MouseEvent) => {
    // Check if it's a middle click or ctrl/cmd+click
    const shouldOpenInNewTab = event.ctrlKey || event.metaKey || event.button === 1;

    if (shouldOpenInNewTab) {
      // Prevent default behavior
      event.preventDefault();
      // Open in new tab
      const url = chrome.runtime.getURL('index.html');
      window.open(`${url}?videoId=${video.id}`, '_blank');
    } else {
      setSelectedVideo(video);
    }
  };


  return (
    <div class={styles.App}>
      <Header />
      <Show
        when={!isLoading()}
        fallback={
          <div class={styles.loading}>
            <div class={styles.spinner} />
            <p>Loading videos...</p>
          </div>
        }
      >
        <Show
          when={!error()}
          fallback={
            <div class={styles.error}>
              <p>{error()}</p>
              <button onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          }
        >
          <VideoList onVideoSelect={handleVideoSelect} searchQuery={searchQuery()} />
        </Show>
      </Show>
      <Modal video={selectedVideo()} onClose={() => setSelectedVideo(null)} />
    </div>
  );
};

export default App;
