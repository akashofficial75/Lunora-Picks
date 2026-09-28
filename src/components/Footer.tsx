import React from 'react';
import { LunoraLogo } from './LunoraLogo';
import { Sparkles } from 'lucide-react';
import { smoothScrollTo } from '../lib/scrollAnimation';

interface FooterProps {
  onNavigate: (route: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToAnchor = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el || anchorId === 'hero') {
      smoothScrollTo(anchorId, {
        duration: 950,
        offset: 80,
        onComplete: () => {
          try {
            window.history.pushState(null, '', anchorId === 'hero' ? '/' : `#${anchorId}`);
          } catch {
            window.location.hash = anchorId === 'hero' ? '' : `#${anchorId}`;
          }
        },
      });
    } else {
      onNavigate('home', anchorId);
    }
  };

  const handleCategoryFilter = (catName: string) => {
    onNavigate('category-filter', catName);
  };

  return (
    <footer id="footer" className="w-full bg-[#08090b] border-t border-[#e6ca85]/15 pt-12 sm:pt-16 pb-12 mt-16 sm:mt-20 text-[#a09c91] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 pb-10 sm:pb-12 border-b border-white/5">
          
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                scrollToAnchor('hero');
              }}
              className="inline-block"
              aria-label="Back to top"
            >
              <LunoraLogo size="md" />
            </a>
            <p className="fluid-body-text text-[#d4d1c9] max-w-md font-light">
              An independent collection of standout finds across tech, gaming, home decor, grooming, and everyday carry. Handpicked for quality, design, and function.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 fluid-kicker font-mono text-[#e6ca85]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#e6ca85]" />
                Hand-Selected Finds
              </span>
              <span>•</span>
              <span>Editorial Independence</span>
              <span>•</span>
              <span>Zero Extra Cost</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="fluid-kicker text-[#edebe6] font-mono">
              Categories
            </h4>
            <ul className="space-y-2 text-xs sm:text-[13px] font-light text-[#d4d1c9]">
              <li>
                <button
                  onClick={() => handleCategoryFilter('Tech & Gadgets')}
                  className="hover:text-[#e6ca85] transition-colors py-1 block text-left"
                >
                  Tech & Gadgets
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryFilter('Gaming')}
                  className="hover:text-[#e6ca85] transition-colors py-1 block text-left"
                >
                  Gaming
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryFilter('Home & Decor')}
                  className="hover:text-[#e6ca85] transition-colors py-1 block text-left"
                >
                  Home & Decor
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryFilter('Beauty & Grooming')}
                  className="hover:text-[#e6ca85] transition-colors py-1 block text-left"
                >
                  Beauty & Grooming
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryFilter('Travel & Everyday Carry')}
                  className="hover:text-[#e6ca85] transition-colors py-1 block text-left"
                >
                  Everyday Carry
                </button>
              </li>
              <li>
                <a
                  href="#categories"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToAnchor('categories');
                  }}
                  className="hover:text-[#e6ca85] transition-colors text-[11px] sm:text-xs font-mono text-[#e6ca85] pt-1 block"
                >
                  Shop All Categories ↓
                </a>
              </li>
            </ul>
          </div>

          {/* Transparency & Disclosure */}
          <div className="space-y-3">
            <h4 className="fluid-kicker text-[#edebe6] font-mono">
              Disclosure
            </h4>
            <ul className="space-y-2 text-xs sm:text-[13px] font-light text-[#d4d1c9]">
              <li>
                <a
                  href="#disclosure"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToAnchor('disclosure');
                  }}
                  className="hover:text-[#e6ca85] transition-colors text-left block py-1"
                >
                  Affiliate & Editorial Disclosure
                </a>
              </li>
              <li>
                <a
                  href="#disclosure"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToAnchor('disclosure');
                  }}
                  className="hover:text-[#e6ca85] transition-colors text-left block py-1"
                >
                  About Lunora Picks
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Editorial & Affiliate Compliance Box */}
        <div className="my-8 p-4 sm:p-5 rounded-xl glass-card text-xs sm:text-[13px] text-[#a09c91] leading-relaxed">
          <p className="font-serif font-medium text-[#edebe6] mb-1.5 text-sm sm:text-base">
            Editorial Independence & Affiliate Disclosure
          </p>
          <p className="font-light">
            <strong className="text-[#e6ca85] font-normal">Lunora Picks is an independent product discovery site.</strong> We handpick products we genuinely like, with zero paid placements or sponsored influence. When you buy through our links, we may earn an affiliate commission at no extra cost to you. Retailers establish all prices, promotions, and availability, so please verify the final details on their checkout page before completing a purchase.
          </p>
        </div>

        {/* Bottom Bar with Footer Credit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-xs text-[#7d796e] font-light">
          <div>
            © {new Date().getFullYear()} Lunora Picks. All rights reserved. Curated with editorial independence.
          </div>
          <div className="flex items-center gap-2 text-[#d4d1c9] text-xs">
            <span>Developed by</span>
            <span className="text-[#e6ca85] font-mono tracking-wider bg-[#e6ca85]/10 px-3 py-1 rounded border border-[#e6ca85]/20 font-medium">
              AkashProg
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
