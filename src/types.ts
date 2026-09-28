export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_urls: string[];
  amazon_url: string;
  badge?: string | null; // e.g. "Best Seller", "Trending", "Editor's Choice", "New"
  is_featured: boolean;
  is_live: boolean;
  click_count: number;
  created_at?: string;
  updated_at?: string;
  features?: string[]; // optional key highlights
}

export interface SiteSettings {
  amazon_affiliate_tag: string;
  site_title?: string;
  contact_email?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  itemCount?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  subscribed_at: string;
}
