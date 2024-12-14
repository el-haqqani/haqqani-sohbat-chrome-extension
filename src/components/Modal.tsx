import { Component, Show, createEffect, createSignal, ErrorBoundary, onMount } from 'solid-js';
import { useStore } from '../store';
import { VideoRecord, LocalizedText } from '../types';
import styles from './Modal.module.css';

interface ModalProps {
  video: VideoRecord | null;
  onClose: () => void;
}

export const Modal: Component<ModalProps> = (props) => {
  const { store, isWatched, isFavorite, updateWatchedStatus, updateFavoriteStatus } = useStore();
  const [isModalOpen, setIsModalOpen] = createSignal(!!props.video);

  // Handle keyboard events
  createEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleClose = () => {
    setIsModalOpen(false);
    props.onClose();
  };

  // Update isModalOpen when video prop changes
  createEffect(() => {
    setIsModalOpen(!!props.video);
  });

  // Track whether this specific video has been auto-marked in this modal session
  const [autoMarkedVideos, setAutoMarkedVideos] = createSignal<Set<string>>(new Set());

  // One-time check to suggest marking video as watched when modal opens
  createEffect(() => {
    if (props.video) {
      // Check if this specific video has already been auto-marked in this session
      const currentVideoId = props.video.id;
      const hasBeenAutoMarked = autoMarkedVideos().has(currentVideoId);

      // Only auto-mark if not previously auto-marked
      if (!hasBeenAutoMarked) {
        if (store.settings.autoMarkWatched) {
          updateWatchedStatus(currentVideoId, true);

          // Add this video to the set of auto-marked videos
          setAutoMarkedVideos(prev => {
            const newSet = new Set(prev);
            newSet.add(currentVideoId);
            return newSet;
          });
        }
      }

      document.querySelectorAll('[data-locale]').forEach(elem => {
        elem.innerText = chrome.i18n.getMessage(elem.dataset.locale)
      });
    }
  });

  // Get localized content
  const getLocalizedContent = (content: any) => {
    // If content is undefined or not an array, return empty string
    if (!content) return '';

    // If content is already a string, return it directly
    if (typeof content === 'string') return content;

    // If content is an array of LocalizedText
    if (Array.isArray(content)) {
      const { primaryPreferredLanguage, secondaryPreferredLanguage } = store.settings;

      // Try to find content in primary preferred language
      const primaryLangContent = content.find((item: any) => item.lang === primaryPreferredLanguage);
      if (primaryLangContent) return primaryLangContent.text;

      // Try to find content in secondary preferred language
      const secondaryLangContent = content.find((item: any) => item.lang === secondaryPreferredLanguage);
      if (secondaryLangContent) return secondaryLangContent.text;

      // If no preferred language found, return the first item's text
      return content[0]?.text || '';
    }

    // If content is an object (like the previous Record<string, string>)
    if (typeof content === 'object') {
      return content['en'] || content['tr'] || Object.values(content)[0] || '';
    }

    // Fallback
    return '';
  };

  // Add error boundary
  const handleError = (error: Error) => {
    console.error('Modal Error:', error);
    props.onClose();
  };

  const getVideoUrl = (relativeUrl?: string) => {
    if (!relativeUrl) return '';

    // If it's already a full URL, return as is
    if (relativeUrl.startsWith('http')) return relativeUrl;

    // Use CloudFront distribution URL for videos
    return `http://d2jkz25f7wglz0.cloudfront.net/${relativeUrl}`;
  };

  const getTranscriptionUrl = (relativeUrl?: string) => {
    if (!relativeUrl) return '';

    // If it's already a full URL, return as is
    if (relativeUrl.startsWith('http')) return relativeUrl;

    // Use CloudFront distribution URL for transcriptions
    return `http://saltanat-transcriptions.s3.amazonaws.com/${relativeUrl}`;
  };

  return (
    <Show when={props.video}>
      <div
        class={`${styles.overlay} ${isModalOpen() ? styles.isOpen : ''}`}
        onClick={handleClose}
      >
        <div
          class={`${styles.modal} ${isModalOpen() ? styles.isOpen : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div class={styles.header}>
            <h2 class={styles.title}>
              {getLocalizedContent(props.video?.title)}
            </h2>
            <button
              class={styles.closeButton}
              onClick={handleClose}
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class={styles.content}>
            <div class={styles.videoContainer}>
              <video
                class={styles.video}
                src={getVideoUrl(props.video?.url)}
                controls
                autoplay={!!store.settings.autoPlayVideo}
                preload="metadata"
                aria-label={`Video: ${getLocalizedContent(props.video?.title)}`}
              ></video>
            </div>

            <div class={styles.metadata}>
              <div class={styles.info}>
                <p class={styles.infoContent}>{getLocalizedContent(props.video?.info)}</p>

                <Show when={props.video?.transcriptions?.length > 0}>
                  <h3 class={styles.infoTitle} data-locale="transcriptions"></h3>
                  <ul class={styles.transcriptionList}>
                    {props.video?.transcriptions
                      .map((transcription) => (
                        <li class={styles.transcriptionItem}>
                          <a
                            href={getTranscriptionUrl(transcription.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            class={styles.transcriptionLink}
                          >
                            {transcription.lang === 'en' ? 'English' :
                              transcription.lang === 'tr' ? 'Turkish' :
                                transcription.lang === 'ar' ? 'Arabic' : transcription.lang}
                          </a>
                        </li>
                      ))
                    }
                  </ul>
                </Show>

                <div class={styles.actions}>
                  <button
                    class={styles.actionButton}
                    classList={{
                      [styles.active]: isWatched(props.video?.id)
                    }}
                    onClick={() => updateWatchedStatus(props.video?.id, !isWatched(props.video?.id))}
                    aria-pressed={isWatched(props.video?.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    {isWatched(props.video?.id) ? 'Watched' : 'Mark as Watched'}
                  </button>

                  <button
                    class={styles.actionButton}
                    classList={{
                      [styles.active]: isFavorite(props.video?.id)
                    }}
                    onClick={() => updateFavoriteStatus(props.video?.id, !isFavorite(props.video?.id))}
                    aria-pressed={isFavorite(props.video?.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    {isFavorite(props.video?.id) ? 'Favorited' : 'Add to Favorites'}
                  </button>
                </div>
              </div>

              <Show when={props.video?.transcription}>
                <div class={styles.transcription}>
                  <h3 class={styles.transcriptionTitle}>Transcription</h3>
                  <p class={styles.transcriptionText}>
                    {getLocalizedContent(props.video?.transcription)}
                  </p>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}

export default Modal;
