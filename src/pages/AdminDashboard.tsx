import React, { useState, useRef, useEffect } from 'react';
import { Product, SiteSettings, NewsletterSubscriber } from '../types';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateSettings,
  isSupabaseConnected,
  testSupabaseConnection,
  buildAmazonAffiliateUrl,
  uploadProductImage,
  fetchSubscribers,
  deleteSubscriber,
} from '../lib/supabase';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  BarChart3,
  Settings as SettingsIcon,
  Database,
  UploadCloud,
  Download,
  Check,
  AlertCircle,
  Copy,
  Sparkles,
  LogOut,
  MousePointerClick,
  TrendingUp,
  Boxes,
  X,
  RefreshCw,
  ChevronDown,
  Link2,
  ImageIcon,
  Mail,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

interface AdminDashboardProps {
  adminEmail: string;
  onLogout: () => void;
  products: Product[];
  onRefreshProducts: () => Promise<void>;
  settings: SiteSettings;
  onRefreshSettings: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onViewProduct: (product: Product) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminEmail,
  onLogout,
  products,
  onRefreshProducts,
  settings,
  onRefreshSettings,
  onShowToast,
  onViewProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'analytics' | 'settings' | 'subscribers' | 'supabase' | 'bulk'>('catalog');

  // Subscribers State
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [deletingSubscriber, setDeletingSubscriber] = useState<NewsletterSubscriber | null>(null);
  const [isDeletingSub, setIsDeletingSub] = useState(false);

  // Product List Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'live' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'clicks' | 'price'>('newest');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCategory, setFormCategory] = useState('Home & Living');
  const [formNewCategory, setFormNewCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmazonUrl, setFormAmazonUrl] = useState('');
  const [formImageUrlsText, setFormImageUrlsText] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsLive, setFormIsLive] = useState(true);
  const [formSaving, setFormSaving] = useState(false);

  // Settings State
  const [affiliateTagInput, setAffiliateTagInput] = useState(settings.amazon_affiliate_tag || 'lunorapicks-20');
  const [savingSettings, setSavingSettings] = useState(false);

  // Supabase Connection State
  const [testingConnection, setTestingConnection] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Bulk CSV state
  const [csvText, setCsvText] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);

  // Delete Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [rlsSqlCopied, setRlsSqlCopied] = useState(false);

  // Image Upload vs URL Mode State
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing Categories (including any added dynamically by admin)
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const existingCategories = Array.from(
    new Set([
      ...products.map((p) => p.category).filter(Boolean),
      ...customCategories.filter(Boolean),
    ])
  );

  const handleAddCategoryInline = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      onShowToast('Please enter a category name.', 'error');
      return;
    }
    setCustomCategories((prev) => Array.from(new Set([...prev, trimmed])));
    setFormCategory(trimmed);
    setNewCategoryInput('');
    setIsAddingCategoryInline(false);
    onShowToast(`Category "${trimmed}" added and selected!`, 'success');
  };

  // Helper to auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (newTitle: string) => {
    setFormTitle(newTitle);
    if (!editingProduct) {
      setFormSlug(generateSlug(newTitle));
    }
  };

  // Image Upload Processing
  const processImageUpload = async (file: File) => {
    const validExtensions = /\.(jpe?g|png|webp|gif|avif)$/i;
    if (!file.type.startsWith('image/') && !file.name.match(validExtensions)) {
      const msg = 'Invalid file format. Please upload an image (JPG, PNG, or WEBP).';
      setUploadError(msg);
      onShowToast(msg, 'error');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const publicUrl = await uploadProductImage(file);
      setFormImageUrlsText(publicUrl);
      onShowToast('Product image uploaded successfully to Supabase Storage!', 'success');
    } catch (err: any) {
      console.error('[AdminDashboard] Image upload failed. Full error details:', {
        message: err?.message,
        name: err?.name,
        cause: err?.cause,
        status: err?.status,
        statusCode: err?.statusCode,
        stack: err?.stack,
        rawError: err,
      });
      const errMsg = err?.message || 'Failed to upload image to Supabase Storage.';
      setUploadError(errMsg);
      onShowToast(errMsg, 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processImageUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processImageUpload(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveUploadedImage = () => {
    setFormImageUrlsText('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open Modal for Add
  const openAddModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormSlug('');
    setFormPrice(49.99);
    setFormCategory(existingCategories[0] || 'Home & Living');
    setFormNewCategory('');
    setNewCategoryInput('');
    setIsAddingCategoryInline(false);
    setShowMoreOptions(false);
    setFormDescription('');
    setFormAmazonUrl('');
    setFormImageUrlsText('');
    setImageMode('url');
    setIsUploadingImage(false);
    setUploadError(null);
    setIsDraggingFile(false);
    setFormBadge('');
    setFormIsFeatured(false);
    setFormIsLive(true);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormTitle(p.title);
    setFormSlug(p.slug);
    setFormPrice(p.price);
    setFormCategory(p.category);
    setFormNewCategory('');
    setNewCategoryInput('');
    setIsAddingCategoryInline(false);
    setShowMoreOptions(false);
    setFormDescription(p.description);
    setFormAmazonUrl(p.amazon_url);
    const imgUrls = (p.image_urls || []).join('\n');
    setFormImageUrlsText(imgUrls);
    if (imgUrls.includes('product-images') || imgUrls.includes('/storage/v1/object/public/')) {
      setImageMode('upload');
    } else {
      setImageMode('url');
    }
    setIsUploadingImage(false);
    setUploadError(null);
    setIsDraggingFile(false);
    setFormBadge(p.badge || '');
    setFormIsFeatured(p.is_featured);
    setFormIsLive(p.is_live);
    setIsModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAmazonUrl) {
      onShowToast('Title and Product URL are required.', 'error');
      return;
    }

    if (isUploadingImage) {
      onShowToast('Please wait for the image upload to complete.', 'info');
      return;
    }

    if (!formImageUrlsText.trim()) {
      onShowToast(
        imageMode === 'upload'
          ? 'Please upload a product image or switch to Paste URL.'
          : 'Please provide a product image URL.',
        'error'
      );
      return;
    }

    setFormSaving(true);
    const resolvedCategory = newCategoryInput.trim()
      ? newCategoryInput.trim()
      : formNewCategory.trim()
      ? formNewCategory.trim()
      : formCategory;

    if (newCategoryInput.trim()) {
      setCustomCategories((prev) => Array.from(new Set([...prev, newCategoryInput.trim()])));
    }

    const cleanSlug = formSlug.trim() || generateSlug(formTitle);

    // Split image URLs by newline or comma
    const rawUrls = formImageUrlsText
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 5);

    const imageUrls = rawUrls.length > 0
      ? rawUrls
      : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'];

    try {
      if (editingProduct) {
        await updateProduct(
          editingProduct.id,
          {
            title: formTitle,
            slug: cleanSlug,
            price: Number(formPrice) || 0,
            category: resolvedCategory,
            description: formDescription,
            amazon_url: formAmazonUrl,
            image_urls: imageUrls,
            badge: formBadge.trim() || null,
            is_featured: formIsFeatured,
            is_live: formIsLive,
          },
          editingProduct.slug
        );
        onShowToast(`Updated "${formTitle}" successfully!`, 'success');
      } else {
        await createProduct({
          title: formTitle,
          slug: cleanSlug,
          price: Number(formPrice) || 0,
          category: resolvedCategory,
          description: formDescription,
          amazon_url: formAmazonUrl,
          image_urls: imageUrls,
          badge: formBadge.trim() || null,
          is_featured: formIsFeatured,
          is_live: formIsLive,
        });
        onShowToast(`Created pick "${formTitle}"!`, 'success');
      }

      await onRefreshProducts();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      onShowToast(err.message || 'Error saving product to database', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  // Initiate Product Delete Flow (opens custom confirmation modal to prevent blocked window.confirm)
  const handleDeleteClick = (p: Product) => {
    setDeleteError(null);
    setProductToDelete(p);
  };

  // Confirmed Delete execution
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    setDeleteError(null);

    try {
      await deleteProduct(productToDelete.id, productToDelete.slug);
      // Immediately refresh catalog in parent state and Supabase
      await onRefreshProducts();
      onShowToast(`Deleted "${productToDelete.title}" from catalog.`, 'success');
      setProductToDelete(null);
    } catch (err: any) {
      console.error('Delete error in admin dashboard:', err);
      const msg = err?.message || 'Failed to delete product from database.';
      setDeleteError(msg);
      onShowToast(msg, 'error');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Copy RLS Fix SQL specifically for DELETE & CRUD policies
  const handleCopyRlsFixSql = () => {
    const sql = `-- Fix Supabase RLS DELETE and Full Access Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated delete of products" ON public.products;
CREATE POLICY "Allow authenticated delete of products"
ON public.products FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated admin full access to products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated admin full access" ON public.products;
CREATE POLICY "Allow authenticated admin full access to products"
ON public.products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sql);
      setRlsSqlCopied(true);
      onShowToast('Copied Supabase RLS DELETE fix SQL to clipboard!', 'success');
      setTimeout(() => setRlsSqlCopied(false), 2500);
    }
  };

  // Toggle Live Visibility (waits for Supabase write before updating UI)
  const handleToggleLive = async (p: Product) => {
    const nextStatus = !p.is_live;
    try {
      await updateProduct(p.id, { is_live: nextStatus }, p.slug);
      await onRefreshProducts();
      onShowToast(`Product "${p.title}" is now ${nextStatus ? 'Live' : 'Hidden'}`, 'success');
    } catch (err: any) {
      console.error('Failed to toggle live status:', err);
      onShowToast(err.message || `Failed to update visibility for "${p.title}"`, 'error');
    }
  };

  // Toggle Featured (waits for Supabase write before updating UI)
  const handleToggleFeatured = async (p: Product) => {
    const nextFeatured = !p.is_featured;
    try {
      await updateProduct(p.id, { is_featured: nextFeatured }, p.slug);
      await onRefreshProducts();
      onShowToast(
        `Product "${p.title}" ${nextFeatured ? 'featured on homepage' : 'removed from featured'}`,
        'success'
      );
    } catch (err: any) {
      console.error('Failed to toggle featured status:', err);
      onShowToast(err.message || `Failed to update featured status for "${p.title}"`, 'error');
    }
  };

  // Save Affiliate Tag (waits for Supabase write before updating UI)
  const handleSaveAffiliateTag = async () => {
    setSavingSettings(true);
    try {
      await updateSettings({ amazon_affiliate_tag: affiliateTagInput.trim() });
      await onRefreshSettings();
      onShowToast(`Updated site-wide Affiliate Tag to "${affiliateTagInput.trim()}"`, 'success');
    } catch (err: any) {
      console.error('Failed to update settings in Supabase:', err);
      onShowToast(err.message || 'Failed to update settings in Supabase database.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Test Supabase connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    onShowToast('Testing Supabase database connection...', 'info');
    const result = await testSupabaseConnection();
    setTestingConnection(false);
    if (result.success) {
      onShowToast(result.message, 'success');
      await onRefreshProducts();
      await onRefreshSettings();
    } else {
      onShowToast(result.message, 'error');
    }
  };

  // Copy SQL schema
  const handleCopySql = () => {
    const sql = `-- Lunora Picks Supabase Schema
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  amazon_url TEXT NOT NULL,
  badge TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_live BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  amazon_affiliate_tag TEXT NOT NULL DEFAULT 'lunorapicks-20',
  site_title TEXT NOT NULL DEFAULT 'Lunora Picks',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of live products" ON public.products;
CREATE POLICY "Allow public read of live products" ON public.products FOR SELECT USING (is_live = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated insert of products" ON public.products;
CREATE POLICY "Allow authenticated insert of products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update of products" ON public.products;
CREATE POLICY "Allow authenticated update of products" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete of products" ON public.products;
CREATE POLICY "Allow authenticated delete of products" ON public.products FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated admin full access to products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated admin full access" ON public.products;
CREATE POLICY "Allow authenticated admin full access to products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read of settings" ON public.settings;
CREATE POLICY "Allow public read of settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated update of settings" ON public.settings;
CREATE POLICY "Allow authenticated update of settings" ON public.settings FOR UPDATE TO authenticated USING (true);

-- Storage Bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public read of product-images" ON storage.objects;
CREATE POLICY "Allow public read of product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow upload of product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload of product-images" ON storage.objects;
CREATE POLICY "Allow upload of product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow update of product-images" ON storage.objects;
CREATE POLICY "Allow update of product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow delete of product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete of product-images" ON storage.objects;
CREATE POLICY "Allow delete of product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');
`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sql);
      setSqlCopied(true);
      onShowToast('Supabase SQL Schema copied to clipboard!', 'success');
      setTimeout(() => setSqlCopied(false), 2500);
    }
  };

  // Bulk CSV Import (waits for database write and reports any failed rows)
  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    setImportingCsv(true);

    try {
      const lines = csvText.trim().split('\n');
      let count = 0;
      const errors: string[] = [];

      for (const line of lines) {
        // format: title, price, category, amazon_url, imageUrl
        const parts = line.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 3 && parts[0].toLowerCase() !== 'title') {
          const title = parts[0];
          const price = parseFloat(parts[1]) || 29.99;
          const category = parts[2] || 'Home & Living';
          const amazonUrl = parts[3] || 'https://www.amazon.com/dp/example';
          const img = parts[4] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';

          try {
            await createProduct({
              title,
              slug: generateSlug(title),
              price,
              category,
              description: `A curated ${category.toLowerCase()} discovery selected for modern aesthetics.`,
              amazon_url: amazonUrl,
              image_urls: [img],
              is_featured: false,
              is_live: true,
            });
            count++;
          } catch (lineErr: any) {
            console.error(`Failed to import "${title}":`, lineErr);
            errors.push(`"${title}": ${lineErr.message}`);
          }
        }
      }

      await onRefreshProducts();

      if (errors.length > 0) {
        if (count > 0) {
          onShowToast(`Imported ${count} items. ${errors.length} failed: ${errors[0]}`, 'error');
        } else {
          onShowToast(`CSV import failed: ${errors[0]}`, 'error');
        }
      } else if (count > 0) {
        onShowToast(`Successfully imported all ${count} products to database!`, 'success');
        setCsvText('');
      } else {
        onShowToast('No valid product rows found in CSV text.', 'info');
      }
    } catch (err: any) {
      onShowToast('CSV import error: ' + err.message, 'error');
    } finally {
      setImportingCsv(false);
    }
  };

  // Export catalog
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lunora-picks-catalog-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Exported catalog to JSON', 'info');
  };

  // Filter and sort products
  const filteredProducts = products.filter((p) => {
    if (visibilityFilter === 'live' && !p.is_live) return false;
    if (visibilityFilter === 'hidden' && p.is_live) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filteredProducts.sort((a, b) => {
    if (sortBy === 'clicks') return (b.click_count || 0) - (a.click_count || 0);
    if (sortBy === 'price') return Number(b.price) - Number(a.price);
    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
  });

  // Analytics metrics
  const totalProducts = products.length;
  const liveProducts = products.filter((p) => p.is_live).length;
  const totalClicks = products.reduce((sum, p) => sum + (p.click_count || 0), 0);
  const topProducts = [...products]
    .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
    .slice(0, 5);

  const isConnected = isSupabaseConnected();

  // Load subscribers from Supabase / local storage
  const loadSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const data = await fetchSubscribers();
      setSubscribers(data);
    } catch (err) {
      console.warn('Error loading subscribers:', err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  useEffect(() => {
    if (activeTab === 'subscribers') {
      loadSubscribers();
    }
  }, [activeTab]);

  const handleConfirmDeleteSubscriber = async () => {
    if (!deletingSubscriber) return;
    setIsDeletingSub(true);
    try {
      const target = deletingSubscriber.id || deletingSubscriber.email;
      const res = await deleteSubscriber(target);
      if (res.success) {
        setSubscribers((prev) =>
          prev.filter(
            (s) =>
              s.email.toLowerCase() !== deletingSubscriber.email.toLowerCase() &&
              s.id !== deletingSubscriber.id
          )
        );
        onShowToast(`Removed ${deletingSubscriber.email}`, 'info');
      } else {
        onShowToast(res.message || 'Failed to remove subscriber', 'error');
      }
    } catch (err) {
      onShowToast('Error removing subscriber', 'error');
    } finally {
      setIsDeletingSub(false);
      setDeletingSubscriber(null);
    }
  };

  const handleExportSubscribersCsv = () => {
    if (subscribers.length === 0) {
      onShowToast('No subscribers to export', 'info');
      return;
    }
    const header = 'Email,Subscribed At (ISO),Formatted Date\n';
    const rows = subscribers
      .map((s) => {
        const formatted = formatSubscriberDate(s.subscribed_at);
        return `"${s.email}","${s.subscribed_at}","${formatted}"`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast(`Exported ${subscribers.length} subscribers`, 'success');
  };

  const formatSubscriberDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const filteredSubscribers = subscribers.filter((s) => {
    if (!subscriberSearch.trim()) return true;
    return s.email.toLowerCase().includes(subscriberSearch.trim().toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      
      {/* Top Header & Admin Session Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e6ca85]/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-[#e6ca85] font-semibold">
              Admin Portal
            </span>
            <span className="text-xs text-[#8c887d]">• {adminEmail}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#edebe6]">
            Catalog & Affiliate Control Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Supabase status badge */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isConnected ? 'Supabase Live' : 'Local Fallback'}</span>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle variant="admin" />

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 min-h-[40px] sm:min-h-[44px] rounded-xl text-xs sm:text-[13px] font-bold bg-[#e6ca85] text-[#0b0c0f] hover:bg-[#f3e5ab] hover:scale-[1.03] active:scale-[0.97] shadow-md transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pick</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 min-h-[40px] sm:min-h-[44px] rounded-xl text-xs sm:text-[13px] font-medium border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e6ca85]/15 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-[13px] font-semibold rounded-t-xl transition-all duration-200 hover:scale-[1.02] border-b-2 -mb-[2px] whitespace-nowrap flex-shrink-0 min-h-[42px] ${
            activeTab === 'catalog'
              ? 'border-[#e6ca85] text-[#e6ca85] bg-[#161822]'
              : 'border-transparent text-[#9e9a8e] hover:text-[#edebe6]'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Product Catalog ({totalProducts})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-[13px] font-semibold rounded-t-xl transition-all duration-200 hover:scale-[1.02] border-b-2 -mb-[2px] whitespace-nowrap flex-shrink-0 min-h-[42px] ${
            activeTab === 'analytics'
              ? 'border-[#e6ca85] text-[#e6ca85] bg-[#161822]'
              : 'border-transparent text-[#9e9a8e] hover:text-[#edebe6]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Click Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-[13px] font-semibold rounded-t-xl transition-all duration-200 hover:scale-[1.02] border-b-2 -mb-[2px] whitespace-nowrap flex-shrink-0 min-h-[42px] ${
            activeTab === 'settings'
              ? 'border-[#e6ca85] text-[#e6ca85] bg-[#161822]'
              : 'border-transparent text-[#9e9a8e] hover:text-[#edebe6]'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Affiliate Tag</span>
        </button>

        <button
          onClick={() => setActiveTab('subscribers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-[13px] font-semibold rounded-t-xl transition-all duration-200 hover:scale-[1.02] border-b-2 -mb-[2px] whitespace-nowrap flex-shrink-0 min-h-[42px] ${
            activeTab === 'subscribers'
              ? 'border-[#e6ca85] text-[#e6ca85] bg-[#161822]'
              : 'border-transparent text-[#9e9a8e] hover:text-[#edebe6]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Subscribers ({subscribers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-[13px] font-semibold rounded-t-xl transition-all duration-200 hover:scale-[1.02] border-b-2 -mb-[2px] whitespace-nowrap flex-shrink-0 min-h-[42px] ${
            activeTab === 'supabase'
              ? 'border-[#e6ca85] text-[#e6ca85] bg-[#161822]'
              : 'border-transparent text-[#9e9a8e] hover:text-[#edebe6]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase / Postgres</span>
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-[13px] font-semibold rounded-t-xl transition-all duration-200 hover:scale-[1.02] border-b-2 -mb-[2px] whitespace-nowrap flex-shrink-0 min-h-[42px] ${
            activeTab === 'bulk'
              ? 'border-[#e6ca85] text-[#e6ca85] bg-[#161822]'
              : 'border-transparent text-[#9e9a8e] hover:text-[#edebe6]'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Bulk CSV</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          
          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl glass-card border border-[#e6ca85]/15">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8e8a7e]" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 min-h-[44px] rounded-xl bg-[#14161f] border border-[#e6ca85]/20 text-[16px] sm:text-xs text-[#edebe6] focus:outline-none focus:border-[#e6ca85]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#14161f] border border-[#e6ca85]/20 text-[#edebe6] text-xs rounded-xl px-3 min-h-[44px] focus:outline-none focus:border-[#e6ca85]"
            >
              <option value="all">All Categories</option>
              {existingCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Live Filter */}
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="bg-[#14161f] border border-[#e6ca85]/20 text-[#edebe6] text-xs rounded-xl px-3 min-h-[44px] focus:outline-none focus:border-[#e6ca85]"
            >
              <option value="all">All Visibility (Live & Hidden)</option>
              <option value="live">Live Only</option>
              <option value="hidden">Hidden Only</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#14161f] border border-[#e6ca85]/20 text-[#edebe6] text-xs rounded-xl px-3 min-h-[44px] focus:outline-none focus:border-[#e6ca85]"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="clicks">Sort: Most Direct Clicks</option>
              <option value="price">Sort: Price</option>
            </select>
          </div>

          {/* Product Table */}
          <div className="rounded-2xl glass-card border border-[#e6ca85]/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] sm:text-[14px] min-w-[720px]">
                <thead className="bg-[#14161f] border-b border-[#e6ca85]/15 text-[#9e9a8e] uppercase tracking-wider text-[11px] sm:text-xs">
                  <tr>
                    <th className="p-4">Item & Slug</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Clicks</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6ca85]/10">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Product */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_urls?.[0]}
                            alt={p.title}
                            className="w-12 h-12 rounded-lg object-cover bg-[#14161f] flex-shrink-0"
                          />
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <p className="font-medium text-[#edebe6] truncate font-serif text-[14px] sm:text-[15px]">
                              {p.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-[#78756d] font-mono">
                                /product/{p.slug}
                              </span>
                              {p.badge && (
                                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded bg-[#e6ca85]/20 text-[#e6ca85] border border-[#e6ca85]/30 font-mono">
                                  {p.badge}
                                </span>
                              )}
                              {p.is_featured && (
                                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4 text-[#c5c1b6] whitespace-nowrap text-[13px] sm:text-[14px]">
                        {p.category}
                      </td>

                      {/* Price */}
                      <td className="p-4 font-bold text-[#e6ca85] whitespace-nowrap font-serif text-[15px] sm:text-base">
                        ${Number(p.price).toFixed(2)}
                      </td>

                      {/* Clicks */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full text-xs">
                          <MousePointerClick className="w-3.5 h-3.5" />
                          {p.click_count || 0}
                        </span>
                      </td>

                      {/* Status / Toggles */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleLive(p)}
                            className={`p-2 rounded-lg border transition-all duration-200 hover:scale-110 active:scale-95 ${
                              p.is_live
                                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                : 'border-neutral-700 text-neutral-500 bg-neutral-800'
                            }`}
                            title={p.is_live ? 'Currently Live (click to hide)' : 'Hidden (click to make live)'}
                          >
                            {p.is_live ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleToggleFeatured(p)}
                            className={`p-2 rounded-lg border transition-all duration-200 hover:scale-110 active:scale-95 ${
                              p.is_featured
                                ? 'border-amber-500/30 text-amber-300 bg-amber-500/10'
                                : 'border-neutral-700 text-neutral-500 hover:text-white'
                            }`}
                            title="Toggle Homepage Feature"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewProduct(p)}
                            className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200"
                            title="View Landing Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 rounded-lg hover:bg-white/10 text-[#e6ca85] hover:text-[#f7ecc8] hover:scale-110 active:scale-95 transition-all duration-200"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(p)}
                            className="p-2 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 hover:scale-110 active:scale-95 transition-all duration-200"
                            title={`Delete ${p.title}`}
                            aria-label={`Delete ${p.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-[#9e9a8e]">
                No items match your filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS WIDGET */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl glass-card border border-[#e6ca85]/20 space-y-2">
              <div className="flex items-center justify-between text-[#8e8a7e]">
                <span className="text-xs uppercase tracking-wider font-semibold">Total Outbound Clicks</span>
                <MousePointerClick className="w-4 h-4 text-[#e6ca85]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#edebe6]">{totalClicks}</p>
              <p className="text-[11px] text-[#716e64]">Tracked via /out/:slug redirect</p>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-[#e6ca85]/20 space-y-2">
              <div className="flex items-center justify-between text-[#8e8a7e]">
                <span className="text-xs uppercase tracking-wider font-semibold">Active Products</span>
                <Boxes className="w-4 h-4 text-[#e6ca85]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#edebe6]">{liveProducts} / {totalProducts}</p>
              <p className="text-[11px] text-[#716e64]">Published on storefront</p>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-[#e6ca85]/20 space-y-2">
              <div className="flex items-center justify-between text-[#8e8a7e]">
                <span className="text-xs uppercase tracking-wider font-semibold">Avg. Clicks / Item</span>
                <TrendingUp className="w-4 h-4 text-[#e6ca85]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#edebe6]">
                {totalProducts > 0 ? (totalClicks / totalProducts).toFixed(1) : 0}
              </p>
              <p className="text-[11px] text-[#716e64]">Conversion intent rate</p>
            </div>
          </div>

          {/* Top 5 Products by Clicks */}
          <div className="rounded-2xl glass-card p-6 border border-[#e6ca85]/20 space-y-4">
            <h3 className="font-serif text-xl text-[#edebe6]">Top 5 Products by Direct Clicks</h3>
            <div className="space-y-3">
              {topProducts.map((p, idx) => {
                const percentage = totalClicks > 0 ? Math.round(((p.click_count || 0) / totalClicks) * 100) : 0;
                return (
                  <div key={p.id} className="p-3 rounded-xl bg-[#14161f] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-5 font-serif font-bold text-[#e6ca85]">#{idx + 1}</span>
                        <span className="font-medium text-[#edebe6] truncate max-w-md">{p.title}</span>
                      </div>
                      <span className="font-bold text-emerald-400">{p.click_count || 0} clicks ({percentage}%)</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-[#0b0c0f] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#e6ca85] to-[#d4af37] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS (AFFILIATE TAG) */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6 rounded-2xl glass-card p-6 sm:p-8 border border-[#e6ca85]/20">
          <div className="space-y-1">
            <h3 className="font-serif text-xl text-[#edebe6]">Global Partner Affiliate Tag Configuration</h3>
            <p className="text-xs text-[#9e9a8e]">
              This partner tag is automatically injected into outbound product URLs via the <code className="text-[#e6ca85]">/out/:slug</code> redirect route.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#cfcbbf] uppercase tracking-wider mb-2">
                Merchant / Partner Affiliate Tag
              </label>
              <input
                type="text"
                value={affiliateTagInput}
                onChange={(e) => setAffiliateTagInput(e.target.value)}
                placeholder="e.g. lunorapicks-20"
                className="w-full px-4 min-h-[44px] sm:min-h-[48px] rounded-xl bg-[#14161f] border border-[#e6ca85]/30 text-[16px] sm:text-sm text-[#edebe6] focus:outline-none focus:border-[#e6ca85]"
              />
              <p className="text-[11px] text-[#78756d] mt-2">
                Stored in Supabase <code className="text-[#e6ca85]">settings</code> table. Admin never needs to manually paste the tag onto individual product links.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveAffiliateTag}
                disabled={savingSettings}
                className="min-h-[42px] sm:min-h-[46px] px-6 rounded-xl text-xs sm:text-[13px] font-bold tracking-wider uppercase bg-gradient-to-r from-[#e6ca85] to-[#d4af37] text-[#0b0c0f] hover:from-[#edd79c] hover:to-[#dfbb45] transition-all shadow-md disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Affiliate Tag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SUBSCRIBERS */}
      {activeTab === 'subscribers' && (
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="rounded-2xl glass-card p-6 sm:p-8 border border-[#e6ca85]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-serif text-2xl text-[#edebe6]">Newsletter Subscribers</h3>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#e6ca85]/15 text-[#e6ca85] border border-[#e6ca85]/30">
                  {subscribers.length} total subscribers
                </span>
              </div>
              <p className="text-xs text-[#9e9a8e]">
                Readers subscribed to The Weekly Edit Sunday digest via the homepage newsletter form.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={loadSubscribers}
                disabled={loadingSubscribers}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-[#e6ca85]/30 text-[#e6ca85] hover:bg-[#e6ca85]/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                title="Refresh subscribers list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSubscribers ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportSubscribersCsv}
                disabled={subscribers.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-white/10 text-[#d4d1c9] hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40"
                title="Download subscribers CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7d796e]" />
              <input
                type="text"
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                placeholder="Filter by email address..."
                className="w-full pl-10 pr-9 min-h-[44px] rounded-xl bg-[#14161f] border border-[#e6ca85]/20 text-[16px] sm:text-xs text-[#edebe6] focus:outline-none focus:border-[#e6ca85] transition-all placeholder:text-[#7d796e]"
              />
              {subscriberSearch && (
                <button
                  type="button"
                  onClick={() => setSubscriberSearch('')}
                  className="absolute right-3 top-3.5 text-[#7d796e] hover:text-[#edebe6]"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {subscriberSearch && (
              <span className="text-xs text-[#9e9a8e] font-mono self-center">
                Showing {filteredSubscribers.length} of {subscribers.length}
              </span>
            )}
          </div>

          {/* Subscribers Table */}
          <div className="rounded-2xl glass-card border border-[#e6ca85]/20 overflow-hidden shadow-lg">
            {loadingSubscribers && subscribers.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-[#e6ca85] animate-spin mx-auto" />
                <p className="text-xs text-[#9e9a8e]">Loading subscribers from database...</p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#e6ca85]/10 border border-[#e6ca85]/30 flex items-center justify-center mx-auto text-[#e6ca85]">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-lg text-[#edebe6]">
                    {subscriberSearch ? 'No matching subscribers' : 'No subscribers yet'}
                  </h4>
                  <p className="text-xs text-[#9e9a8e] max-w-md mx-auto">
                    {subscriberSearch
                      ? `No subscribers matched the query "${subscriberSearch}". Try a different search term.`
                      : 'When visitors subscribe to The Weekly Edit on the homepage, their email addresses and subscription timestamps will appear here.'}
                  </p>
                </div>
                {subscriberSearch && (
                  <button
                    onClick={() => setSubscriberSearch('')}
                    className="mt-2 text-xs text-[#e6ca85] hover:underline"
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[560px] text-[13px] sm:text-[14px]">
                  <thead>
                    <tr className="border-b border-[#e6ca85]/15 bg-[#141620]/60 text-[11px] font-mono uppercase tracking-wider text-[#9e9a8e]">
                      <th className="py-3.5 px-4 font-medium w-14">#</th>
                      <th className="py-3.5 px-4 font-medium">Subscriber Email</th>
                      <th className="py-3.5 px-4 font-medium">Subscribed Date / Time</th>
                      <th className="py-3.5 px-4 font-medium">Status</th>
                      <th className="py-3.5 px-4 font-medium text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[13px] sm:text-[14px]">
                    {filteredSubscribers.map((sub, idx) => (
                      <tr
                        key={sub.id || sub.email}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-[#7d796e] text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#e6ca85]/10 border border-[#e6ca85]/30 flex items-center justify-center text-[#e6ca85] font-mono text-xs uppercase font-medium flex-shrink-0">
                              {sub.email.charAt(0)}
                            </div>
                            <span className="font-mono text-xs sm:text-[13px] text-[#edebe6] select-all font-medium">
                              {sub.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#9e9a8e] font-mono text-xs">
                          {formatSubscriberDate(sub.subscribed_at)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-medium border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setDeletingSubscriber(sub)}
                            className="p-2 rounded-lg hover:bg-rose-500/20 text-[#7d796e] hover:text-rose-400 hover:scale-110 active:scale-95 transition-all duration-200"
                            title={`Delete ${sub.email}`}
                            aria-label={`Delete ${sub.email}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SUPABASE CONFIG & SQL MIGRATION */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-card p-6 sm:p-8 border border-[#e6ca85]/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl text-[#edebe6]">Supabase Postgres & Authentication</h3>
                <p className="text-xs text-[#9e9a8e] mt-1">
                  Database configuration is provided securely via <code className="text-[#e6ca85]">VITE_SUPABASE_URL</code> and <code className="text-[#e6ca85]">VITE_SUPABASE_ANON_KEY</code> environment variables.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    isConnected
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : 'border-amber-500/30 text-amber-300 bg-amber-500/10'
                  }`}
                >
                  {isConnected ? 'Database Live' : 'Not Connected'}
                </span>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-4 min-h-[38px] rounded-xl text-xs font-bold bg-[#e6ca85] text-[#0b0c0f] hover:bg-[#f3e5ab] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
          </div>

          {/* SQL Schema Copy Card */}
          <div className="rounded-2xl glass-card p-6 sm:p-8 border border-[#e6ca85]/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif text-lg text-[#edebe6]">Supabase SQL Schema & RLS Setup</h4>
                <p className="text-xs text-[#8c887d]">
                  Run this SQL in your Supabase SQL Editor to create tables with automated RLS policies.
                </p>
              </div>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6ca85]/30 text-xs text-[#e6ca85] hover:bg-[#e6ca85]/10"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? 'Copied SQL' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#090a0d] border border-white/10 text-[11px] font-mono text-[#a09c91] overflow-x-auto max-h-56">
{`-- Products table with RLS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  amazon_url TEXT NOT NULL,
  badge TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_live BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crucial: Explicit DELETE policy for authenticated admin
CREATE POLICY "Allow authenticated delete of products"
ON public.products FOR DELETE
TO authenticated
USING (true);

-- Storage bucket & policies for image uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Allow public read of product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Allow upload of product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Allow update of product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
CREATE POLICY "Allow delete of product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');`}
            </pre>
          </div>

          {/* Dedicated RLS Permissions & Troubleshooting Card */}
          <div className="rounded-2xl glass-card p-6 sm:p-8 border border-amber-500/30 bg-amber-500/[0.02] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#e6ca85] font-bold">
                    Database Security & Permissions
                  </span>
                </div>
                <h4 className="font-serif text-lg text-[#edebe6] mt-1">
                  Row Level Security (RLS) DELETE Policy
                </h4>
                <p className="text-xs text-[#8c887d] max-w-xl">
                  Supabase requires an explicit DELETE policy for authenticated admin sessions. If deleting products fails with an RLS error, execute this script in the Supabase SQL Editor.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyRlsFixSql}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e6ca85]/40 text-xs font-semibold text-[#e6ca85] hover:bg-[#e6ca85]/10 shrink-0 transition-colors"
              >
                {rlsSqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{rlsSqlCopied ? 'Copied RLS SQL' : 'Copy RLS DELETE Fix'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#090a0d] border border-white/10 text-[11px] font-mono text-[#a09c91] overflow-x-auto">
{`-- Enable RLS and grant explicit DELETE permissions to authenticated admins
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated delete of products" ON public.products;
CREATE POLICY "Allow authenticated delete of products"
ON public.products FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated admin full access to products" ON public.products;
CREATE POLICY "Allow authenticated admin full access to products"
ON public.products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: BULK CSV IMPORT / EXPORT */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-card p-6 sm:p-8 border border-[#e6ca85]/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl text-[#edebe6]">Bulk CSV Product Import</h3>
                <p className="text-xs text-[#9e9a8e]">
                  Paste multiple products in comma-separated format to batch create listings.
                </p>
              </div>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6ca85]/30 text-xs text-[#e6ca85] hover:bg-[#e6ca85]/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Catalog (JSON)</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#cfcbbf]">
                CSV Format: Title, Price, Category, ProductURL, ImageURL
              </label>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`"Minimal Ceramic Mug", 24.00, "Kitchen & Coffee", "https://merchant.example.com/product/mug", "https://images.unsplash.com/..."
"Linen Throw Blanket", 58.00, "Home & Living", "https://merchant.example.com/product/blanket", "https://images.unsplash.com/..."`}
                className="w-full p-4 rounded-xl bg-[#14161f] border border-[#e6ca85]/20 text-xs text-[#edebe6] font-mono focus:outline-none focus:border-[#e6ca85]"
              />
            </div>

            <button
              onClick={handleImportCsv}
              disabled={importingCsv || !csvText.trim()}
              className="py-2.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#e6ca85] to-[#d4af37] text-[#0b0c0f] hover:from-[#edd79c] transition-all disabled:opacity-50"
            >
              {importingCsv ? 'Processing CSV...' : 'Import Products to Catalog'}
            </button>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-[#11131a] rounded-3xl border border-[#e6ca85]/30 p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e6ca85]/15">
              <div>
                <h2 className="font-serif text-2xl text-[#edebe6]">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-xs text-[#a09c91] mt-0.5">
                  {editingProduct ? 'Update product details and links.' : 'Quick single-column entry. Essential fields are visible by default.'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clean Single-Column Form */}
            <form onSubmit={handleSaveProduct} className="space-y-5">
              
              {/* 1. Title */}
              <div>
                <label className="block text-xs font-semibold text-[#edebe6] uppercase tracking-wider mb-1.5">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Vitruvi Stone Ultrasonic Aromatherapy Diffuser"
                  required
                  className="w-full px-4 min-h-[44px] sm:min-h-[48px] rounded-xl bg-[#171a24] border border-[#e6ca85]/25 text-[16px] sm:text-sm text-[#edebe6] placeholder:text-[#6b675d] focus:outline-none focus:border-[#e6ca85] transition-colors"
                />
              </div>

              {/* 2. Display Price */}
              <div>
                <label className="block text-xs font-semibold text-[#edebe6] uppercase tracking-wider mb-1.5">
                  Price ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-sm font-mono text-[#e6ca85]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                    placeholder="49.99"
                    required
                    className="w-full pl-8 pr-4 min-h-[44px] sm:min-h-[48px] rounded-xl bg-[#171a24] border border-[#e6ca85]/25 text-[16px] sm:text-sm font-mono text-[#edebe6] focus:outline-none focus:border-[#e6ca85] transition-colors"
                  />
                </div>
              </div>

              {/* 3. Category with Easy Inline Add */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#edebe6] uppercase tracking-wider">
                    Category *
                  </label>
                  {!isAddingCategoryInline && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategoryInline(true);
                        setNewCategoryInput('');
                      }}
                      className="text-xs text-[#e6ca85] hover:text-[#f7ecc8] font-mono flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Category</span>
                    </button>
                  )}
                </div>

                {!isAddingCategoryInline ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingCategoryInline(true);
                          setNewCategoryInput('');
                        } else {
                          setFormCategory(e.target.value);
                        }
                      }}
                      className="flex-1 px-4 min-h-[44px] sm:min-h-[48px] rounded-xl bg-[#171a24] border border-[#e6ca85]/25 text-[16px] sm:text-sm text-[#edebe6] focus:outline-none focus:border-[#e6ca85] transition-colors"
                    >
                      {existingCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__add_new__" className="text-[#e6ca85] font-semibold">
                        + Add New Category...
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategoryInline(true);
                        setNewCategoryInput('');
                      }}
                      className="px-3.5 min-h-[44px] sm:min-h-[48px] rounded-xl bg-[#171a24] border border-[#e6ca85]/30 hover:border-[#e6ca85] text-[#e6ca85] hover:text-[#f7ecc8] text-xs font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0"
                      title="Add a new category"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">New Category</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#141620] border border-[#e6ca85]/40 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#edebe6]">New Category Name:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategoryInline(false);
                          setNewCategoryInput('');
                        }}
                        className="text-[11px] text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. Workspace Audio, Fragrance & Living..."
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategoryInline();
                          }
                        }}
                        className="flex-1 px-3.5 min-h-[42px] rounded-lg bg-[#171a24] border border-[#e6ca85]/30 text-[16px] sm:text-sm text-[#edebe6] placeholder:text-[#6b675d] focus:outline-none focus:border-[#e6ca85]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategoryInline}
                        className="px-4 min-h-[42px] rounded-lg bg-[#e6ca85] text-[#0b0c0f] font-semibold text-xs hover:brightness-105 transition-all flex-shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Product Image (Toggle: Paste URL vs Upload Image) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#edebe6] uppercase tracking-wider">
                    Product Image *
                  </label>

                  {/* Mode switcher tabs */}
                  <div className="flex items-center p-0.5 rounded-lg bg-[#14161f] border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setImageMode('url');
                        setUploadError(null);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        imageMode === 'url'
                          ? 'bg-[#e6ca85] text-[#0b0c0f] font-semibold shadow'
                          : 'text-[#8c887d] hover:text-[#edebe6]'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span>Paste URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageMode('upload');
                        setUploadError(null);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        imageMode === 'upload'
                          ? 'bg-[#e6ca85] text-[#0b0c0f] font-semibold shadow'
                          : 'text-[#8c887d] hover:text-[#edebe6]'
                      }`}
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Upload Image</span>
                    </button>
                  </div>
                </div>

                {/* Tab 1: Paste URL (existing behavior, kept exactly as is) */}
                {imageMode === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={formImageUrlsText}
                      onChange={(e) => {
                        setFormImageUrlsText(e.target.value);
                        setUploadError(null);
                      }}
                      placeholder="https://images.unsplash.com/... or direct image address"
                      required={!formImageUrlsText.trim()}
                      className="w-full px-4 py-3 rounded-xl bg-[#171a24] border border-[#e6ca85]/25 text-sm text-[#edebe6] placeholder:text-[#6b675d] focus:outline-none focus:border-[#e6ca85] font-mono text-xs transition-colors"
                    />
                    {formImageUrlsText.trim().length > 10 && (
                      <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-[#14161f] border border-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={formImageUrlsText.split(/[\n,]+/)[0].trim()}
                            alt="Preview"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            className="w-10 h-10 rounded-md object-cover bg-black/40 border border-[#e6ca85]/20 flex-shrink-0"
                          />
                          <span className="text-[11px] text-[#a09c91] truncate font-mono">
                            {formImageUrlsText.split(/[\n,]+/)[0].trim()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormImageUrlsText('')}
                          className="p-1 text-[#8c887d] hover:text-rose-400 hover:bg-white/5 rounded transition-colors"
                          title="Clear URL"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Upload Image (drag-and-drop dropzone + file picker) */}
                {imageMode === 'upload' && (
                  <div className="space-y-2">
                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Thumbnail preview once uploaded, with small 'x' to remove/replace */}
                    {formImageUrlsText.trim().length > 5 && !isUploadingImage ? (
                      <div className="p-3 rounded-xl bg-[#14161f] border border-[#e6ca85]/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={formImageUrlsText.split(/[\n,]+/)[0].trim()}
                            alt="Uploaded preview"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            className="w-14 h-14 rounded-lg object-cover bg-black/40 border border-[#e6ca85]/25 flex-shrink-0 shadow"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-xs font-semibold text-[#edebe6]">
                                Image Uploaded
                              </span>
                            </div>
                            <p className="text-[11px] text-[#8c887d] font-mono truncate mt-0.5 max-w-[240px] sm:max-w-xs">
                              {formImageUrlsText.split(/[\n,]+/)[0].trim()}
                            </p>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-[10px] text-[#e6ca85] hover:underline mt-1 font-medium block"
                            >
                              Choose a different image
                            </button>
                          </div>
                        </div>
                        {/* Remove 'x' button */}
                        <button
                          type="button"
                          onClick={handleRemoveUploadedImage}
                          className="p-1.5 rounded-lg text-[#8c887d] hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex-shrink-0"
                          title="Remove uploaded image"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      /* Drag-and-drop Dropzone */
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={handleFileDrop}
                        onClick={() => {
                          if (!isUploadingImage) {
                            fileInputRef.current?.click();
                          }
                        }}
                        className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all ${
                          isDraggingFile
                            ? 'border-[#e6ca85] bg-[#e6ca85]/10 scale-[1.01]'
                            : 'border-[#e6ca85]/30 hover:border-[#e6ca85]/60 hover:bg-[#e6ca85]/[0.02] bg-[#14161f]'
                        } ${isUploadingImage ? 'pointer-events-none opacity-80' : ''}`}
                      >
                        {isUploadingImage ? (
                          /* Loading state */
                          <div className="flex flex-col items-center justify-center py-2 space-y-2">
                            <RefreshCw className="w-6 h-6 text-[#e6ca85] animate-spin" />
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-[#edebe6]">
                                Uploading to Supabase Storage...
                              </p>
                              <p className="text-[10px] text-[#8c887d]">
                                Storing in bucket "product-images"
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Dropzone prompt */
                          <div className="flex flex-col items-center justify-center py-1 space-y-1.5">
                            <div className="w-9 h-9 rounded-xl bg-[#e6ca85]/10 border border-[#e6ca85]/20 flex items-center justify-center text-[#e6ca85]">
                              <UploadCloud className="w-4 h-4" />
                            </div>
                            <p className="text-xs font-semibold text-[#edebe6]">
                              <span className="text-[#e6ca85] underline">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-[10px] text-[#8c887d]">
                              Accepts JPG, PNG, or WEBP (up to 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Clear error message if upload fails */}
                    {uploadError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1 text-[11px] leading-relaxed">
                          <strong className="font-semibold block text-rose-200">Upload Failed:</strong>
                          {uploadError}
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadError(null)}
                          className="text-rose-400 hover:text-rose-200 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Product / Amazon Link */}
              <div>
                <label className="block text-xs font-semibold text-[#edebe6] uppercase tracking-wider mb-1.5">
                  Product URL / Amazon Link *
                </label>
                <input
                  type="url"
                  value={formAmazonUrl}
                  onChange={(e) => setFormAmazonUrl(e.target.value)}
                  placeholder="https://www.amazon.com/dp/... or merchant link"
                  required
                  className="w-full px-4 min-h-[44px] sm:min-h-[48px] rounded-xl bg-[#171a24] border border-[#e6ca85]/25 text-[16px] sm:text-xs text-[#edebe6] placeholder:text-[#6b675d] focus:outline-none focus:border-[#e6ca85] font-mono transition-colors"
                />
                <p className="text-[11px] text-[#716e64] mt-1">
                  Affiliate referral tag is auto-injected upon outbound click.
                </p>
              </div>

              {/* 6. Description */}
              <div>
                <label className="block text-xs font-semibold text-[#edebe6] uppercase tracking-wider mb-1.5">
                  Description / Why We Picked It *
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explain why this piece is worth buying: materials, design, and practical everyday use..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#171a24] border border-[#e6ca85]/25 text-[16px] sm:text-sm text-[#edebe6] placeholder:text-[#6b675d] focus:outline-none focus:border-[#e6ca85] transition-colors leading-relaxed"
                />
              </div>

              {/* 7. Collapsible "More options" Section */}
              <div className="pt-2 border-t border-[#e6ca85]/15">
                <button
                  type="button"
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="flex items-center justify-between w-full py-2.5 px-3.5 min-h-[42px] rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 text-xs font-medium text-[#d4d1c9] transition-all"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#e6ca85]" />
                    <span>More options (Badge, Featured, Custom URL Slug, Visibility)</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#e6ca85] transition-transform duration-200 ${
                      showMoreOptions ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showMoreOptions && (
                  <div className="mt-3 p-4 rounded-xl bg-[#14161f] border border-[#e6ca85]/20 space-y-4 animate-in fade-in duration-150">
                    {/* Badge */}
                    <div>
                      <label className="block text-xs font-medium text-[#cfcbbf] mb-1">
                        Optional Badge
                      </label>
                      <input
                        type="text"
                        value={formBadge}
                        onChange={(e) => setFormBadge(e.target.value)}
                        placeholder="e.g. Best Seller, Staff Pick, Trending"
                        className="w-full px-3.5 min-h-[42px] rounded-lg bg-[#171a24] border border-white/10 text-[16px] sm:text-xs text-[#edebe6] focus:outline-none focus:border-[#e6ca85]"
                      />
                    </div>

                    {/* Custom URL Slug */}
                    <div>
                      <label className="block text-xs font-medium text-[#cfcbbf] mb-1">
                        Custom URL Slug (Auto-generated from title)
                      </label>
                      <div className="flex items-center bg-[#171a24] border border-white/10 rounded-lg px-3 min-h-[42px]">
                        <span className="text-neutral-500 font-mono text-xs">/product/</span>
                        <input
                          type="text"
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          className="bg-transparent text-[16px] sm:text-xs text-[#edebe6] focus:outline-none w-full font-mono ml-1"
                        />
                      </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="flex flex-wrap items-center gap-6 pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsLive}
                          onChange={(e) => setFormIsLive(e.target.checked)}
                          className="rounded border-[#e6ca85]/40 text-[#e6ca85] focus:ring-0 w-4 h-4 bg-[#171a24]"
                        />
                        <span className="text-xs font-medium text-[#edebe6]">Live on storefront</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsFeatured}
                          onChange={(e) => setFormIsFeatured(e.target.checked)}
                          className="rounded border-[#e6ca85]/40 text-[#e6ca85] focus:ring-0 w-4 h-4 bg-[#171a24]"
                        />
                        <span className="text-xs font-medium text-[#edebe6]">Featured on homepage</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#e6ca85]/15">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[42px] sm:min-h-[46px] px-5 rounded-xl border border-white/10 text-xs sm:text-[13px] font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="min-h-[42px] sm:min-h-[46px] px-6 rounded-xl text-xs sm:text-[13px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#e6ca85] to-[#d4af37] text-[#0b0c0f] hover:from-[#edd79c] transition-all shadow-md disabled:opacity-50"
                >
                  {formSaving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PRODUCT MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#11131a] rounded-3xl border border-rose-500/30 p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Close Button */}
            <button
              onClick={() => {
                if (!isDeletingProduct) {
                  setProductToDelete(null);
                  setDeleteError(null);
                }
              }}
              disabled={isDeletingProduct}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-[#8c887d] hover:text-[#edebe6] hover:bg-white/5 transition-colors disabled:opacity-40"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold">
                  Destructive Action
                </span>
                <h3 className="font-serif text-lg text-[#edebe6] leading-tight">
                  Delete Product Listing?
                </h3>
              </div>
            </div>

            {/* Product Summary Card */}
            <div className="p-3.5 rounded-2xl bg-[#171a24] border border-white/10 flex items-center gap-3">
              <img
                src={productToDelete.image_urls[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80'}
                alt={productToDelete.title}
                className="w-12 h-12 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-medium text-[#edebe6] truncate">
                  {productToDelete.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8c887d]">
                  <span className="text-[#e6ca85] font-mono font-semibold">
                    ${productToDelete.price.toFixed(2)}
                  </span>
                  <span>•</span>
                  <span className="truncate">{productToDelete.category}</span>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <p className="text-xs text-[#a09c91] leading-relaxed">
              This will permanently delete this product from your Supabase database and immediately remove it from the live public storefront. This cannot be undone.
            </p>

            {/* Error Message with RLS SQL Helper if deletion fails */}
            {deleteError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[11px] leading-relaxed">
                    <strong className="font-semibold block text-rose-200">Deletion Failed:</strong>
                    {deleteError}
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[10px] text-rose-300/80">Need to update Supabase RLS policies?</span>
                  <button
                    type="button"
                    onClick={handleCopyRlsFixSql}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 transition-colors w-fit"
                  >
                    {rlsSqlCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{rlsSqlCopied ? 'Copied SQL' : 'Copy RLS Fix SQL'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setProductToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeletingProduct}
                className="px-4 min-h-[42px] sm:min-h-[46px] rounded-xl text-xs sm:text-[13px] font-medium text-[#a09c91] hover:text-[#edebe6] hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingProduct}
                className="inline-flex items-center gap-2 px-5 min-h-[42px] sm:min-h-[46px] rounded-xl text-xs sm:text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingProduct ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SUBSCRIBER MODAL */}
      {deletingSubscriber && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#11131a] rounded-3xl border border-rose-500/30 p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => {
                if (!isDeletingSub) {
                  setDeletingSubscriber(null);
                }
              }}
              disabled={isDeletingSub}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-[#8c887d] hover:text-[#edebe6] hover:bg-white/5 transition-colors disabled:opacity-40"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold">
                  Delete Subscriber
                </span>
                <h3 className="font-serif text-lg text-[#edebe6] leading-tight">
                  Remove from Newsletter?
                </h3>
              </div>
            </div>

            {/* Content description */}
            <p className="text-xs text-[#d4d1c9] leading-relaxed">
              Are you sure you want to remove <strong className="font-mono text-[#f7ecc8] select-all">{deletingSubscriber.email}</strong> from the newsletter database? They will no longer receive weekly digest emails.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSubscriber(null)}
                disabled={isDeletingSub}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#a09c91] hover:text-[#edebe6] hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSubscriber}
                disabled={isDeletingSub}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingSub ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Subscriber</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
