import React from 'react';
import { Product } from '../types';
import { ExternalLink, Heart, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onBuyClick: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  isWishlisted,
  onToggleWishlist,
  onBuyClick,
}) => {
  const primaryImage = product.image_urls?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';

  // Normalize badge text to remain platform-neutral (e.g. "Trending on Pinterest" -> "Trending")
  const displayBadge = product.badge
    ? product.badge
        .replace(/on\s+pinterest/gi, '')
        .replace(/pinterest/gi, '')
        .replace(/on\s+amazon/gi, '')
        .replace(/amazon/gi, '')
        .trim() || 'Trending'
    : null;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative flex flex-col justify-between h-full rounded-[14px] md:rounded-2xl glass-card overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 border border-[#e6ca85]/15 hover:border-[#e6ca85]/35 bg-[#12141d]"
    >
      {/* Media Box - Square (aspect-square) on mobile, 4/3 on tablet/desktop with rounded top corners */}
      <div className="relative aspect-square md:aspect-[4/3] w-full flex-shrink-0 overflow-hidden bg-[#0d0e14] rounded-t-[14px] md:rounded-t-2xl">
        <img
          src={primaryImage}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Top Badges: Badge top-left, Wishlist Heart 32px round positioned 8px from top-right on mobile */}
        <div className="absolute top-2 left-2 right-2 md:top-3 md:left-3 md:right-3 flex items-center justify-between pointer-events-none gap-1.5">
          {displayBadge ? (
            <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[11px] font-mono tracking-wider uppercase bg-[#0b0c0f]/85 backdrop-blur-md text-[#f7ecc8] border border-[#e6ca85]/30 shadow-sm max-w-[calc(100%-38px)] md:max-w-[calc(100%-48px)] truncate pointer-events-auto">
              <Sparkles className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-[#e6ca85] flex-shrink-0" />
              <span className="truncate">{displayBadge}</span>
            </span>
          ) : <div />}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            aria-label={isWishlisted ? 'Remove from saved' : 'Save item'}
            className={`pointer-events-auto w-8 h-8 min-w-[32px] min-h-[32px] md:w-11 md:h-11 md:min-w-[44px] md:min-h-[44px] flex items-center justify-center rounded-full transition-all duration-200 border backdrop-blur-md hover:scale-110 active:scale-95 flex-shrink-0 ${
              isWishlisted
                ? 'bg-[#e6ca85] text-[#0b0c0f] border-[#e6ca85] shadow-md'
                : 'bg-[#0b0c0f]/75 text-[#d4d1c9] border-white/10 hover:border-[#e6ca85]/40 hover:text-[#e6ca85]'
            }`}
          >
            <Heart className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Area with 10-12px inner padding on mobile, 16-20px on desktop */}
      <div className="p-2.5 sm:p-3 md:p-5 flex flex-col flex-1 justify-between gap-1.5 md:gap-3.5">
        <div className="space-y-0.5 md:space-y-1.5">
          <p className="product-card-kicker text-[#a09c91]">
            {product.category}
          </p>
          <h3 className="product-card-title text-[#edebe6] group-hover:text-[#e6ca85] transition-colors">
            {product.title}
          </h3>
          <p className="product-card-desc text-[#a09c91] hidden md:-webkit-box">
            {product.description}
          </p>
        </div>

        {/* Price & Action Button: push to bottom with margin-top: auto so all cards in row have equal height */}
        <div className="mt-auto pt-1.5 md:pt-3.5 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3 flex-shrink-0">
          <div className="flex items-baseline flex-nowrap flex-shrink-0">
            <span className="product-card-price text-[#f7ecc8]">
              ${Number(product.price).toFixed(2)}
            </span>
            <span className="product-card-currency text-[#7d796e] ml-1 md:ml-1.5">
              USD
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuyClick(product, e);
            }}
            className="product-card-action-btn w-full md:w-auto rounded-lg bg-gradient-to-r from-[#e6ca85] via-[#d8b86d] to-[#c8aa62] text-[#0b0c0f] hover:brightness-105 hover:scale-[1.01] md:hover:scale-[1.03] active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span>Shop Now</span>
            <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1.5 flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
