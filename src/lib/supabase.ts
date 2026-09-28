import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, SiteSettings, SupabaseConfig, NewsletterSubscriber } from '../types';
import { INITIAL_PRODUCTS } from '../data/seedData';

const LOCAL_STORAGE_PRODUCTS_KEY = 'lunora_picks_products_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'lunora_picks_settings_v1';
const LOCAL_STORAGE_WISHLIST_KEY = 'lunora_picks_wishlist_v1';
const LOCAL_STORAGE_SUBSCRIBERS_KEY = 'lunora_newsletter_subscribers_v1';

// Clean and validate Supabase URL: ensure no trailing slash and no appended /rest/v1 or /auth/v1 paths
export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Strip /rest/v1 or /auth/v1 or subpaths if present
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/auth\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');

  // For standard Supabase projects (*.supabase.co), strictly use protocol + host with no path
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('.supabase.co')) {
      return `${parsed.protocol}//${parsed.host}`;
    }
  } catch {
    // fallback to cleaned string
  }

  return url;
}

// Get configured credentials strictly from environment variables
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return { url: sanitizeSupabaseUrl(envUrl), anonKey: envKey.trim() };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getSupabaseConfig();
  const cleanUrl = sanitizeSupabaseUrl(url);
  const cleanKey = anonKey.trim();

  if (cleanUrl && cleanKey && cleanUrl.startsWith('http')) {
    try {
      supabaseInstance = createClient(cleanUrl, cleanKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
    }
  }
  return null;
}

export function isSupabaseConnected(): boolean {
  return getSupabase() !== null;
}

// Local mock store helpers for seamless live preview and offline resilience
function getLocalProducts(): Product[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading local products:', e);
  }
  // Initialize with seed data
  localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

function saveLocalProducts(products: Product[]) {
  localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
}

// Affiliate Tag Settings
export async function getSettings(): Promise<SiteSettings> {
  const defaultTag = (import.meta as any).env?.VITE_AMAZON_AFFILIATE_TAG || 'lunorapicks-20';
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      if (!error && data) {
        return {
          amazon_affiliate_tag: data.amazon_affiliate_tag || defaultTag,
          site_title: data.site_title || 'Lunora Picks',
        };
      }
    } catch (err) {
      console.warn('Error fetching Supabase settings, falling back to local:', err);
    }
  }

  // Fallback to local
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  return { amazon_affiliate_tag: defaultTag, site_title: 'Lunora Picks' };
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase URL and Anon Key are not configured.' };
  }
  try {
    const { error } = await supabase.from('products').select('id', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') {
        return { success: false, message: 'Connected to Supabase project, but table "products" does not exist yet. Please execute the SQL Schema in your Supabase SQL Editor.' };
      }
      return { success: false, message: `Supabase error (${error.code || 'FAILED'}): ${error.message}` };
    }
    return { success: true, message: 'Connected and verified Supabase database successfully!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed.' };
  }
}

export async function updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...updated, updated_at: new Date().toISOString() });

    if (error) {
      console.error('Supabase settings update error:', error);
      const isRlsError =
        error.code === '42501' ||
        error.message?.toLowerCase().includes('policy') ||
        error.message?.toLowerCase().includes('row-level') ||
        error.message?.toLowerCase().includes('permission denied');

      const detailedMessage = isRlsError
        ? `Database permission denied (RLS): Supabase is blocking UPDATE on table "settings". Ensure an active policy exists allowing authenticated users to update settings (e.g. CREATE POLICY "Allow authenticated update of settings" ON public.settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);). Error: ${error.message}`
        : `Supabase settings update failed (${error.code || 'ERROR'}): ${error.message}`;

      // CRITICAL: Throw real error, NEVER silently update local cache or report success
      throw new Error(detailedMessage);
    }
  }

  // Only update local cache when Supabase write succeeds (or in unconfigured offline mode)
  localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

// Products CRUD
export async function getProducts(options?: {
  category?: string;
  isLiveOnly?: boolean;
  featuredOnly?: boolean;
  searchQuery?: string;
}): Promise<Product[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      let query = supabase.from('products').select('*');
      if (options?.isLiveOnly) {
        query = query.eq('is_live', true);
      }
      if (options?.category && options.category !== 'all') {
        query = query.ilike('category', `%${options.category}%`);
      }
      if (options?.featuredOnly) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        let items: Product[] = data;
        if (options?.searchQuery) {
          const q = options.searchQuery.toLowerCase();
          items = items.filter(
            p => p.title.toLowerCase().includes(q) ||
                 p.description.toLowerCase().includes(q) ||
                 p.category.toLowerCase().includes(q)
          );
        }
        return items;
      }
    } catch (err) {
      console.warn('Error fetching from Supabase, falling back to local catalog:', err);
    }
  }

  // Local fallback
  let items = getLocalProducts();
  if (options?.isLiveOnly) {
    items = items.filter(p => p.is_live);
  }
  if (options?.category && options.category !== 'all') {
    items = items.filter(p => p.category.toLowerCase() === options.category?.toLowerCase());
  }
  if (options?.featuredOnly) {
    items = items.filter(p => p.is_featured);
  }
  if (options?.searchQuery) {
    const q = options.searchQuery.toLowerCase();
    items = items.filter(
      p => p.title.toLowerCase().includes(q) ||
           p.description.toLowerCase().includes(q) ||
           p.category.toLowerCase().includes(q)
    );
  }
  return items;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
      if (!error && data) {
        return data as Product;
      }
    } catch (err) {
      console.warn('Error querying slug from Supabase:', err);
    }
  }

  const items = getLocalProducts();
  return items.find(p => p.slug === slug) || null;
}

export async function createProduct(productData: Omit<Product, 'id' | 'click_count' | 'created_at' | 'updated_at'>): Promise<Product> {
  const newProduct: Product = {
    ...productData,
    id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    click_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        slug: newProduct.slug,
        title: newProduct.title,
        description: newProduct.description,
        price: newProduct.price,
        category: newProduct.category,
        image_urls: newProduct.image_urls,
        amazon_url: newProduct.amazon_url,
        badge: newProduct.badge,
        is_featured: newProduct.is_featured,
        is_live: newProduct.is_live,
        click_count: 0,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase product create error:', error);
      const isRlsError =
        error.code === '42501' ||
        error.message?.toLowerCase().includes('policy') ||
        error.message?.toLowerCase().includes('row-level') ||
        error.message?.toLowerCase().includes('permission denied');

      const isUniqueError =
        error.code === '23505' ||
        error.message?.toLowerCase().includes('unique') ||
        error.message?.toLowerCase().includes('already exists');

      let detailedMessage = `Supabase product creation failed (${error.code || 'ERROR'}): ${error.message}`;
      if (isRlsError) {
        detailedMessage = `Database permission denied (RLS): Supabase is blocking INSERT on table "products". Ensure an active INSERT policy exists for authenticated users (e.g. CREATE POLICY "Allow authenticated insert of products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);). Error: ${error.message}`;
      } else if (isUniqueError) {
        detailedMessage = `Duplicate product listing: A product with URL slug "${newProduct.slug}" already exists in the database. Please change the title or slug.`;
      }

      // CRITICAL: Throw real error, NEVER silently update local cache or report success
      throw new Error(detailedMessage);
    }

    if (data) {
      const savedProduct = data as Product;
      // Synchronize local cache with real database record
      const items = getLocalProducts();
      const updated = [savedProduct, ...items.filter(p => p.id !== savedProduct.id && p.slug !== savedProduct.slug)];
      saveLocalProducts(updated);
      return savedProduct;
    }
  }

  // Local fallback ONLY when Supabase credentials are not configured
  const items = getLocalProducts();
  const updated = [newProduct, ...items];
  saveLocalProducts(updated);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>, slugFallback?: string): Promise<Product> {
  const supabase = getSupabase();
  if (supabase) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    // If Postgres returned 22P02 (invalid UUID syntax on seed ID like 'prod-1') and slug is provided, try updating by unique slug
    const effectiveSlug = slugFallback || updates.slug;
    if (error && (error.code === '22P02' || error.message?.toLowerCase().includes('invalid input syntax for type uuid')) && effectiveSlug) {
      const slugRes = await supabase
        .from('products')
        .update(payload)
        .eq('slug', effectiveSlug)
        .select()
        .single();
      if (!slugRes.error) {
        data = slugRes.data;
        error = null;
      }
    }

    if (error) {
      console.error('Supabase product update error:', error);
      const isRlsError =
        error.code === '42501' ||
        error.message?.toLowerCase().includes('policy') ||
        error.message?.toLowerCase().includes('row-level') ||
        error.message?.toLowerCase().includes('permission denied');

      const isUniqueError =
        error.code === '23505' ||
        error.message?.toLowerCase().includes('unique') ||
        error.message?.toLowerCase().includes('already exists');

      let detailedMessage = `Supabase product update failed (${error.code || 'ERROR'}): ${error.message}`;
      if (isRlsError) {
        detailedMessage = `Database permission denied (RLS): Supabase is blocking UPDATE on table "products". Ensure an active UPDATE policy exists for authenticated users (e.g. CREATE POLICY "Allow authenticated update of products" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);). Error: ${error.message}`;
      } else if (isUniqueError) {
        detailedMessage = `Duplicate product listing: The URL slug "${updates.slug}" is already used by another product.`;
      }

      // CRITICAL: Throw real error, NEVER silently update local cache or report success
      throw new Error(detailedMessage);
    }

    if (data) {
      const updatedProduct = data as Product;
      // Synchronize local cache with real database response
      const items = getLocalProducts();
      const index = items.findIndex(p => p.id === id || (effectiveSlug && p.slug === effectiveSlug));
      if (index !== -1) {
        items[index] = updatedProduct;
        saveLocalProducts(items);
      }
      return updatedProduct;
    }
  }

  // Local fallback ONLY when Supabase credentials are not configured
  const items = getLocalProducts();
  const index = items.findIndex(p => p.id === id || (updates.slug && p.slug === updates.slug));
  if (index !== -1) {
    items[index] = {
      ...items[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveLocalProducts(items);
    return items[index];
  }
  throw new Error(`Product with ID "${id}" was not found in catalog.`);
}

export async function deleteProduct(id: string, slug?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    // 1. Execute and await the Supabase delete call
    let { error } = await supabase.from('products').delete().eq('id', id);

    // 2. If Postgres returned 22P02 (invalid UUID syntax, e.g. deleting mock seed ID 'prod-1' in a UUID column) and slug is present, try slug
    if (error && (error.code === '22P02' || error.message?.toLowerCase().includes('invalid input syntax for type uuid')) && slug) {
      const slugRes = await supabase.from('products').delete().eq('slug', slug);
      if (!slugRes.error) {
        error = null;
      }
    }

    // 3. Propagate and format Supabase errors instead of silently swallowing them
    if (error) {
      console.error('Supabase delete error:', error);
      const isRlsError =
        error.code === '42501' ||
        error.message?.toLowerCase().includes('policy') ||
        error.message?.toLowerCase().includes('row-level') ||
        error.message?.toLowerCase().includes('permission denied');

      const detailedMessage = isRlsError
        ? `Database permission denied (RLS): Supabase Row Level Security is blocking DELETE on table "products". Ensure an active DELETE policy exists for authenticated users (e.g. CREATE POLICY "Allow authenticated delete of products" ON public.products FOR DELETE TO authenticated USING (true);). Error: ${error.message}`
        : `Supabase delete failed (${error.code || 'ERROR'}): ${error.message || 'Unknown database error'}`;

      throw new Error(detailedMessage);
    }
  }

  // Local fallback / optimistic cache sync
  const items = getLocalProducts();
  const updated = items.filter((p) => p.id !== id && (!slug || p.slug !== slug));
  saveLocalProducts(updated);
  return true;
}

export async function incrementClickCount(slug: string): Promise<number> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      // Try calling RPC function if defined
      const { error } = await supabase.rpc('increment_product_clicks', { target_slug: slug });
      if (error) {
        // Fallback to fetch and update
        const { data: prod } = await supabase
          .from('products')
          .select('id, click_count')
          .eq('slug', slug)
          .single();
        if (prod) {
          await supabase
            .from('products')
            .update({ click_count: (prod.click_count || 0) + 1 })
            .eq('id', prod.id);
          return (prod.click_count || 0) + 1;
        }
      }
    } catch (err) {
      console.warn('Supabase click increment error:', err);
    }
  }

  // Local fallback
  const items = getLocalProducts();
  const product = items.find(p => p.slug === slug);
  if (product) {
    product.click_count = (product.click_count || 0) + 1;
    product.updated_at = new Date().toISOString();
    saveLocalProducts(items);
    return product.click_count;
  }
  return 0;
}

// Builds the final Amazon Affiliate URL
export function buildAmazonAffiliateUrl(rawUrl: string, affiliateTag: string): string {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set('tag', affiliateTag.trim());
    return url.toString();
  } catch (err) {
    // If raw string isn't standard URL format, concatenate safely
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}tag=${encodeURIComponent(affiliateTag.trim())}`;
  }
}

export const PRODUCT_IMAGES_BUCKET = 'product-images';

/**
 * Uploads a product image file to the Supabase Storage bucket named 'product-images'
 * and returns the publicly accessible URL.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) {
    const noConfigMsg = 'Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are set to enable image uploads, or switch to "Paste URL".';
    console.error('[Supabase Storage]', noConfigMsg);
    throw new Error(noConfigMsg);
  }

  const { url: activeUrl } = getSupabaseConfig();

  // Validate file format (jpg, jpeg, png, webp, gif, avif)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/avif'];
  const extensionMatch = file.name.match(/\.(jpe?g|png|webp|gif|avif)$/i);
  if (!allowedTypes.includes(file.type.toLowerCase()) && !extensionMatch) {
    throw new Error('Unsupported file format. Please select an image file (JPG, PNG, or WEBP).');
  }

  // 10MB size limit check
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image file is too large (maximum allowed size is 10MB).');
  }

  // Runtime check: Call supabase.storage.listBuckets() before uploading
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('[Supabase Storage] listBuckets() error:', listError.message);
    } else if (Array.isArray(buckets)) {
      const bucketExists = buckets.some(
        (b) => b.id === PRODUCT_IMAGES_BUCKET || b.name === PRODUCT_IMAGES_BUCKET
      );

      if (!bucketExists) {
        const foundBuckets = buckets.map(b => `"${b.name || b.id}"`).join(', ') || 'none';
        const notFoundMsg = `Storage bucket '${PRODUCT_IMAGES_BUCKET}' not found — please create it in Supabase under Storage as a Public bucket (Found buckets: ${foundBuckets}).`;
        console.error('[Supabase Storage]', notFoundMsg);
        throw new Error(notFoundMsg);
      }
    }
  } catch (bucketCheckErr: any) {
    // If the bucket check explicitly found it missing and threw, re-throw immediately
    if (bucketCheckErr?.message?.includes(`Storage bucket '${PRODUCT_IMAGES_BUCKET}' not found`)) {
      throw bucketCheckErr;
    }
    console.warn('[Supabase Storage] listBuckets() call caught exception (permissions/network):', bucketCheckErr?.message);
  }

  // Create sanitized unique filename: timestamp + sanitized original name
  const sanitizedOriginal = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const extension = extensionMatch ? extensionMatch[0].toLowerCase() : '.jpg';
  const fileName = `${Date.now()}-${sanitizedOriginal}${extension}`;

  let uploadResult: any = null;
  try {
    uploadResult = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
  } catch (thrownError: any) {
    // Console.log the COMPLETE error object with all properties
    console.error('[Supabase Storage] Complete upload() thrown exception object:', {
      message: thrownError?.message,
      name: thrownError?.name,
      cause: thrownError?.cause,
      status: thrownError?.status,
      statusCode: thrownError?.statusCode,
      stack: thrownError?.stack,
      fullError: thrownError,
    });

    const causeStr = thrownError?.cause ? ` (cause: ${String(thrownError.cause)})` : '';
    const statusStr = thrownError?.status || thrownError?.statusCode ? ` [Status ${thrownError.status || thrownError.statusCode}]` : '';

    if (thrownError?.message === 'Failed to fetch' || thrownError?.name === 'TypeError') {
      const helpfulMsg = `Failed to fetch${causeStr}${statusStr}: Browser could not reach Supabase Storage at "${(supabase as any)?.supabaseUrl || activeUrl}". ` +
        `Root causes: 1) The Storage bucket "${PRODUCT_IMAGES_BUCKET}" does not exist, 2) Storage RLS or CORS is blocking the request, or 3) An adblocker / browser extension is blocking supabase.co. Check browser console for full diagnostic logs.`;
      console.error('[Supabase Storage]', helpfulMsg);
      throw new Error(helpfulMsg);
    }

    throw new Error(`Upload failed: ${thrownError?.message || 'Unknown network error'}`);
  }

  const { data, error } = uploadResult || {};

  if (error) {
    // Console.log the COMPLETE returned error object
    console.error('[Supabase Storage] Complete upload() returned error object:', {
      message: error.message,
      name: error.name,
      cause: (error as any).cause,
      status: (error as any).status,
      statusCode: (error as any).statusCode,
      fullError: error,
    });

    const msg = error.message || '';
    if (
      msg.toLowerCase().includes('bucket not found') ||
      (error as any).statusCode === '404' ||
      (error as any).status === 404
    ) {
      throw new Error(
        `Storage bucket '${PRODUCT_IMAGES_BUCKET}' not found — please create it in Supabase under Storage as a Public bucket.`
      );
    }
    if (
      msg.toLowerCase().includes('policy') ||
      msg.toLowerCase().includes('row-level') ||
      msg.toLowerCase().includes('permission denied') ||
      msg.toLowerCase().includes('security') ||
      (error as any).statusCode === '403' ||
      (error as any).status === 403
    ) {
      throw new Error(
        `Permission denied by Supabase Storage RLS. Make sure bucket '${PRODUCT_IMAGES_BUCKET}' is public and has an INSERT policy (e.g. CREATE POLICY "Allow upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '${PRODUCT_IMAGES_BUCKET}');).`
      );
    }
    throw new Error(`Upload failed (${error.name || 'StorageError'}): ${error.message}`);
  }

  // Retrieve public URL
  const { data: publicUrlData } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(fileName);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Failed to generate public URL for uploaded image.');
  }

  return publicUrlData.publicUrl;
}

// Newsletter subscription helpers & local caching
function getLocalSubscribers(): NewsletterSubscriber[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUBSCRIBERS_KEY);
    if (!raw) {
      // Migrate legacy string array if present
      const legacyRaw = localStorage.getItem('lunora_newsletter_emails');
      if (legacyRaw) {
        const legacyEmails: string[] = JSON.parse(legacyRaw);
        const migrated: NewsletterSubscriber[] = legacyEmails.map((email, idx) => ({
          id: `migrated-${idx}`,
          email: email.trim().toLowerCase(),
          subscribed_at: new Date(Date.now() - (legacyEmails.length - idx) * 3600000).toISOString(),
        }));
        localStorage.setItem(LOCAL_STORAGE_SUBSCRIBERS_KEY, JSON.stringify(migrated));
        return migrated.sort(
          (a, b) => new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime()
        );
      }
      return [];
    }
    const list: NewsletterSubscriber[] = JSON.parse(raw);
    return list.sort(
      (a, b) => new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime()
    );
  } catch {
    return [];
  }
}

function saveLocalSubscriber(subscriber: NewsletterSubscriber) {
  try {
    const list = getLocalSubscribers();
    const filtered = list.filter((s) => s.email.toLowerCase() !== subscriber.email.toLowerCase());
    filtered.unshift(subscriber);
    localStorage.setItem(LOCAL_STORAGE_SUBSCRIBERS_KEY, JSON.stringify(filtered));
  } catch {}
}

function deleteLocalSubscriber(emailOrId: string) {
  try {
    const list = getLocalSubscribers();
    const target = emailOrId.toLowerCase();
    const filtered = list.filter((s) => s.id !== emailOrId && s.email.toLowerCase() !== target);
    localStorage.setItem(LOCAL_STORAGE_SUBSCRIBERS_KEY, JSON.stringify(filtered));
  } catch {}
}

// Newsletter subscription
export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const subscribedAt = new Date().toISOString();
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: cleanEmail, subscribed_at: subscribedAt }])
        .select();

      if (error) {
        // Postgres 23505 = unique constraint violation
        if (
          error.code === '23505' ||
          error.message?.toLowerCase().includes('duplicate') ||
          error.message?.toLowerCase().includes('unique')
        ) {
          return { success: false, message: "You're already subscribed." };
        }

        console.error('Supabase newsletter subscribe error:', error);
      } else {
        const insertedId = data?.[0]?.id || `sub-${Date.now()}`;
        saveLocalSubscriber({
          id: insertedId,
          email: cleanEmail,
          subscribed_at: subscribedAt,
        });
        return { success: true, message: "You're subscribed!" };
      }
    } catch (err) {
      console.warn('Newsletter submission exception:', err);
    }
  }

  // Fallback / local persistence when Supabase client is offline or table is initializing
  const existingList = getLocalSubscribers();
  if (existingList.some((s) => s.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: "You're already subscribed." };
  }

  saveLocalSubscriber({
    id: `sub-${Date.now()}`,
    email: cleanEmail,
    subscribed_at: subscribedAt,
  });

  return { success: true, message: "You're subscribed!" };
}

// Fetch all newsletter subscribers (sorted newest first)
export async function fetchSubscribers(): Promise<NewsletterSubscriber[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // Sync local cache
        localStorage.setItem(LOCAL_STORAGE_SUBSCRIBERS_KEY, JSON.stringify(data));
        return (data as NewsletterSubscriber[]).sort(
          (a, b) => new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime()
        );
      }
      if (error) {
        console.warn('Supabase fetchSubscribers error:', error);
      }
    } catch (err) {
      console.warn('Error fetching subscribers from Supabase:', err);
    }
  }

  return getLocalSubscribers();
}

// Delete a subscriber by ID or Email
export async function deleteSubscriber(emailOrId: string): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(emailOrId);
      const query = isUuid
        ? supabase.from('newsletter_subscribers').delete().eq('id', emailOrId)
        : supabase.from('newsletter_subscribers').delete().eq('email', emailOrId.toLowerCase());

      const { error } = await query;
      if (error) {
        console.warn('Supabase deleteSubscriber error:', error);
      }
    } catch (err) {
      console.warn('Error deleting subscriber from Supabase:', err);
    }
  }

  deleteLocalSubscriber(emailOrId);
  return { success: true, message: 'Subscriber removed.' };
}


// Wishlist helpers
export function getWishlist(): string[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function toggleWishlist(productId: string): string[] {
  const current = getWishlist();
  const next = current.includes(productId)
    ? current.filter(id => id !== productId)
    : [...current, productId];
  localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, JSON.stringify(next));
  return next;
}
