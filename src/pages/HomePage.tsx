import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { HeroSection } from '../components/HeroSection';
import { ProductCard } from '../components/ProductCard';
import { CategoryGrid } from '../components/CategoryGrid';
import { DisclosureSection } from '../components/DisclosureSection';
import { ScrollReveal } from '../components/ScrollReveal';
import { Sparkles, ArrowRight, Mail, Check, Compass } from 'lucide-react';
import { subscribeNewsletter } from '../lib/supabase';
import { smoothScrollTo } from '../lib/scrollAnimation';
import { motion, useReducedMotion } from 'motion/react';

interface HomePageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (category: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onBuyClick: (product: Product, e: React.MouseEvent) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  onSelectProduct,
  onSelectCategory,
  wishlistIds,
  onToggleWishlist,
  onBuyClick,
  onShowToast,
  searchQuery,
  onSearchChange,
  selectedCategory,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterDone, setNewsletterDone] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Extract unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  // Featured / Trending highlights
  const featuredProducts = useMemo(() => {
    const featured = products.filter((p) => p.is_live && (p.is_featured || !!p.badge));
    if (featured.length >= 3) return featured.slice(0, 6);
    return products.filter((p) => p.is_live).slice(0, 6);
  }, [products]);

  // Filter products for the full catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.is_live) return false;
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setNewsletterLoading(true);
    const result = await subscribeNewsletter(newsletterEmail);
    setNewsletterLoading(false);

    if (result.success) {
      setNewsletterDone(true);
      setNewsletterEmail('');
      onShowToast(result.message, 'success');
    } else {
      onShowToast(result.message, 'error');
    }
  };

  const handleCategorySelectAndScroll = (categoryName: string) => {
    onSelectCategory(categoryName);
    smoothScrollTo('collection', { duration: 850, offset: 84 });
  };

  return (
    <div className="space-y-4">
      {/* 1. Hero Section (#hero) */}
      <HeroSection
        onExploreClick={() => {
          smoothScrollTo('categories', { duration: 900, offset: 84 });
        }}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelectAndScroll}
        categories={categories}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      {/* 2. Categories / Collections Grid (#categories) */}
      <CategoryGrid
        onSelectCategory={handleCategorySelectAndScroll}
        categories={categories}
        products={products}
      />

      {/* 3. Featured / Trending Products (#featured) */}
      <section id="featured" className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 md:py-18 lg:py-24 scroll-mt-24 border-t border-[#e6ca85]/15">
        <ScrollReveal yOffset={16} duration={0.45}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 pb-4 border-b border-[#e6ca85]/15 gap-4">
            <div>
              <div className="flex items-center gap-2 fluid-kicker text-[#e6ca85]">
                <Sparkles className="w-3.5 h-3.5 text-[#e6ca85]" />
                <span>Editor's Selection</span>
              </div>
              <h2 className="fluid-section-heading font-serif font-normal text-[#edebe6] mt-1.5">
                Featured & Trending Picks
              </h2>
            </div>

            <button
              onClick={() => {
                smoothScrollTo('collection', { duration: 850, offset: 84 });
              }}
              className="text-xs sm:text-[13px] font-mono text-[#e6ca85] hover:underline flex items-center gap-1.5 self-start sm:self-end transition-colors py-1 min-h-[36px]"
            >
              <span>Explore Full Catalog ({products.filter((p) => p.is_live).length} items)</span>
              <span>↓</span>
            </button>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-6 xl:gap-8">
          {featuredProducts.map((product, idx) => (
            <motion.div
              key={`featured-${product.id}`}
              className="h-full flex flex-col"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.45,
                delay: shouldReduceMotion ? 0 : Math.min(idx * 0.07, 0.25),
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <ProductCard
                product={product}
                onSelect={onSelectProduct}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onBuyClick={onBuyClick}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Full Catalog Showcase (#collection) */}
      <section id="collection" className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 md:py-18 lg:py-24 scroll-mt-24 border-t border-[#e6ca85]/15">
        <ScrollReveal yOffset={16} duration={0.45}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 pb-4 border-b border-[#e6ca85]/15 gap-4">
            <div>
              <div className="flex items-center gap-2 fluid-kicker text-[#e6ca85]">
                <Sparkles className="w-3.5 h-3.5 text-[#e6ca85]" />
                <span>
                  {selectedCategory === 'all' ? 'Complete Collection' : selectedCategory}
                </span>
              </div>
              <h2 className="fluid-section-heading font-serif font-normal text-[#edebe6] mt-1.5">
                {searchQuery ? `Search Results: "${searchQuery}"` : 'All Handpicked Finds'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => onSelectCategory('all')}
                  className="text-xs sm:text-[13px] font-mono text-[#e6ca85] hover:underline min-h-[36px] flex items-center"
                >
                  Clear Category Filter
                </button>
              )}
              <span className="text-xs sm:text-[13px] font-mono text-[#a09c91]">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </ScrollReveal>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 sm:py-20 px-6 rounded-xl glass-card space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full border border-[var(--theme-border-medium)] flex items-center justify-center mx-auto text-[var(--theme-icon-accent)]">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-serif text-[var(--theme-text-primary)]">
                No products found
              </h3>
              <p className="fluid-body-text text-[var(--theme-text-muted)] font-light max-w-sm mx-auto">
                We couldn't find any picks matching your search. Try different keywords or browse all categories.
              </p>
            </div>
            <button
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
              }}
              className="btn-primary bg-[var(--theme-badge-bg)] text-[var(--theme-badge-text)] font-mono hover:brightness-105"
            >
              Clear Search & View All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-6 xl:gap-8">
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                className="h-full flex flex-col"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.45,
                  delay: shouldReduceMotion ? 0 : Math.min((idx % 6) * 0.05, 0.2),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <ProductCard
                  product={product}
                  onSelect={onSelectProduct}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                  onBuyClick={onBuyClick}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Newsletter Dispatch (#newsletter) */}
      <section id="newsletter" className="max-w-4xl mx-auto px-4 sm:px-6 my-12 md:my-18 lg:my-24 scroll-mt-24">
        <ScrollReveal yOffset={22} duration={0.5}>
          <div className="relative rounded-xl glass-card p-6 sm:p-10 md:p-14 text-center overflow-hidden">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e6ca85]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c8aa62]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative space-y-4 max-w-xl mx-auto">
              <div className="space-y-2">
                <span className="fluid-kicker text-[#e6ca85]">
                  The Weekly Edit
                </span>
                <h3 className="fluid-section-heading font-serif font-normal text-[#edebe6]">
                  Standout Finds, Delivered Weekly
                </h3>
              </div>

              <p className="fluid-body-text font-light text-[#a09c91]">
                Every Sunday morning, we share 5 carefully chosen products across tech, home, and lifestyle that are genuinely worth owning.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="pt-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-[#e6ca85]" />
                  <input
                    type="email"
                    placeholder="Enter your email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={newsletterLoading || newsletterDone}
                    className="w-full pl-11 pr-4 min-h-[44px] sm:min-h-[48px] rounded-lg bg-[#0b0c0f]/80 border border-[#e6ca85]/30 text-[16px] sm:text-sm text-[#edebe6] focus:outline-none focus:border-[#e6ca85] transition-all disabled:opacity-60 placeholder:text-[#7d796e]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={newsletterLoading || newsletterDone}
                  className="btn-primary min-h-[44px] sm:min-h-[48px] bg-gradient-to-r from-[#e6ca85] via-[#d8b86d] to-[#c8aa62] text-[#0b0c0f] hover:brightness-105 shadow-sm disabled:opacity-75 flex-shrink-0"
                >
                  {newsletterDone ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      <span>Subscribed!</span>
                    </>
                  ) : (
                    <>
                      <span>{newsletterLoading ? 'Subscribing...' : 'Subscribe'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-[11px] sm:text-xs text-[#7d796e] font-mono pt-2">
                No spam ever. Unsubscribe anytime with one click.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 6. Disclosure & About Section (#disclosure) */}
      <DisclosureSection />
    </div>
  );
};

