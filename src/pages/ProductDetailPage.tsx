import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  ExternalLink,
  Heart,
  Share2,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Info,
  Truck,
  RotateCcw,
  Link2
} from 'lucide-react';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onSelectProduct: (p: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onBuyClick: (product: Product, e?: React.MouseEvent) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

/**
 * Robust clipboard copy using modern navigator.clipboard with fallback for older browsers
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  // 1. Try modern navigator.clipboard in secure contexts
  if (navigator?.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to document.execCommand fallback
    }
  }

  // 2. Cross-browser fallback for older browsers or restricted iframe environments
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.style.zIndex = '-9999';
    document.body.appendChild(textArea);

    // Support iOS selection range
    const range = document.createRange();
    range.selectNodeContents(textArea);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    textArea.select();
    textArea.setSelectionRange(0, 999999);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Fallback copy failed:', err);
    return false;
  }
};

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  onBack,
  onSelectProduct,
  isWishlisted,
  onToggleWishlist,
  onBuyClick,
  onShowToast,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up copy timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  // Sync document title and meta for SEO
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `${product.title} — Lunora Picks`;
    
    // Update meta tags for social share cards
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', product.description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', product.title);
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && product.image_urls?.[0]) ogImage.setAttribute('content', product.image_urls[0]);
  }, [product]);

  const images = product.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80'];

  const activeImage = images[activeImageIndex] || images[0];

  // Normalize badge to be platform-neutral
  const displayBadge = product.badge
    ? product.badge
        .replace(/on\s+pinterest/gi, '')
        .replace(/pinterest/gi, '')
        .replace(/on\s+amazon/gi, '')
        .replace(/amazon/gi, '')
        .trim() || 'Trending'
    : null;

  const handleCopyLink = async () => {
    let url = '';
    try {
      if (window.location.pathname.includes(`/product/${product.slug}`)) {
        url = window.location.href;
      } else {
        url = `${window.location.origin}/product/${product.slug}`;
      }
    } catch {
      url = `https://lunorapicks.com/product/${product.slug}`;
    }

    const success = await copyToClipboard(url);

    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }

    setCopied(true);
    if (success) {
      onShowToast('Link copied to clipboard!', 'success');
    } else {
      onShowToast(`Link: ${url}`, 'info');
    }

    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Related products from the same category
  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id && p.is_live)
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
      
      {/* Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-[#e6ca85]/15 text-xs text-[#a09c91]">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[#edebe6] hover:text-[#e6ca85] transition-colors py-2 px-3.5 rounded-lg bg-white/5 border border-white/10 min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Back to All Picks</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="copy-product-link-top-btn"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/10 hover:border-[#e6ca85]/40 hover:scale-[1.03] active:scale-95 text-[11px] sm:text-xs font-mono uppercase tracking-wider text-[#d4d1c9] hover:text-[#e6ca85] bg-[#12141d] shadow-sm transition-all duration-200 min-h-[40px]"
            title={copied ? "Link copied!" : "Share / Copy link"}
            aria-label="Copy Link"
          >
            {copied ? <Check className="w-4 h-4 text-[#e6ca85]" /> : <Share2 className="w-4 h-4 text-[#e6ca85]" />}
            <span>{copied ? 'Link copied!' : 'Share'}</span>
          </button>

          <button
            onClick={() => onToggleWishlist(product.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs font-mono uppercase tracking-wider transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-sm min-h-[40px] ${
              isWishlisted
                ? 'border-[#e6ca85] bg-[#e6ca85] text-[#0b0c0f]'
                : 'border-white/10 hover:border-[#e6ca85]/40 text-[#d4d1c9] hover:text-[#e6ca85] bg-[#12141d]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : 'text-[#e6ca85]'}`} />
            <span>{isWishlisted ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-xl overflow-hidden glass-card shadow-lg bg-[#11131b]">
            <img
              src={activeImage}
              alt={product.title}
              className="w-full h-full object-cover object-center transition-all duration-700"
            />
            {displayBadge && (
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono tracking-widest uppercase bg-[#0b0c0f]/85 backdrop-blur-md text-[#f7ecc8] border border-[#e6ca85]/35 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#e6ca85]" />
                  {displayBadge}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#e6ca85] shadow-md'
                      : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Standards Badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 text-center text-xs">
            <div className="p-3 sm:p-4 rounded-lg glass-card space-y-1">
              <Truck className="w-5 h-5 mx-auto text-[#e6ca85]" />
              <p className="font-mono text-[10px] sm:text-[11px] text-[#edebe6] uppercase truncate font-medium">Direct Delivery</p>
              <p className="hidden min-[420px]:block text-[10px] sm:text-[11px] text-[#a09c91] font-light">Shipped directly by retailer</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg glass-card space-y-1">
              <RotateCcw className="w-5 h-5 mx-auto text-[#e6ca85]" />
              <p className="font-mono text-[10px] sm:text-[11px] text-[#edebe6] uppercase truncate font-medium">Easy Returns</p>
              <p className="hidden min-[420px]:block text-[10px] sm:text-[11px] text-[#a09c91] font-light">Protected by retailer policy</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg glass-card space-y-1">
              <ShieldCheck className="w-5 h-5 mx-auto text-[#e6ca85]" />
              <p className="font-mono text-[10px] sm:text-[11px] text-[#edebe6] uppercase truncate font-medium">Secure Checkout</p>
              <p className="hidden min-[420px]:block text-[10px] sm:text-[11px] text-[#a09c91] font-light">Encrypted retailer checkout</p>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Primary CTA */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          
          <div className="space-y-5">
            <span className="inline-block fluid-kicker font-mono px-3 py-1 rounded bg-[#12141d] text-[#e6ca85] border border-[#e6ca85]/30">
              {product.category}
            </span>

            <div className="flex items-start justify-between gap-3">
              <h1 className="fluid-section-heading font-serif font-normal text-[#edebe6] flex-1">
                {product.title}
              </h1>
              <div className="relative flex-shrink-0 pt-0.5">
                <button
                  type="button"
                  id="copy-product-link-title-btn"
                  onClick={handleCopyLink}
                  aria-label="Copy Link"
                  title={copied ? 'Link copied!' : 'Copy Link'}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg border border-[#e6ca85]/30 hover:border-[#e6ca85] bg-[#12141d] hover:bg-[#181a24] text-[#e6ca85] transition-all flex items-center justify-center shadow-sm active:scale-95 group focus:outline-none focus:ring-1 focus:ring-[#e6ca85]"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-[#e6ca85] animate-in zoom-in duration-150" />
                  ) : (
                    <Link2 className="w-5 h-5 text-[#e6ca85] group-hover:rotate-12 transition-transform" />
                  )}
                </button>
                {copied && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="absolute -top-9 right-0 sm:left-1/2 sm:-translate-x-1/2 px-2.5 py-1 rounded-md bg-[#12141d] text-[#edebe6] border border-[#e6ca85]/50 text-[11px] font-mono tracking-wide whitespace-nowrap shadow-xl pointer-events-none z-30 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <Check className="w-3.5 h-3.5 text-[#e6ca85]" />
                    <span>Link copied!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Valuation Box */}
            <div className="p-4 sm:p-5 rounded-xl glass-card space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-serif font-medium text-[#f7ecc8]">
                  ${Number(product.price).toFixed(2)}
                </span>
                <span className="text-xs font-mono text-[#a09c91]">USD</span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#7d796e] font-light flex items-center gap-1.5 pt-1">
                <Info className="w-4 h-4 text-[#e6ca85] flex-shrink-0" />
                <span>Price and in-stock status verified on the merchant's checkout page.</span>
              </p>
            </div>

            {/* Curatorial Rationale */}
            <div className="space-y-2 pt-2">
              <h3 className="fluid-kicker font-mono text-[#e6ca85]">
                Why We Picked It
              </h3>
              <p className="fluid-body-text text-[#d4d1c9] font-light">
                {product.description}
              </p>
            </div>

            {/* Attributes & Highlights */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <h4 className="fluid-kicker font-mono text-[#e6ca85]">
                  Key Features & Details
                </h4>
                <ul className="space-y-2 text-xs sm:text-[13px] text-[#d4d1c9] font-light">
                  {product.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e6ca85] mt-1.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Primary CTA & Compliance */}
          <div className="pt-6 border-t border-[#e6ca85]/15 space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => onBuyClick(product, e)}
                className="btn-primary flex-1 min-h-[44px] sm:min-h-[48px] bg-gradient-to-r from-[#e6ca85] via-[#d8b86d] to-[#c8aa62] text-[#0b0c0f] hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg"
              >
                <span>Shop Now</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              {/* Copy Link / Share Button - 44-48px hit area with 20px icon */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  id="copy-product-link-btn"
                  onClick={handleCopyLink}
                  aria-label="Copy Link"
                  title={copied ? "Link copied!" : "Copy Link"}
                  className="h-[44px] w-[44px] sm:h-[48px] sm:w-[48px] min-w-[44px] min-h-[44px] rounded-lg border border-[#e6ca85]/30 hover:border-[#e6ca85] bg-[#12141d] hover:bg-[#181a24] text-[#e6ca85] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center shadow-sm group focus:outline-none focus:ring-1 focus:ring-[#e6ca85]"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-[#e6ca85] animate-in zoom-in duration-150" />
                  ) : (
                    <Link2 className="w-5 h-5 text-[#e6ca85] group-hover:rotate-12 transition-transform" />
                  )}
                </button>

                {/* Tooltip confirmation */}
                {copied && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="absolute -top-9.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-[#12141d] text-[#edebe6] border border-[#e6ca85]/50 text-[11px] font-mono tracking-wide whitespace-nowrap shadow-xl pointer-events-none z-30 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <Check className="w-3.5 h-3.5 text-[#e6ca85]" />
                    <span>Link copied!</span>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#12141d] border-b border-r border-[#e6ca85]/50 rotate-45" />
                  </div>
                )}
              </div>
            </div>

            {/* Mandatory Affiliate Disclosure */}
            <div className="p-3.5 rounded-lg glass-card text-[11px] sm:text-xs text-[#a09c91] text-center leading-relaxed font-light">
              <span className="text-[#edebe6] font-medium">Affiliate Disclosure: </span>
              Lunora Picks is an independent site. When you buy this product through our link, we may earn an affiliate commission at no extra cost to you. Pricing and availability are set by the seller and should be confirmed on their checkout page.
            </div>
          </div>

        </div>
      </div>

      {/* Complementary Selections */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 sm:mt-20 pt-10 sm:pt-12 border-t border-[#e6ca85]/15">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="fluid-kicker text-[#e6ca85] font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Related in {product.category}
              </span>
              <h2 className="fluid-section-heading font-serif font-normal text-[#edebe6] mt-1">
                More Picks You May Like
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onSelect={onSelectProduct}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
                onBuyClick={onBuyClick}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
