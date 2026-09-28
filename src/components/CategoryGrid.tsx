import React from 'react';
import { CATEGORIES } from '../data/seedData';
import { Product } from '../types';
import { ScrollReveal } from './ScrollReveal';
import { motion, useReducedMotion } from 'motion/react';
import {
  Gamepad2,
  Cpu,
  Sparkles,
  Home,
  ShoppingBag,
  Heart,
  UtensilsCrossed,
  Compass,
  ArrowRight,
  Package,
} from 'lucide-react';

interface CategoryGridProps {
  onSelectCategory: (categoryName: string) => void;
  categories?: string[];
  products?: Product[];
}

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('game') || lower.includes('gaming')) return Gamepad2;
  if (lower.includes('tech') || lower.includes('gadget')) return Cpu;
  if (lower.includes('beauty') || lower.includes('groom')) return Sparkles;
  if (lower.includes('home') || lower.includes('decor')) return Home;
  if (lower.includes('fashion') || lower.includes('accessories')) return ShoppingBag;
  if (lower.includes('wellness') || lower.includes('self-care') || lower.includes('care')) return Heart;
  if (lower.includes('kitchen') || lower.includes('living') || lower.includes('food')) return UtensilsCrossed;
  if (lower.includes('travel') || lower.includes('carry')) return Compass;
  return Package;
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  onSelectCategory,
  categories,
  products = [],
}) => {
  const shouldReduceMotion = useReducedMotion();

  const activeCategoryNames = React.useMemo(() => {
    if (categories && categories.length > 0) {
      return categories;
    }
    if (products && products.length > 0) {
      return Array.from(new Set(products.map((p) => p.category)));
    }
    return CATEGORIES.map((c) => c.name);
  }, [categories, products]);

  return (
    <section id="categories" className="my-12 md:my-18 lg:my-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
      <ScrollReveal yOffset={16} duration={0.45}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 pb-4 border-b border-[#e6ca85]/15 gap-4">
          <div>
            <span className="fluid-kicker text-[#e6ca85] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Categories
            </span>
            <h2 className="fluid-section-heading font-serif font-normal text-[#edebe6] mt-1.5">
              Featured Categories
            </h2>
          </div>
          <p className="fluid-body-text text-[#a09c91] max-w-md font-light">
            Explore handpicked pieces organized by space, technology, and everyday style.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        {activeCategoryNames.map((catName, idx) => {
          const matchedMeta = CATEGORIES.find((c) => c.name.toLowerCase() === catName.toLowerCase());
          const matchingProducts = products.filter((p) => p.category === catName && p.is_live);
          const sampleProd = products.find((p) => p.category === catName && p.image_urls?.[0]);
          const imageUrl = matchedMeta?.imageUrl || sampleProd?.image_urls[0] || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80';
          const description = matchedMeta?.description || `Handpicked finds in ${catName.toLowerCase()} chosen for quality and design.`;
          const CatIcon = getCategoryIcon(catName);

          return (
            <motion.div
              key={catName}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.45,
                delay: shouldReduceMotion ? 0 : Math.min(idx * 0.06, 0.24),
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => onSelectCategory(catName)}
              className="group relative rounded-xl overflow-hidden glass-card cursor-pointer h-56 sm:h-72 lg:h-80 transition-all duration-300 flex flex-col justify-end"
            >
              {/* Background Photo - full clarity without heavy flat dark tint */}
              <img
                src={imageUrl}
                alt={catName}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              
              {/* Subtle Bottom Gradient: mostly transparent at top/middle, darkening only toward the bottom third behind text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 via-35% to-transparent to-65% pointer-events-none transition-opacity duration-300" />

              {/* Floating Top Category Icon */}
              <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0b0c0f]/80 backdrop-blur-md border border-[#e6ca85]/30 !text-[#e6ca85] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                  <CatIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Bottom Content */}
              <div className="relative z-10 p-3 sm:p-5 flex flex-col justify-end">
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  <h3 className="text-sm sm:text-base lg:text-lg font-serif font-medium text-white group-hover:text-[#e6ca85] transition-colors line-clamp-1 drop-shadow-sm">
                    {catName}
                  </h3>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:bg-[#e6ca85] group-hover:!text-[#0b0c0f] group-hover:border-[#e6ca85] transition-all flex-shrink-0 shadow">
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                </div>
                <p className="hidden min-[420px]:block sm:block text-[11px] sm:text-xs text-white/80 font-light mt-1 sm:mt-1.5 line-clamp-1 sm:line-clamp-2 leading-relaxed drop-shadow-sm">
                  {description}
                </p>
                {matchingProducts.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 sm:mt-3 text-[10px] sm:text-[11px] font-mono !text-[#e6ca85] drop-shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full !bg-[#e6ca85]" />
                    <span>
                      {matchingProducts.length} {matchingProducts.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
