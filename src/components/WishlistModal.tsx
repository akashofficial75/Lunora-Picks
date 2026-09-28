import React from 'react';
import { Product } from '../types';
import { X, Heart, ExternalLink, Trash2 } from 'lucide-react';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistProducts: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onBuyClick: (product: Product, e: React.MouseEvent) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlistProducts,
  onRemoveFromWishlist,
  onSelectProduct,
  onBuyClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md theme-modal-panel border-l h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[var(--theme-border-subtle)]">
            <div className="flex items-center gap-2.5">
              <Heart className="w-5 h-5 text-[var(--theme-icon-accent)]" />
              <h2 className="text-xl font-serif font-normal text-[var(--theme-text-primary)]">
                Saved Items
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 min-w-[40px] min-h-[40px] sm:w-11 sm:h-11 sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-active)] transition-colors"
              aria-label="Close saved items"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs sm:text-[13px] text-[var(--theme-text-muted)] mt-2 font-light">
            Picks you've saved for later.
          </p>
        </div>

        {/* Product List */}
        <div className="flex-1 my-6 overflow-y-auto space-y-3.5 pr-1">
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[var(--theme-border-medium)] flex items-center justify-center mx-auto text-[var(--theme-icon-accent)]">
                <Heart className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-serif text-[var(--theme-text-primary)]">
                  No items saved yet
                </p>
                <p className="text-xs sm:text-[13px] text-[var(--theme-text-muted)] max-w-xs mx-auto font-light">
                  Click the heart icon on any item to save it here.
                </p>
              </div>
            </div>
          ) : (
            wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="p-3 sm:p-3.5 rounded-lg border border-[var(--theme-border-subtle)] bg-[var(--theme-bg-surface-elevated)] flex gap-3 sm:gap-3.5 group relative shadow-xs"
              >
                <img
                  src={product.image_urls?.[0]}
                  alt={product.title}
                  className="w-16 h-16 rounded-md object-cover flex-shrink-0 bg-[var(--theme-bg-surface)] cursor-pointer"
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                />
                
                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div className="pr-6">
                    <h4
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="text-xs sm:text-[13px] font-serif text-[var(--theme-text-primary)] line-clamp-1 hover:text-[var(--theme-text-accent)] cursor-pointer transition-colors font-medium"
                    >
                      {product.title}
                    </h4>
                    <p className="text-xs sm:text-[13px] font-mono font-semibold text-[var(--theme-text-accent)] mt-0.5">
                      ${Number(product.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={(e) => onBuyClick(product, e)}
                      className="flex-1 py-2 px-3 rounded-lg text-[11px] sm:text-xs uppercase font-semibold tracking-wider bg-[var(--theme-badge-bg)] text-[var(--theme-badge-text)] hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 transition-all duration-200 min-h-[40px]"
                    >
                      <span>Shop Now</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveFromWishlist(product.id)}
                      title="Remove item"
                      aria-label={`Remove ${product.title} from saved items`}
                      className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[var(--theme-text-muted)] hover:text-rose-500 hover:scale-110 active:scale-90 transition-all duration-200 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-4 border-t border-[var(--theme-border-subtle)] text-[11px] sm:text-xs text-[var(--theme-text-muted)] space-y-3 font-light">
          <p>
            *Prices and availability are verified on the merchant's checkout page.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 min-h-[44px] flex items-center justify-center rounded-lg border border-[var(--theme-border-medium)] text-xs font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-active)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 uppercase tracking-wider font-mono"
          >
            Continue Browsing
          </button>
        </div>

      </div>
    </div>
  );
};
