import React, { useState, useEffect, useCallback } from 'react';
import { Product, SiteSettings } from './types';
import {
  getProducts,
  getSettings,
  getProductBySlug,
  incrementClickCount,
  buildAmazonAffiliateUrl,
  getWishlist,
  toggleWishlist,
  getSupabase,
} from './lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { WishlistModal } from './components/WishlistModal';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AboutDisclosurePage } from './pages/AboutDisclosurePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { INITIAL_PRODUCTS } from './data/seedData';
import { getSavedTheme, applyThemeToDom } from './lib/theme';
import { smoothScrollTo } from './lib/scrollAnimation';

type AppRoute = 'home' | 'categories' | 'category' | 'product' | 'disclosure' | 'about' | 'admin';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [routeParam, setRouteParam] = useState<string>('');
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<SiteSettings>({
    amazon_affiliate_tag: 'lunorapicks-20',
    site_title: 'Lunora Picks',
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [adminUser, setAdminUser] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Initial Data
  const refreshProducts = async () => {
    const items = await getProducts();
    if (Array.isArray(items)) {
      setProducts(items);
    }
  };

  const refreshSettings = async () => {
    const s = await getSettings();
    setSettings(s);
  };

  useEffect(() => {
    refreshProducts();
    refreshSettings();
    setWishlistIds(getWishlist());

    // Apply saved manual theme choice or follow system preference
    const saved = getSavedTheme();
    if (saved) {
      applyThemeToDom(saved);
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
        // Only react to OS changes if visitor has not set a manual override
        if (!getSavedTheme()) {
          applyThemeToDom(e.matches ? 'dark' : 'light');
        }
      };

      handleThemeChange(mediaQuery);

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleThemeChange);
        return () => mediaQuery.removeEventListener('change', handleThemeChange);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handleThemeChange);
        return () => (mediaQuery as any).removeListener(handleThemeChange);
      }
    }
  }, []);

  // Listen to real Supabase session on load and on auth change
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setAdminUser(null);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setAdminUser(session.user.email);
      } else {
        setAdminUser(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setAdminUser(session.user.email);
      } else {
        setAdminUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Parse current URL path for clean slugs (e.g., /product/:slug, /admin, /out/:slug, #anchor)
  const syncRouteFromLocation = useCallback(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash.replace(/^#\/?/, '');

    const rawPath = pathname.length > 1 ? pathname : hash ? `/${hash}` : '/';
    const cleanPath = rawPath.replace(/\/+$/, '') || '/';

    if (cleanPath.startsWith('/product/')) {
      const slug = cleanPath.replace('/product/', '');
      setRoute('product');
      setRouteParam(slug);
    } else if (cleanPath.startsWith('/out/')) {
      const slug = cleanPath.replace('/out/', '');
      handleOutRedirect(slug);
    } else if (cleanPath.startsWith('/category/')) {
      const cat = decodeURIComponent(cleanPath.replace('/category/', ''));
      setRoute('home');
      setSelectedCategory(cat);
      setTimeout(() => {
        const target = document.getElementById('collection');
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
        if (target) {
          window.scrollTo({
            top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
            behavior: 'smooth',
          });
        }
      }, 150);
    } else if (cleanPath === '/categories' || hash === 'categories') {
      setRoute('home');
      setTimeout(() => {
        const target = document.getElementById('categories');
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
        if (target) {
          window.scrollTo({
            top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
            behavior: 'smooth',
          });
        }
      }, 150);
    } else if (cleanPath === '/disclosure' || cleanPath === '/about' || hash === 'disclosure' || hash === 'about') {
      setRoute('home');
      setTimeout(() => {
        const target = document.getElementById('disclosure');
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
        if (target) {
          window.scrollTo({
            top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
            behavior: 'smooth',
          });
        }
      }, 150);
    } else if (cleanPath === '/collection' || hash === 'collection' || hash === 'catalog') {
      setRoute('home');
      setTimeout(() => {
        const target = document.getElementById('collection');
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
        if (target) {
          window.scrollTo({
            top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
            behavior: 'smooth',
          });
        }
      }, 150);
    } else if (hash === 'featured') {
      setRoute('home');
      setTimeout(() => {
        const target = document.getElementById('featured');
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
        if (target) {
          window.scrollTo({
            top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
            behavior: 'smooth',
          });
        }
      }, 150);
    } else if (cleanPath === '/admin') {
      setRoute('admin');
    } else {
      setRoute('home');
      if (hash && hash !== 'hero' && hash !== 'top') {
        setTimeout(() => {
          const target = document.getElementById(hash);
          const headerEl = document.querySelector('.site-header');
          const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
          if (target) {
            window.scrollTo({
              top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
              behavior: 'smooth',
            });
          }
        }, 150);
      }
    }
  }, []);

  useEffect(() => {
    syncRouteFromLocation();
    window.addEventListener('popstate', syncRouteFromLocation);
    return () => window.removeEventListener('popstate', syncRouteFromLocation);
  }, [syncRouteFromLocation]);

  // Set noindex meta tag for /admin route so search engines don't index it
  useEffect(() => {
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (route === 'admin') {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.name = 'robots';
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.content = 'noindex, nofollow, noarchive';
      document.title = adminUser ? 'Admin Dashboard — Lunora Picks' : 'Admin Authentication — Lunora Picks';
    } else {
      if (robotsMeta) {
        robotsMeta.content = 'index, follow';
      }
      if (route === 'home') {
        document.title = 'Lunora Picks — Handpicked Finds & Everyday Essentials';
      } else if (route === 'product' && selectedProduct) {
        document.title = `${selectedProduct.title} — Lunora Picks`;
      }
    }
  }, [route, adminUser, selectedProduct, routeParam]);

  // Sync selected product when routeParam changes for /product/:slug
  useEffect(() => {
    if (route === 'product' && routeParam) {
      const found = products.find((p) => p.slug === routeParam);
      if (found) {
        setSelectedProduct(found);
      } else {
        // Fetch async
        getProductBySlug(routeParam).then((res) => {
          if (res) setSelectedProduct(res);
        });
      }
    }
  }, [route, routeParam, products]);

  // Navigation helper with smooth anchor scrolling for single-page layout
  const handleNavigate = (newRoute: string, param?: string) => {
    if (newRoute === 'product' && param) {
      const url = `/product/${param}`;
      setRoute('product');
      setRouteParam(param);
      try {
        window.history.pushState({}, '', url);
      } catch {
        window.location.hash = url;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (newRoute === 'admin') {
      setRoute('admin');
      try {
        window.history.pushState({}, '', '/admin');
      } catch {
        window.location.hash = '/admin';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (newRoute === 'category-filter' && param) {
      setRoute('home');
      setSelectedCategory(param);
      try {
        window.history.pushState({}, '', '#collection');
      } catch {
        window.location.hash = '#collection';
      }
      setTimeout(() => {
        const target = document.getElementById('collection');
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
        if (target) {
          window.scrollTo({
            top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
            behavior: 'smooth',
          });
        }
      }, 100);
      return;
    }

    if (newRoute === 'category' && param) {
      setRoute('home');
      setSelectedCategory(param);
      try {
        window.history.pushState({}, '', '#collection');
      } catch {
        window.location.hash = '#collection';
      }
      setTimeout(() => {
        const target = document.getElementById('collection');
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
        if (target) {
          window.scrollTo({
            top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
            behavior: 'smooth',
          });
        }
      }, 100);
      return;
    }

    if (newRoute === 'categories') {
      setRoute('home');
      try {
        window.history.pushState({}, '', '#categories');
      } catch {
        window.location.hash = '#categories';
      }
      setTimeout(() => {
        const target = document.getElementById('categories');
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
        if (target) {
          window.scrollTo({
            top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
            behavior: 'smooth',
          });
        }
      }, 100);
      return;
    }

    if (newRoute === 'disclosure' || newRoute === 'about') {
      setRoute('home');
      try {
        window.history.pushState({}, '', '#disclosure');
      } catch {
        window.location.hash = '#disclosure';
      }
      setTimeout(() => {
        const target = document.getElementById('disclosure');
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
        if (target) {
          window.scrollTo({
            top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
            behavior: 'smooth',
          });
        }
      }, 100);
      return;
    }

    // Default to home anchor or top
    setRoute('home');
    const targetAnchor = param || 'hero';
    try {
      window.history.pushState({}, '', targetAnchor === 'hero' ? '/' : `#${targetAnchor}`);
    } catch {
      window.location.hash = targetAnchor === 'hero' ? '' : `#${targetAnchor}`;
    }

    setTimeout(() => {
      if (targetAnchor === 'hero' || targetAnchor === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const target = document.getElementById(targetAnchor);
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 80 : 64);
        if (target) {
          window.scrollTo({
            top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8),
            behavior: 'smooth',
          });
        }
      }
    }, 100);
  };

  // Direct Out Redirect Handler (hits /out/:slug or client direct)
  const handleOutRedirect = async (slug: string) => {
    const prod = await getProductBySlug(slug);
    const tag = settings.amazon_affiliate_tag || 'lunorapicks-20';
    await incrementClickCount(slug);

    if (prod && prod.amazon_url) {
      const destination = buildAmazonAffiliateUrl(prod.amazon_url, tag);
      window.location.href = destination;
    } else {
      window.location.href = `https://www.amazon.com/s?k=${encodeURIComponent(slug.replace(/-/g, ' '))}&tag=${encodeURIComponent(tag)}`;
    }
  };

  // Core User Flow: Click "Buy Now on Amazon"
  const handleBuyClick = async (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Increment click count
    await incrementClickCount(product.slug);
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, click_count: (p.click_count || 0) + 1 } : p))
    );

    const tag = settings.amazon_affiliate_tag || 'lunorapicks-20';
    const destination = buildAmazonAffiliateUrl(product.amazon_url, tag);

    addToast('Opening retailer checkout...', 'info');

    // Open verified partner link in new tab
    const newWindow = window.open(destination, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Fallback if popup blocked
      window.location.href = destination;
    }
  };

  // Wishlist Toggle
  const handleToggleWishlist = (productId: string) => {
    const updated = toggleWishlist(productId);
    setWishlistIds(updated);
    const isAdded = updated.includes(productId);
    addToast(isAdded ? 'Added to your saved picks!' : 'Removed from saved picks', 'info');
  };

  // Wishlist products
  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  // Admin login / logout
  const handleAdminLogin = (email: string) => {
    setAdminUser(email);
  };

  const handleAdminLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    setAdminUser(null);
    addToast('Signed out of Admin', 'info');
    handleNavigate('home');
  };

  const allCategories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0f] text-[#edebe6] transition-colors duration-300 overflow-x-clip">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Global Brand Header */}
      <Navbar
        currentRoute={route}
        onNavigate={handleNavigate}
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={allCategories}
      />

      {/* Wishlist Drawer */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistProducts={wishlistProducts}
        onRemoveFromWishlist={handleToggleWishlist}
        onSelectProduct={(p) => handleNavigate('product', p.slug)}
        onBuyClick={handleBuyClick}
      />

      {/* Page Routing */}
      <main className="flex-grow pt-[var(--header-h)] overflow-x-clip">
        {route === 'home' && (
          <HomePage
            products={products}
            onSelectProduct={(p) => handleNavigate('product', p.slug)}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              smoothScrollTo('collection', { duration: 850, offset: 80 });
            }}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onBuyClick={handleBuyClick}
            onShowToast={addToast}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
          />
        )}

        {route === 'categories' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#e6ca85] font-mono">
                All Categories
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#edebe6]">
                Browse Collections
              </h1>
              <p className="text-xs sm:text-sm text-[#a09c91] font-light">
                Explore handpicked products by category, from everyday essentials to premium tech and home design.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.from(new Set(products.map((p) => p.category))) as string[]).map((catName: string) => {
                const sample = products.find((p) => p.category === catName);
                const count = products.filter((p) => p.category === catName && p.is_live).length;
                return (
                  <div
                    key={catName}
                    onClick={() => handleNavigate('category', catName)}
                    className="p-6 rounded-xl glass-card cursor-pointer transition-all flex flex-col justify-between h-56 group relative overflow-hidden"
                  >
                    <div className="relative z-10">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#e6ca85] bg-[#0b0c0f]/80 px-2.5 py-1 rounded border border-[#e6ca85]/30">
                        {count} {count === 1 ? 'Item' : 'Items'}
                      </span>
                      <h3 className="font-serif text-2xl font-normal text-[#edebe6] mt-3 group-hover:text-[#e6ca85] transition-colors">
                        {catName}
                      </h3>
                    </div>
                    <div className="relative z-10 flex items-center justify-between text-xs font-mono text-[#e6ca85] group-hover:translate-x-0.5 transition-transform">
                      <span>Browse Category</span>
                      <span>→</span>
                    </div>
                    {sample?.image_urls?.[0] && (
                      <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                        <img
                          src={sample.image_urls[0]}
                          alt={catName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {route === 'category' && (
          <CategoryPage
            categoryName={routeParam || 'All'}
            allProducts={products}
            onSelectProduct={(p) => handleNavigate('product', p.slug)}
            onBack={() => handleNavigate('home')}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onBuyClick={handleBuyClick}
          />
        )}

        {route === 'product' && (
          selectedProduct ? (
            <ProductDetailPage
              product={selectedProduct}
              allProducts={products}
              onBack={() => handleNavigate('home')}
              onSelectProduct={(p) => handleNavigate('product', p.slug)}
              isWishlisted={wishlistIds.includes(selectedProduct.id)}
              onToggleWishlist={handleToggleWishlist}
              onBuyClick={handleBuyClick}
              onShowToast={addToast}
            />
          ) : (
            <div className="max-w-md mx-auto py-24 text-center space-y-4">
              <p className="text-base text-[#a09c91]">Loading product details...</p>
              <button
                onClick={() => handleNavigate('home')}
                className="text-xs font-mono text-[#e6ca85] underline underline-offset-4"
              >
                Back to Home
              </button>
            </div>
          )
        )}

        {(route === 'disclosure' || route === 'about') && (
          <AboutDisclosurePage onBack={() => handleNavigate('home')} />
        )}

        {route === 'admin' && (
          adminUser ? (
            <AdminDashboard
              adminEmail={adminUser}
              onLogout={handleAdminLogout}
              products={products}
              onRefreshProducts={refreshProducts}
              settings={settings}
              onRefreshSettings={refreshSettings}
              onShowToast={addToast}
              onViewProduct={(p) => handleNavigate('product', p.slug)}
            />
          ) : (
            <AdminLoginPage
              onLoginSuccess={handleAdminLogin}
              onBack={() => handleNavigate('home')}
              onShowToast={addToast}
            />
          )
        )}
      </main>

      {/* Compliance Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
