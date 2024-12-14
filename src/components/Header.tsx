import { Component, createEffect, createSignal, onCleanup } from 'solid-js';
import { useStore } from '../store';
import styles from './Header.module.css';
import { Settings } from './Settings';
import { debounce } from 'lodash-es';

const Header: Component = () => {
  const store = useStore();
  const [isFocused, setIsFocused] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(true);
  let lastScrollY = window.scrollY;

  const handleScroll = () => {
    if (window.scrollY > lastScrollY) {
      setIsVisible(false); // Scrolling down
    } else {
      setIsVisible(true); // Scrolling up
    }
    lastScrollY = window.scrollY;
  };

  window.addEventListener('scroll', handleScroll);
  onCleanup(() => window.removeEventListener('scroll', handleScroll));

  // Debounced search handler
  const handleSearch = debounce((value: string) => {
    store.setSearchTerm(value);
  }, 50);

  // Clean up debounce on component cleanup
  createEffect(() => {
    return () => {
      handleSearch.cancel();
    };
  });

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const input = e.currentTarget as HTMLInputElement;
      input.value = '';
      handleSearch('');
      input.blur();
    }
  };

  return (
    <header class={styles.header} role="banner">
      <div class={styles.container}>
        <h1 class={styles.title}>
          <img
            src="/icons/48.png"
            alt="Hakkani Logo"
            class={styles.logo}
            width="32"
            height="32"
          />
          <span data-locale="sheikh"></span> <b data-locale="name"></b> <span
            data-locale="sohbats"></span>
        </h1>
        {isVisible() && (
          <div class={`${styles.headerSecondLine} ${!isVisible() ? styles.hidden : ''}`}>
            <div class={`${styles.searchContainer} ${isFocused() ? styles.focused : ''}`} role="search">
              <input
                type="search"
                class={styles.searchInput}
                placeholder={`Search ${store.videos()?.length || 0} videos...`}
                onInput={(e) => handleSearch(e.currentTarget.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyPress}
                aria-label="Search videos"
              />
              <svg
                class={styles.searchIcon}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            <div class={styles.headerActions}>
              <div class={styles.stats} role="status" aria-label="Video statistics">
                <div
                  class={styles.statItem}
                  title="Watched Videos"
                  role="status"
                  aria-label={`${store.watchedVideos().length} videos watched`}
                >
                  <svg
                    class={styles.statIcon}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span aria-hidden="true">{store.watchedVideos().length}</span>
                </div>

                <div
                  class={styles.statItem}
                  title="Favorite Videos"
                  role="status"
                  aria-label={`${store.favoriteVideos().length} favorite videos`}
                >
                  <svg
                    class={styles.statIcon}
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
                  <span aria-hidden="true">{store.favoriteVideos().length}</span>
                </div>
              </div>

              <Settings />
            </div>
          </div>)}
      </div>
    </header >
  );
};

export default Header;
