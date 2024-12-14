import { Component, For, Show, createEffect, createSignal, createMemo } from 'solid-js';
import { useStore } from '../store';
import { VideoRecord } from '../types';
import styles from './VideoList.module.css';

interface VideoListProps {
  searchQuery?: string;
  onVideoSelect: (video: VideoRecord, event: MouseEvent) => void;
}

export const VideoList: Component<VideoListProps> = (props) => {
  const { store, videos, isWatched, isFavorite, ITEMS_PER_PAGE } = useStore();
  const [page, setPage] = createSignal(0);
  const [error, setError] = createSignal<Error | null>(null);

  // Memoize video functions
  const videoFunctions = createMemo(() => ({
    getVideoUrl: (path: string) => `http://d2jkz25f7wglz0.cloudfront.net/${path}`,
    getThumbnailUrl: (videoId: string) => {
      const imageSet = store.settings.imageSet;
      const id = parseInt(videoId);
      return imageSet === 'seyh-muhammed-nazim-adil-el-hakkani'
        ? `/images/seyh-muhammed-nazim-adil-el-hakkani/${id % 27}.webp`
        : `/images/nature/${id % 36}.webp`;
    },
    formatDuration: (duration: number) => {
      if (!duration) return '';
      if (duration >= 60) {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return `${hours}h${minutes ? ` ${minutes}m` : ''}`;
      }
      return `${duration}m`;
    }
  }));

  // Memoize video processing
  const processedVideos = createMemo(() => {
    const endIndex = (page() + 1) * ITEMS_PER_PAGE;
    const allVideos = videos();
    if (!allVideos) return [];

    const funcs = videoFunctions();
    return allVideos.slice(0, endIndex).map(video => ({
      ...video,
      title: video.title[0]?.text || '',
      description: video.info[0]?.text || '',
      videoUrl: funcs.getVideoUrl(video.url),
      thumbnailUrl: funcs.getThumbnailUrl(video.id),
      formattedDuration: funcs.formatDuration(video.duration),
      isWatched: isWatched(video.id),
      isFavorite: isFavorite(video.id),
      date: new Date(video.created * 1000)
    }));
  });

  // Simplified infinite scroll
  let loadMoreRef: HTMLDivElement | undefined;

  createEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries[0].isIntersecting && setPage(p => p + 1),
      { rootMargin: '100px' }
    );

    if (loadMoreRef) observer.observe(loadMoreRef);
    return () => observer.disconnect();
  });

  // Error boundary handler
  if (error()) {
    return (
      <div class={styles.error}>
        <p>Something went wrong. Please try refreshing the page.</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  return (
    <div class={styles.container} role="region" aria-label="Video gallery">
      <Show
        when={processedVideos().length > 0}
        fallback={
          <div class={styles.noResults} role="status">
            <p>No videos found</p>
          </div>
        }
      >
        <div class={styles.grid}>
          <For each={processedVideos()}>
            {(video) => (
              <article
                class={`${styles.card} ${video.isWatched ? styles.watched : ''}`}
                tabindex="0"
                role="button"
                aria-label={`Play video: ${video.title}`}
                onClick={(e) => {
                  try {
                    props.onVideoSelect(video, e);
                  } catch (err) {
                    setError(err as Error);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    props.onVideoSelect(video, e as unknown as MouseEvent);
                  }
                }}
                data-id={video.id}
                data-url={video.videoUrl}
              >
                <div class={styles.thumbnail}>
                  <img
                    src={video.thumbnailUrl}
                    alt={`Thumbnail for ${video.title}`}
                    loading="lazy"
                    decoding="async"
                    width="280"
                    height="158"
                  />
                  <div class={styles.badges} aria-label="Video attributes">
                    <Show when={video.lang}>
                      <span class={styles.badge} title={`Language: ${video.lang}`}>
                        {video.lang === 'turkish' ? 'TR' :
                          video.lang === 'english' ? 'EN' :
                            video.lang === 'arabic' ? 'AR' : ''}
                      </span>
                    </Show>
                    <Show when={video.duration}>
                      <span class={styles.badge} title="Duration">
                        {video.formattedDuration}
                      </span>
                    </Show>
                    <Show when={video.isWatched}>
                      <span class={styles.badge} title="Watched" aria-label="Video watched">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    </Show>
                    <Show when={video.isFavorite}>
                      <span class={styles.badge} title="Favorite" aria-label="Favorite video">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      </span>
                    </Show>
                  </div>
                  <div class={styles.dateWrapper}>
                    <svg
                      class={styles.dateIcon}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <time
                      datetime={video.date.toISOString()}
                      title={video.date.toLocaleString()}
                    >
                      {video.date.toLocaleDateString()}
                    </time>
                  </div>
                </div>
                <div class={styles.content}>
                  <h3 class={styles.title}>
                    {props.searchQuery && props.searchQuery.length > 0 && video.title ? (
                      <span
                        innerHTML={video.title.replace(
                          new RegExp(`(${props.searchQuery})`, 'gi'),
                          `<mark class="${styles.highlight}">$1</mark>`
                        )}
                      />
                    ) : (
                      video.title
                    )}
                  </h3>
                  <p class={styles.description}>
                    {props.searchQuery && props.searchQuery.length > 0 && video.description ? (
                      <span
                        innerHTML={video.description.replace(
                          new RegExp(`(${props.searchQuery})`, 'gi'),
                          `<mark class="${styles.highlight}">$1</mark>`
                        )}
                      />
                    ) : (
                      video.description
                    )}
                  </p>
                </div>
              </article>
            )}
          </For>
        </div>
      </Show>

      <Show when={processedVideos().length < (videos()?.length || 0)}>
        <div class={styles.loadMore} ref={loadMoreRef}>
          <button class={styles.loadMoreButton} aria-label="Load more videos">
            Load More
          </button>
        </div>
      </Show>
    </div>
  );
};

export default VideoList;
