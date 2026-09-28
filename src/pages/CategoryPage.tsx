import React, { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES } from '../data/seedData';
import { ArrowLeft, ArrowUpDown, Search, Sparkles, Compass } from 'lucide-react';

interface CategoryPageProps {
  categoryName: string;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onBuyClick: (product: Product, e: React.MouseEvent) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categoryName,
  allProducts,
  onSelectProduct,
  onBack,
  wishlistIds,
  onToggleWishlist,
  onBuyClick,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular'>('popular');

  const categoryMeta = CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );

  let filtered = allProducts.filter((p) => {
    if (!p.is_live) return false;
    if (categoryName !== 'All' && p.category.toLowerCase() !== categoryName.toLowerCase()) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'popular') return (b.click_count || 0) - (a.click_count || 0);
    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
  });

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 md:py-14 space-y-8 md:space-y-10">
      
      {/* Category Header Banner */}
      <div className="relative rounded-xl glass-card p-6 sm:p-10 md:p-12 overflow-hidden">
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:gap-6 max-w-2xl">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#a09c91] hover:text-[#e6ca85] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 py-2 px-3.5 rounded-lg bg-white/5 border border-white/10 min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Back to Collection</span>
          </button>
          
          <div className="space-y-1.5 sm:space-y-2">
            <span className="fluid-kicker text-[#e6ca85] font-mono flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#e6ca85]" />
              Category
            </span>
            <h1 className="fluid-section-heading font-serif font-normal text-[#edebe6]">
              {categoryName}
            </h1>
          </div>

          <p className="fluid-body-text font-light text-[#a09c91]">
            {categoryMeta?.description ||
              'Handpicked finds chosen for quality, design, and everyday usefulness.'}
          </p>
        </div>

        {/* Soft background accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#e6ca85]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#e6ca85]/15">
        
        {/* Search inside category (min-h-[44px], 16px mobile font to prevent iOS zoom) */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#e6ca85]" />
          <input
            type="text"
            placeholder={`Search within ${categoryName.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 min-h-[44px] rounded-lg bg-[#0b0c0f]/80 border border-[#e6ca85]/25 text-[16px] sm:text-xs text-[#edebe6] focus:outline-none focus:border-[#e6ca85] placeholder:text-[#7d796e]"
          />
        </div>

        {/* Sort Controls (min-h-[44px]) */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#a09c91] font-mono">
            <ArrowUpDown className="w-4 h-4 text-[#e6ca85]" />
            <span>Sort by:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#12141d] border border-[#e6ca85]/25 text-[#edebe6] text-xs font-mono rounded-lg px-3.5 py-2.5 min-h-[44px] focus:outline-none focus:border-[#e6ca85] cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 sm:py-20 px-6 rounded-xl glass-card space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full border border-[#e6ca85]/20 flex items-center justify-center mx-auto text-[#e6ca85]">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-serif text-[#edebe6]">
              No products found for "{search}"
            </p>
            <p className="fluid-body-text text-[#a09c91] font-light">
              Try different keywords or clear your search to see all items in this category.
            </p>
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="btn-primary bg-[#e6ca85] text-[#0b0c0f] font-mono hover:brightness-105"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-6 xl:gap-8">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onBuyClick={onBuyClick}
            />
          ))}
        </div>
      )}

    </div>
  );
};
