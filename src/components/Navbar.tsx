import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, Menu, X, Search, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LunoraLogo } from './LunoraLogo';
import { smoothScrollTo } from '../lib/scrollAnimation';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string, param?: string) => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories?: string[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  wishlistCount,
  onOpenWishlist,
  searchQuery,
  onSearchChange,
  categories = [],
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('collection');
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sticky header background & elevation dynamics on scroll across all routes
  useEffect(() => {
    const handleScrollElevation = () => {
      setIsScrolled(window.scrollY > 12);
    };

    window.addEventListener('scroll', handleScrollElevation, { passive: true });
    handleScrollElevation();
    return () => window.removeEventListener('scroll', handleScrollElevation);
  }, []);

  // Helper to remove any leftover scroll lock or touch-action from document
  const unlockBodyScroll = useCallback(() => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.touchAction = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.position = '';
    document.documentElement.style.top = '';
    document.documentElement.style.touchAction = '';
  }, []);

  // Bug Fix: When route, URL, or hash changes, immediately close drawer and restore scroll
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchExpanded(false);
    unlockBodyScroll();
  }, [currentRoute, unlockBodyScroll]);

  // Listen to browser navigation (back/forward and hash links)
  useEffect(() => {
    const handleLocationChange = () => {
      setMobileMenuOpen(false);
      unlockBodyScroll();
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      unlockBodyScroll();
    };
  }, [unlockBodyScroll]);

  // Clean unmount safety
  useEffect(() => {
    return () => {
      unlockBodyScroll();
    };
  }, [unlockBodyScroll]);

  // Body scroll lock and Escape key listener while drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) {
      unlockBodyScroll();
      return;
    }

    // Apply scroll lock
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        unlockBodyScroll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
    };
  }, [mobileMenuOpen, unlockBodyScroll]);

  // Scroll spy for active section highlight (home route only)
  useEffect(() => {
    if (currentRoute !== 'home') {
      setActiveSection('');
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollY + windowHeight >= documentHeight - 150) {
        setActiveSection('disclosure');
        return;
      }

      const disclosureEl = document.getElementById('disclosure');
      const collectionEl = document.getElementById('collection');
      const featuredEl = document.getElementById('featured');
      const categoriesEl = document.getElementById('categories');

      const offset = 160;

      if (disclosureEl && scrollY >= disclosureEl.offsetTop - offset) {
        setActiveSection('disclosure');
      } else if (collectionEl && scrollY >= collectionEl.offsetTop - offset) {
        setActiveSection('collection');
      } else if (featuredEl && scrollY >= featuredEl.offsetTop - offset) {
        setActiveSection('collection');
      } else if (categoriesEl && scrollY >= categoriesEl.offsetTop - offset) {
        setActiveSection('categories');
      } else {
        setActiveSection('collection');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentRoute]);

  const scrollToAnchor = useCallback(
    (anchorId: string) => {
      // (a) close the drawer and fully remove the body scroll-lock immediately
      setMobileMenuOpen(false);
      unlockBodyScroll();

      // (b) wait for the close animation to finish (~300ms)
      setTimeout(() => {
        // Guarantee body scroll lock is completely cleared
        unlockBodyScroll();

        if (currentRoute !== 'home') {
          onNavigate('home', anchorId);
          return;
        }

        // (c) scroll to the target with window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerHeight - 8, behavior: 'smooth' })
        const target = document.getElementById(anchorId);
        const headerEl = document.querySelector('.site-header') as HTMLElement | null;
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);

        if (anchorId === 'hero' || anchorId === 'top' || !target) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth',
          });
        }

        try {
          window.history.pushState(null, '', anchorId === 'hero' ? '/' : `#${anchorId}`);
        } catch {
          window.location.hash = anchorId === 'hero' ? '' : `#${anchorId}`;
        }
      }, 300);
    },
    [currentRoute, onNavigate, unlockBodyScroll]
  );

  const handleCategorySelect = (categoryName: string) => {
    setMobileMenuOpen(false);
    unlockBodyScroll();
    setTimeout(() => {
      unlockBodyScroll();
      onNavigate('category-filter', categoryName);
    }, 300);
  };

  const dynamicCategoryList = categories.length > 0 ? categories : [
    'Gaming',
    'Tech & Gadgets',
    'Beauty & Grooming',
    'Home & Decor',
    'Fashion & Accessories',
    'Wellness & Self-Care',
    'Kitchen & Living',
    'Travel & Everyday Carry',
  ];

  const isCollectionActive =
    currentRoute === 'home' && (activeSection === 'collection' || (!activeSection && !['disclosure', 'categories'].includes(activeSection)));
  const isCategoriesActive =
    currentRoute === 'categories' || (currentRoute === 'home' && activeSection === 'categories');
  const isDisclosureActive =
    currentRoute === 'disclosure' || currentRoute === 'about' || (currentRoute === 'home' && activeSection === 'disclosure');

  return (
    <header
      className={`site-header fixed top-0 left-0 right-0 z-50 w-full ${
        isScrolled ? 'site-header--scrolled' : 'site-header--top'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-2 md:gap-4 flex-nowrap">
        
        {/* Brand Logo on the Left - min-w-0 so it can shrink cleanly */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollToAnchor('hero');
          }}
          className="focus:outline-none min-w-0 flex-shrink transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Lunora Picks Home"
        >
          <LunoraLogo size="md" />
        </a>

        {/* Right Action Controls: single clean horizontal row at ALL screen widths */}
        <div className="flex items-center gap-[3px] min-[390px]:gap-1 sm:gap-1.5 md:gap-3 flex-nowrap flex-shrink-0">
          
          {/* Quick Search */}
          <div className="relative flex-shrink-0">
            {searchExpanded ? (
              <div className="flex items-center bg-[var(--theme-bg-input)] border border-[var(--theme-border-medium)] rounded-full px-2.5 sm:px-3.5 py-1 min-h-[36px] md:min-h-[42px] w-40 min-[380px]:w-48 sm:w-60 md:w-72 shadow-lg transition-all">
                <Search className="w-4 h-4 text-[var(--theme-icon-accent)] mr-1.5 sm:mr-2 flex-shrink-0" strokeWidth={2.25} />
                <input
                  type="text"
                  placeholder="Search catalog finds..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  className="bg-transparent text-[16px] sm:text-xs text-[var(--theme-text-primary)] focus:outline-none w-full placeholder:text-[var(--theme-input-placeholder)]"
                />
                <button
                  type="button"
                  onClick={() => { setSearchExpanded(false); onSearchChange(''); }}
                  className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] ml-1 p-0.5 sm:p-1 rounded-full hover:bg-[var(--theme-bg-active)] transition-all duration-200"
                  aria-label="Close search"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchExpanded(true)}
                aria-label="Search catalog"
                title="Search catalog"
                className="header-action-btn flex-shrink-0 group text-[#1A1917] dark:text-[#edebe6] hover:text-[#8C6A24] dark:hover:text-[#e6ca85]"
              >
                <Search className="w-5 h-5 text-[#1A1917] dark:text-[#edebe6] group-hover:text-[#8C6A24] dark:group-hover:text-[#e6ca85] transition-all duration-200 group-hover:scale-110" strokeWidth={2.25} />
              </button>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="header-action-btn flex-shrink-0 group text-[#1A1917] dark:text-[#edebe6] hover:text-[#8C6A24] dark:hover:text-[#e6ca85]"
            title="Saved Items"
            aria-label={`Saved Items (${wishlistCount})`}
          >
            <Heart className="w-5 h-5 text-[#1A1917] dark:text-[#edebe6] group-hover:text-[#8C6A24] dark:group-hover:text-[#e6ca85] transition-all duration-200 group-hover:scale-110" strokeWidth={2.25} />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#A07C2E] dark:bg-[#e6ca85] text-white dark:text-[#0b0c0f] text-[10px] font-bold flex items-center justify-center font-mono shadow-sm">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Light / Dark Mode Toggle */}
          <ThemeToggle variant="header" className="flex-shrink-0" />

          {/* Universal Hamburger Menu Trigger - ALWAYS visible at every width (mobile, tablet, desktop) */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              if (mobileMenuOpen) {
                setMobileMenuOpen(false);
                unlockBodyScroll();
              } else {
                setMobileMenuOpen(true);
              }
            }}
            className="header-menu-trigger header-action-btn flex-shrink-0 group text-[#1A1917] dark:text-[#edebe6] hover:text-[#8C6A24] dark:hover:text-[#e6ca85]"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            title={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90 text-[#1A1917] dark:text-[#e6ca85]" strokeWidth={2.25} />
            ) : (
              <Menu className="w-5 h-5 text-[#1A1917] dark:text-[#edebe6] group-hover:text-[#8C6A24] dark:group-hover:text-[#e6ca85] transition-transform duration-200 group-hover:scale-110" strokeWidth={2.25} />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Drawer with Overlay Backdrop (Full width on mobile; Right-side 400px panel on tablet/desktop) */}
      {mobileMenuOpen && (
        <div className="drawer-portal fixed inset-0 top-[var(--header-h)] md:top-0 z-40 md:z-[55] pointer-events-auto">
          {/* Dimmed Backdrop (tap to close) */}
          <div
            className="drawer-backdrop mobile-drawer-backdrop fixed inset-0 top-[var(--header-h)] md:top-0 bg-black/60 transition-opacity duration-300 animate-fade-in"
            onClick={() => {
              setMobileMenuOpen(false);
              unlockBodyScroll();
            }}
            onTouchMove={(e) => e.preventDefault()}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            ref={mobileMenuRef}
            className="drawer-panel mobile-drawer-panel fixed top-[var(--header-h)] left-0 right-0 max-h-[calc(100vh-var(--header-h))] md:top-0 md:left-auto md:right-0 md:bottom-0 md:w-[400px] md:max-w-[420px] md:h-full md:max-h-full z-[45] md:z-[60] shadow-2xl px-5 py-6 space-y-5 animate-drawer-in overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-l"
            role="dialog"
            aria-label="Site Navigation"
          >
            {/* Drawer Header Row with Title and Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border-subtle)]">
              <span className="font-serif text-sm tracking-[0.2em] uppercase font-semibold text-[var(--theme-text-primary)]">
                Menu
              </span>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  unlockBodyScroll();
                }}
                className="header-action-btn"
                aria-label="Close menu"
                title="Close menu"
              >
                <X className="w-5 h-5 text-[var(--theme-text-primary)]" strokeWidth={2.25} />
              </button>
            </div>

            {/* Search Bar inside Drawer (46px height, 16px font on mobile) */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 drawer-search-icon" strokeWidth={2.25} />
              <input
                type="text"
                placeholder="Search catalog finds..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full drawer-search-box rounded-xl pl-10 pr-9 min-h-[46px] py-2.5 text-[16px] sm:text-sm focus:outline-none focus:ring-1 focus:ring-[var(--theme-border-strong)] shadow-xs transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-3 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Nav Links Stack */}
            <div className="flex flex-col space-y-2 text-xs uppercase tracking-[0.16em]">
              {/* Collection */}
              <a
                href="#collection"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToAnchor('collection');
                }}
                className={`text-left py-3 px-4 rounded-xl flex items-center justify-between min-h-[46px] drawer-nav-item ${
                  isCollectionActive ? 'active' : ''
                }`}
              >
                <span className="font-serif text-sm tracking-wider capitalize font-medium">Collection</span>
                <span className="drawer-nav-indicator text-[11px]">01</span>
              </a>

              {/* Categories */}
              <a
                href="#categories"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToAnchor('categories');
                }}
                className={`text-left py-3 px-4 rounded-xl flex items-center justify-between min-h-[46px] drawer-nav-item ${
                  isCategoriesActive ? 'active' : ''
                }`}
              >
                <span className="font-serif text-sm tracking-wider capitalize font-medium">Categories</span>
                <span className="drawer-nav-indicator text-[11px]">02</span>
              </a>

              {/* Quick Category Filters inside Menu Drawer */}
              <div className="p-3.5 rounded-xl drawer-filter-box space-y-2.5">
                <p className="text-[11px] uppercase tracking-[0.2em] font-mono flex items-center gap-1.5 font-medium text-[var(--theme-text-muted)]">
                  <Sparkles className="w-3 h-3 text-[var(--theme-icon-accent)]" />
                  <span>Quick Category Filters</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {dynamicCategoryList.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className="text-left py-2 px-3 rounded-lg drawer-filter-pill text-[11px] sm:text-xs font-medium truncate min-h-[38px] flex items-center shadow-xs"
                    >
                      <span className="truncate">• {cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Items (Wishlist) */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  unlockBodyScroll();
                  setTimeout(() => {
                    unlockBodyScroll();
                    onOpenWishlist();
                  }, 300);
                }}
                className="text-left py-3 px-4 rounded-xl flex items-center justify-between min-h-[46px] drawer-nav-item"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-[var(--theme-icon-accent)]" strokeWidth={2.25} />
                  <span className="font-serif text-sm tracking-wider capitalize font-medium">Saved Items</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full drawer-badge font-mono text-[11px] font-bold">
                  {wishlistCount}
                </span>
              </button>

              {/* Disclosure */}
              <a
                href="#disclosure"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToAnchor('disclosure');
                }}
                className={`text-left py-3 px-4 rounded-xl flex items-center justify-between min-h-[46px] drawer-nav-item ${
                  isDisclosureActive ? 'active' : ''
                }`}
              >
                <span className="font-serif text-sm tracking-wider capitalize font-medium">Disclosure</span>
                <span className="drawer-nav-indicator text-[11px]">03</span>
              </a>

              {/* Theme Toggle inside Drawer */}
              <div className="pt-2">
                <ThemeToggle variant="mobile" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
