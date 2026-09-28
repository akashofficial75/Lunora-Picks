import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Protect /admin and /out from search engine indexers with HTTP X-Robots-Tag
app.use((req, res, next) => {
  if (req.path === '/admin' || req.path === '/admin/' || req.path.startsWith('/out/')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  next();
});

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Lunora Picks' });
});

// 2. The Core Affiliate Out Redirect Route: /out/:slug
app.get('/out/:slug', async (req, res) => {
  const { slug } = req.params;
  const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const defaultTag = process.env.VITE_AMAZON_AFFILIATE_TAG || 'lunorapicks-20';

  let amazonUrl: string | null = null;
  let affiliateTag = defaultTag;

  if (rawSupabaseUrl && supabaseKey) {
    // Sanitize supabase URL: remove trailing slash, /rest/v1 or /auth/v1
    let cleanUrl = rawSupabaseUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
    try {
      const parsed = new URL(cleanUrl);
      if (parsed.hostname.endsWith('.supabase.co')) {
        cleanUrl = `${parsed.protocol}//${parsed.host}`;
      }
    } catch {}

    const supabase = createClient(cleanUrl, supabaseKey);

    // Fetch site affiliate tag
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('amazon_affiliate_tag')
        .single();
      if (settings && settings.amazon_affiliate_tag) {
        affiliateTag = settings.amazon_affiliate_tag;
      }
    } catch (e) {
      console.error('Error fetching settings for redirect:', e);
    }

    // Fetch product
    try {
      const { data: product } = await supabase
        .from('products')
        .select('id, amazon_url, click_count')
        .eq('slug', slug)
        .single();

      if (product && product.amazon_url) {
        amazonUrl = product.amazon_url;
        // Increment click count
        await supabase
          .from('products')
          .update({ click_count: (product.click_count || 0) + 1 })
          .eq('id', product.id);
      }
    } catch (e) {
      console.error('Error fetching product for redirect:', e);
    }
  }

  // Fallback if product URL not resolved in DB
  if (!amazonUrl) {
    const fallbackSearch = `https://www.amazon.com/s?k=${encodeURIComponent(slug.replace(/-/g, ' '))}&tag=${encodeURIComponent(affiliateTag)}`;
    return res.redirect(302, fallbackSearch);
  }

  let finalUrl: string;
  try {
    const parsed = new URL(amazonUrl);
    parsed.searchParams.set('tag', affiliateTag.trim());
    finalUrl = parsed.toString();
  } catch {
    const sep = amazonUrl.includes('?') ? '&' : '?';
    finalUrl = `${amazonUrl}${sep}tag=${encodeURIComponent(affiliateTag.trim())}`;
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.redirect(302, finalUrl);
});

async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lunora Picks server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
