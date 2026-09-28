import React from 'react';
import { Sparkles, Search, ShieldCheck, CheckCircle2, Compass } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

interface HeroSectionProps {
  onExploreClick: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  selectedCategory,
  onSelectCategory,
  categories,
  searchQuery,
  onSearchChange,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div id="hero" className="relative overflow-hidden py-12 md:py-18 lg:py-24 border-b border-[#e6ca85]/15 scroll-mt-24">
      
      {/* Subtle Warm Gold Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#e6ca85]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-10 w-80 h-80 bg-[#c8aa62]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8"
      >
        
        {/* Subtle Eyebrow Badge (Never < 10px) */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#12141d] border border-[#e6ca85]/25 text-[10px] sm:text-[11px] font-mono tracking-widest text-[#e6ca85] uppercase">
          <Sparkles className="w-3 h-3 text-[#e6ca85]" />
          <span>Curated Collection</span>
          <span className="w-1 h-1 rounded-full bg-[#e6ca85]" />
          <span className="text-[#a09c91] font-sans lowercase">handpicked finds</span>
        </div>

        {/* Editorial Headline with Fluid Scale (32px mobile / 44px tablet / 64-72px desktop) */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="fluid-hero-headline font-serif font-normal text-[#edebe6] tracking-tight">
            Standout Finds Across <br className="hidden sm:inline" />
            <span className="italic font-serif gold-gradient-text">Design, Tech & Living</span>
          </h1>
          <p className="fluid-body-text max-w-2xl mx-auto text-[#a09c91] font-sans font-light">
            Handpicked gear, room aesthetics, desk setups, and everyday essentials. Carefully chosen for good design, build quality, and real everyday use.
          </p>
        </div>

        {/* Refined Search Input & Quick Action (46-48px height, 16px mobile font to prevent iOS zoom) */}
        <div className="max-w-xl mx-auto space-y-4">
          <div className="relative flex items-center bg-[#12141d]/80 border border-[#e6ca85]/30 rounded-xl px-4 min-h-[46px] sm:min-h-[48px] shadow-lg focus-within:border-[#e6ca85] focus-within:ring-1 focus-within:ring-[#e6ca85]/40 transition-all">
            <Search className="w-4 h-4 text-[#e6ca85] mr-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by product, category, or style..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent text-[16px] sm:text-sm text-[#edebe6] focus:outline-none w-full placeholder:text-[#7d796e]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-[11px] sm:text-xs text-[#a09c91] hover:text-[#edebe6] font-mono uppercase px-2.5 py-1 rounded bg-white/5 min-h-[34px] flex items-center ml-2 flex-shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation - Consistent 34-38px pills */}
        <div className="space-y-3 pt-2">
          <p className="fluid-kicker text-[#a09c91]">
            Explore By Category
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <button
              onClick={() => onSelectCategory('all')}
              className={`category-filter-pill transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${
                selectedCategory === 'all'
                  ? 'bg-[#e6ca85] text-[#0b0c0f] font-semibold shadow-md'
                  : 'bg-[#12141d]/80 text-[#d4d1c9] hover:text-[#e6ca85] border border-white/10 hover:border-[#e6ca85]/40 hover:shadow-sm'
              }`}
            >
              All Curations
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`category-filter-pill transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${
                  selectedCategory === cat
                    ? 'bg-[#e6ca85] text-[#0b0c0f] font-semibold shadow-md'
                    : 'bg-[#12141d]/80 text-[#d4d1c9] hover:text-[#e6ca85] border border-white/10 hover:border-[#e6ca85]/40 hover:shadow-sm'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Editorial Standards Bar - Calm & Trustworthy */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-8 text-xs sm:text-[13px] text-[#a09c91]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#e6ca85]" />
            <span>Independent Editorial Picks</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#e6ca85]" />
            <span>Verified Merchant Links</span>
          </div>
          <button
            onClick={onExploreClick}
            className="flex items-center gap-1 text-[#e6ca85] hover:text-[#f3e5ab] hover:underline hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer font-mono text-[11px] sm:text-xs min-h-[36px]"
          >
            <span>Browse Collections ↓</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
