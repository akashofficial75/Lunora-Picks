import React from 'react';
import { ShieldCheck, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

interface AboutDisclosurePageProps {
  onBack: () => void;
}

export const AboutDisclosurePage: React.FC<AboutDisclosurePageProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#a09c91] hover:text-[#e6ca85] transition-colors py-2 px-3.5 rounded-lg bg-white/5 border border-white/10 min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collection</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="space-y-4 pb-8 border-b border-[#e6ca85]/15">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#12141d] border border-[#e6ca85]/30 fluid-kicker text-[#e6ca85]">
          <Sparkles className="w-3.5 h-3.5 text-[#e6ca85]" />
          <span>Transparency & Standards</span>
        </div>
        
        <div className="space-y-3">
          <h1 className="fluid-section-heading font-serif font-normal text-[#edebe6]">
            Editorial Standards & <br />
            <span className="italic gold-gradient-text">Affiliate Disclosure</span>
          </h1>
          <p className="fluid-body-text text-[#a09c91] font-light">
            Created by <strong className="text-[#e6ca85] font-medium">AkashProg</strong> — an independent collection of standout finds across tech, gaming, home decor, grooming, and everyday essentials.
          </p>
        </div>
      </div>

      {/* Core Disclosure Callout */}
      <div className="p-6 sm:p-8 rounded-xl glass-card border border-[#e6ca85]/30 space-y-4 shadow-lg">
        <div className="flex items-center gap-3 text-[#e6ca85]">
          <ShieldCheck className="w-6 h-6 flex-shrink-0" />
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#edebe6]">
            How We Pick & Recommend Products
          </h2>
        </div>
        <p className="text-sm sm:text-base font-serif italic text-[#f7ecc8] leading-relaxed pl-3 border-l-2 border-[#e6ca85]">
          "Lunora Picks is an independent product discovery site."
        </p>
        <p className="fluid-body-text text-[#d4d1c9] font-light">
          We believe in complete transparency. Products featured across Lunora Picks include affiliate referral links. When you click through our links and complete a qualifying purchase, we may earn a small commission at no additional cost to you. Every product is handpicked based on design, quality, and real-world usefulness — never because a brand paid us to feature it.
        </p>
      </div>

      {/* Three Pillars */}
      <div className="space-y-6">
        <h3 className="fluid-section-heading font-serif font-normal text-[#edebe6]">
          Our Curation Standards
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 rounded-xl glass-card space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#0b0c0f] border border-[#e6ca85]/30 flex items-center justify-center font-mono text-xs text-[#e6ca85]">
              01
            </div>
            <h4 className="font-serif text-base sm:text-lg font-medium text-[#edebe6]">
              Real Quality & Function
            </h4>
            <p className="fluid-body-text text-[#a09c91] font-light">
              Every item must look great, work reliably, and offer real utility. We avoid short-lived gimmicks and focus on things built to last.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-xl glass-card space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#0b0c0f] border border-[#e6ca85]/30 flex items-center justify-center font-mono text-xs text-[#e6ca85]">
              02
            </div>
            <h4 className="font-serif text-base sm:text-lg font-medium text-[#edebe6]">
              Trusted Retailers
            </h4>
            <p className="fluid-body-text text-[#a09c91] font-light">
              We link directly to established, recognized merchants offering secure checkout, buyer protections, and reliable return policies.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-xl glass-card space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#0b0c0f] border border-[#e6ca85]/30 flex items-center justify-center font-mono text-xs text-[#e6ca85]">
              03
            </div>
            <h4 className="font-serif text-base sm:text-lg font-medium text-[#edebe6]">
              Direct & Secure Buying
            </h4>
            <p className="fluid-body-text text-[#a09c91] font-light">
              You always purchase directly from the retailer. Lunora Picks never touches your payment details or handles fulfillment.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing & Stock Guarantee Statement */}
      <div className="p-5 sm:p-6 rounded-xl glass-card border border-[#e6ca85]/20 space-y-3">
        <div className="flex items-center gap-2 text-[#e6ca85]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <h4 className="fluid-kicker font-mono text-[#edebe6]">
            Price & Stock Availability
          </h4>
        </div>
        <p className="fluid-body-text text-[#a09c91] font-light">
          Retail prices, shipping costs, and stock levels change frequently depending on merchant promotions and inventory. Prices shown on Lunora Picks are accurate at the time of publication and serve as a guide. Please confirm the final price, shipping, and availability on the seller's checkout page before placing your order.
        </p>
      </div>

      {/* Editorial Independence & AkashProg Credit */}
      <div className="space-y-4 pt-4 border-t border-[#e6ca85]/15">
        <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#edebe6]">
          Editorial Independence
        </h3>
        <p className="fluid-body-text text-[#a09c91] font-light">
          Every recommendation on Lunora Picks is completely independent. We do not accept paid product placements, sponsored posts, or gifts in exchange for positive coverage.
        </p>
        <p className="fluid-body-text text-[#a09c91] font-light pt-2">
          Questions, product suggestions, or feedback: <strong className="text-[#e6ca85] font-mono">AkashProg</strong> (akashprogofficial@gmail.com).
        </p>
      </div>

    </div>
  );
};
