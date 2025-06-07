// Simple API server for handling webhook messages
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { NameUpdateService } from '@/services/nameUpdateService';
// import { processIncomingMessage, validateMessageRequest } from './process-message';
import colorsRouter from './colors';
import geminiRouter from './gemini-routes';
import { forceUpdateAllUserNames } from '@/services/forceUpdateNames';

// تحميل متغيرات البيئة
dotenv.config();

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = 3002; // منفذ منفصل للـ API

// Middleware - CORS مفتوح للاختبار
app.use(cors({
  origin: true, // السماح لجميع الـ origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// إضافة مسار للملفات الثابتة
app.use(express.static('public'));

// إعداد ترميز UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Debug middleware - يجب أن يكون قبل جميع الـ routes
app.use((req, res, next) => {
  // فقط log للمسارات المهمة
  if (req.url.includes('/api/gemini') || req.url.includes('/api/debug')) {
    console.log(`🔍 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`📝 Body:`, JSON.stringify(req.body, null, 2));
    }
  }
  next();
});

// Colors management routes
app.use('/api/colors', colorsRouter);

console.log('🤖 Setting up Gemini AI routes...');
// استخدام مسارات Gemini المنفصلة
app.use('/api/gemini', geminiRouter);

// مسار مؤقت لاختبار معالجة الرسائل
app.post('/api/gemini-temp/process', async (req, res) => {
  console.log('🧪 TEMP GEMINI PROCESS ENDPOINT HIT!');
  console.log('📝 Body:', JSON.stringify(req.body, null, 2));

  try {
    const { senderId, messageText, pageId } = req.body;

    if (!senderId || !messageText || !pageId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: senderId, messageText, pageId'
      });
    }

    // استدعاء المعالج مباشرة
    const { GeminiMessageProcessor } = await import('../services/geminiMessageProcessor');
    const conversationId = `temp_${senderId}_${Date.now()}`;

    console.log('🚀 Calling temp processor...');
    const success = await GeminiMessageProcessor.processIncomingMessage(
      messageText,
      conversationId,
      senderId
    );

    res.json({
      success: success,
      message: success ? 'Temp Gemini AI processed successfully' : 'Temp Gemini AI failed'
    });

  } catch (error) {
    console.error('❌ Error in temp Gemini process:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Test endpoint for debugging
app.post('/api/debug-test', (req, res) => {
  console.log('🔥🔥🔥 DEBUG TEST ENDPOINT HIT! 🔥🔥🔥');
  console.log('📝 Body:', req.body);
  res.json({ success: true, message: 'Debug test endpoint working!', timestamp: new Date().toISOString() });
});

// تم نقل مسارات Gemini إلى gemini-routes.ts

// تم نقل مسار settings إلى gemini-routes.ts

// تم نقل مسار POST settings إلى gemini-routes.ts

// تم نقل مسار test إلى gemini-routes.ts

console.log('🔧 Setting up Categories API routes...');

// Test route
app.get('/api/test-categories', (req, res) => {
  console.log('🧪 Test Categories API called!');
  res.json({ message: 'Categories API is working!' });
});

// Test Gemini route (moved here)
app.get('/api/gemini/test-route-2', (req, res) => {
  console.log('🧪 Test Gemini route 2 called!');
  res.json({ message: 'Gemini API is working from here!' });
});

// مسار مباشر لصفحة اختبار Gemini
app.get('/test-gemini.html', (req, res) => {
  console.log('🌐 Test Gemini HTML page requested');
  res.sendFile('test-gemini.html', { root: process.cwd() });
});

// Categories API
app.get('/api/categories', async (req, res) => {
  console.log('📋 Categories API called!');
  try {
    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    res.json(categories || []);
  } catch (error) {
    console.error('Error in GET /categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categories/active', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching active categories:', error);
      return res.status(500).json({ error: 'Failed to fetch active categories' });
    }

    res.json(categories || []);
  } catch (error) {
    console.error('Error in GET /categories/active:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description, icon, color, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: name'
      });
    }

    const categoryData = {
      name: name.trim(),
      description: description?.trim() || '',
      icon: icon?.trim() || 'package',
      color: color?.trim() || 'blue',
      sort_order: parseInt(sort_order) || 0,
      is_active: true
    };

    const { data: category, error } = await supabase
      .from('product_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }

    console.log('✅ Category created successfully:', category.name);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error in POST /categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ error: 'Failed to delete category' });
    }

    console.log('✅ Category deleted successfully');
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Products with variants API
app.get('/api/products-variants', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products_with_variants')
      .select('*')
      .order('product_created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products with variants:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    res.json(products || []);
  } catch (error) {
    console.error('Error in GET /products-variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products-variants', async (req, res) => {
  try {
    const { name, description, category, base_price, brand, variants } = req.body;

    if (!name || !category || !base_price || !variants || variants.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: name, category, base_price, variants'
      });
    }

    // إضافة المنتج الأساسي
    const { data: product, error: productError } = await supabase
      .from('products_base')
      .insert({
        name: name.trim(),
        description: description?.trim() || '',
        category: category.trim(),
        base_price: parseFloat(base_price),
        brand: brand?.trim() || null
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return res.status(500).json({ error: 'Failed to create product' });
    }

    // إضافة المتغيرات
    const variantData = variants.map(variant => ({
      product_id: product.id,
      color: variant.color.trim(),
      size: variant.size.trim(),
      price: parseFloat(variant.price),
      stock_quantity: parseInt(variant.stock_quantity) || 0,
      image_url: variant.image_url?.trim() || null
    }));

    const { error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantData);

    if (variantsError) {
      console.error('Error creating variants:', variantsError);
      // حذف المنتج إذا فشل إنشاء المتغيرات
      await supabase.from('products_base').delete().eq('id', product.id);
      return res.status(500).json({ error: 'Failed to create product variants' });
    }

    console.log('✅ Product with variants created successfully:', product.name);
    res.status(201).json({ ...product, variants: variantData });
  } catch (error) {
    console.error('Error in POST /products-variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products-variants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // حذف المتغيرات أولاً
    const { error: variantsError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', id);

    if (variantsError) {
      console.error('Error deleting variants:', variantsError);
      return res.status(500).json({ error: 'Failed to delete product variants' });
    }

    // حذف المنتج
    const { error: productError } = await supabase
      .from('products_base')
      .delete()
      .eq('id', id);

    if (productError) {
      console.error('Error deleting product:', productError);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    console.log('✅ Product deleted successfully');
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /products-variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Facebook settings endpoints
app.get('/api/facebook/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('facebook_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching Facebook settings:', error);
    res.status(500).json({ error: 'Failed to fetch Facebook settings' });
  }
});

// 🔧 تفعيل/إيقاف صفحة Facebook
app.post('/api/facebook/toggle/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { action } = req.body; // 'activate' or 'deactivate'

    console.log(`🔧 ${action === 'activate' ? 'تفعيل' : 'إيقاف'} صفحة: ${pageId}`);

    const isActive = action === 'activate';
    const webhookEnabled = action === 'activate';

    const { data: updatedPage, error } = await supabase
      .from('facebook_settings')
      .update({
        is_active: isActive,
        webhook_enabled: webhookEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('page_id', pageId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling page:', error);
      return res.status(500).json({ error: 'Failed to toggle page' });
    }

    if (!updatedPage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    console.log(`✅ تم ${action === 'activate' ? 'تفعيل' : 'إيقاف'} صفحة ${updatedPage.page_name} بنجاح`);

    res.json({
      success: true,
      message: `تم ${action === 'activate' ? 'تفعيل' : 'إيقاف'} الصفحة بنجاح`,
      page: updatedPage
    });

  } catch (error) {
    console.error('Error in toggle page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔧 تحكم في Webhook للصفحة
app.post('/api/facebook/webhook/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { enabled } = req.body; // true or false

    console.log(`🔧 ${enabled ? 'تفعيل' : 'إيقاف'} webhook للصفحة: ${pageId}`);

    const { data: updatedPage, error } = await supabase
      .from('facebook_settings')
      .update({
        webhook_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('page_id', pageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating webhook status:', error);
      return res.status(500).json({ error: 'Failed to update webhook status' });
    }

    if (!updatedPage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    console.log(`✅ تم ${enabled ? 'تفعيل' : 'إيقاف'} webhook للصفحة ${updatedPage.page_name} بنجاح`);

    res.json({
      success: true,
      message: `تم ${enabled ? 'تفعيل' : 'إيقاف'} webhook بنجاح`,
      page: updatedPage
    });

  } catch (error) {
    console.error('Error in webhook control:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// قطع الاتصال مع صفحة - مع التحكم الذكي
app.post('/api/facebook/disconnect/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;

    console.log(`🔌 قطع الاتصال مع الصفحة: ${pageId}`);

    // جلب الـ Access Token الحالي
    const { data: currentSettings, error: fetchError } = await supabase
      .from('facebook_settings')
      .select('access_token, page_name')
      .eq('page_id', pageId)
      .single();

    if (fetchError) {
      throw new Error(`خطأ في جلب إعدادات الصفحة: ${fetchError.message}`);
    }

    // قطع الاتصال مع إيقاف الـ webhook
    const { error } = await supabase
      .from('facebook_settings')
      .update({
        is_active: false,
        webhook_enabled: false, // إيقاف الـ webhook فور سؤال
        disconnected_at: new Date().toISOString(),
        backup_access_token: currentSettings.access_token,
        access_token: null
      })
      .eq('page_id', pageId);

    if (error) {
      throw error;
    }

    console.log(`✅ تم قطع الاتصال مع صفحة ${currentSettings.page_name} وإيقاف الـ webhook`);

    res.json({
      success: true,
      message: 'تم قطع الاتصال وإيقاف الـ webhook بنجاح',
      pageId,
      pageName: currentSettings.page_name
    });
  } catch (error) {
    console.error('Error disconnecting page:', error);
    res.status(500).json({ error: error.message || 'Failed to disconnect page' });
  }
});

// إعادة تفعيل صفحة - مع التحكم الذكي
app.post('/api/facebook/reactivate/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;

    console.log(`🔄 إعادة تفعيل الصفحة: ${pageId}`);

    // جلب الـ Access Token المحفوظ
    const { data: currentSettings, error: fetchError } = await supabase
      .from('facebook_settings')
      .select('backup_access_token, page_name')
      .eq('page_id', pageId)
      .single();

    if (fetchError) {
      throw new Error(`خطأ في جلب إعدادات الصفحة: ${fetchError.message}`);
    }

    if (!currentSettings.backup_access_token) {
      throw new Error('لا يوجد Access Token محفوظ لهذه الصفحة. يرجى إعادة ربط الصفحة.');
    }

    // إعادة التفعيل مع تشغيل الـ webhook
    const { error } = await supabase
      .from('facebook_settings')
      .update({
        is_active: true,
        webhook_enabled: true, // تشغيل الـ webhook تلقائ سؤال
        disconnected_at: null,
        access_token: currentSettings.backup_access_token,
        backup_access_token: null
      })
      .eq('page_id', pageId);

    if (error) {
      throw error;
    }

    console.log(`✅ تم إعادة تفعيل صفحة ${currentSettings.page_name} وتشغيل الـ webhook`);

    res.json({
      success: true,
      message: 'تم إعادة التفعيل وتشغيل الـ webhook بنجاح',
      pageId,
      pageName: currentSettings.page_name
    });
  } catch (error) {
    console.error('Error reactivating page:', error);
    res.status(500).json({ error: error.message || 'Failed to reactivate page' });
  }
});

// حذف صفحة نهائياً مع تنظيف شامل
app.delete('/api/facebook/delete/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    console.log(`🗑️ Starting complete deletion of page: ${pageId}`);

    // 1. حذف إعدادات الصفحة
    const { error: settingsError } = await supabase
      .from('facebook_settings')
      .delete()
      .eq('page_id', pageId);

    if (settingsError) {
      console.error('❌ Error deleting page settings:', settingsError);
      throw settingsError;
    }
    console.log('✅ Page settings deleted');

    // 2. جلب معرفات المحادثات للصفحة
    const { data: pageConversations, error: fetchConversationsError } = await supabase
      .from('conversations')
      .select('id')
      .eq('facebook_page_id', pageId);

    if (fetchConversationsError) {
      console.error('❌ Error fetching conversations:', fetchConversationsError);
    }

    // حذف جميع الرسائل المرتبطة بالصفحة
    if (pageConversations && pageConversations.length > 0) {
      const conversationIds = pageConversations.map(c => c.id);
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .in('conversation_id', conversationIds);

      if (messagesError) {
        console.error('❌ Error deleting messages:', messagesError);
      } else {
        console.log(`✅ All messages deleted for ${conversationIds.length} conversations`);
      }
    }

    // 3. حذف جميع المحادثات المرتبطة بالصفحة
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .eq('facebook_page_id', pageId);

    if (conversationsError) {
      console.error('❌ Error deleting conversations:', conversationsError);
    } else {
      console.log('✅ All conversations deleted');
    }

    console.log(`🎉 Complete deletion of page ${pageId} finished`);
    res.json({
      success: true,
      message: 'تم حذف الصفحة وجميع البيانات المرتبطة بها بنجاح',
      pageId: pageId
    });
  } catch (error) {
    console.error('❌ Error in complete page deletion:', error);
    res.status(500).json({ error: error.message || 'Failed to delete page completely' });
  }
});

// تنظيف شامل للنظام - حذف جميع الصفحات التجريبية
app.post('/api/facebook/cleanup-system', async (req, res) => {
  try {
    console.log('🧹 Starting complete system cleanup...');

    // 1. حذف جميع الصفحات التجريبية
    const testPageIds = [
      'TEST_PAGE', 'DIRECT_TEST_PAGE', 'FINAL_TEST_PAGE', 'FINAL_TEST_PAGE_NEW',
      'FIXED_TEST_PAGE', 'PAGE_ID', 'test', 'TEST_PAGE_FINAL', 'TEST_PAGE_FINAL2',
      'TEST_PAGE_FINAL_FIXED', 'TEST_PAGE_FINAL_IMAGE', 'TEST_PAGE_FIXED',
      'TEST_PAGE_IMAGE', 'TEST_PAGE_IMAGE_CLEAR', 'TEST_PAGE_NEW',
      'TEST_PAGE_VISION', 'UPDATED_TEST_PAGE', '123'
    ];

    console.log(`🗑️ Deleting ${testPageIds.length} test pages...`);

    // أولاً: جلب معرفات المحادثات للصفحات التجريبية
    const { data: testConversations, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .in('facebook_page_id', testPageIds);

    if (fetchError) {
      console.error('❌ Error fetching test conversations:', fetchError);
    }

    // حذف الرسائل للمحادثات التجريبية
    if (testConversations && testConversations.length > 0) {
      const conversationIds = testConversations.map(c => c.id);
      const { error: testMessagesError } = await supabase
        .from('messages')
        .delete()
        .in('conversation_id', conversationIds);

      if (testMessagesError) {
        console.error('❌ Error deleting test messages:', testMessagesError);
      } else {
        console.log(`✅ Test messages deleted for ${conversationIds.length} conversations`);
      }
    }

    // حذف المحادثات للصفحات التجريبية
    const { error: testConversationsError } = await supabase
      .from('conversations')
      .delete()
      .in('facebook_page_id', testPageIds);

    if (testConversationsError) {
      console.error('❌ Error deleting test conversations:', testConversationsError);
    } else {
      console.log('✅ Test conversations deleted');
    }

    console.log('🎉 System cleanup completed successfully');
    res.json({
      success: true,
      message: 'تم تنظيف النظام بنجاح وحذف جميع الصفحات التجريبية',
      deletedTestPages: testPageIds.length
    });
  } catch (error) {
    console.error('❌ Error in system cleanup:', error);
    res.status(500).json({ error: error.message || 'Failed to cleanup system' });
  }
});

// إضافة صفحة Facebook جديدة مع إعدادات نظيفة
app.post('/api/facebook/add-page', async (req, res) => {
  try {
    const { pageId, pageName, accessToken, webhookUrl } = req.body;

    console.log(`➕ Adding new Facebook page: ${pageName} (${pageId})`);

    // التحقق من البيانات المطلوبة
    if (!pageId || !pageName || !accessToken) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['pageId', 'pageName', 'accessToken']
      });
    }

    // التحقق من عدم وجود الصفحة مسبقاً
    const { data: existingPage } = await supabase
      .from('facebook_settings')
      .select('page_id')
      .eq('page_id', pageId)
      .single();

    if (existingPage) {
      return res.status(409).json({
        error: 'Page already exists',
        message: 'هذه الصفحة موجودة بالفعل في النظام'
      });
    }

    // إضافة الصفحة الجديدة مع تفعيل الـ webhook
    const { data, error } = await supabase
      .from('facebook_settings')
      .insert({
        page_id: pageId,
        page_name: pageName,
        access_token: accessToken,
        webhook_url: webhookUrl || null,
        is_active: true,
        webhook_enabled: true, // تفعيل الـ webhook تلقائ سؤال
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding page:', error);
      throw error;
    }

    console.log(`✅ Page added successfully: ${pageName}`);
    res.json({
      success: true,
      message: 'تم إضافة الصفحة بنجاح',
      page: {
        id: data.id,
        pageId: data.page_id,
        pageName: data.page_name,
        isActive: data.is_active
      }
    });
  } catch (error) {
    console.error('❌ Error adding Facebook page:', error);
    res.status(500).json({ error: error.message || 'Failed to add Facebook page' });
  }
});

// Conversations endpoint
app.get('/api/conversations', async (req, res) => {
  try {
    console.log('📋 [API] Conversations endpoint called...');

    // دعم للـ limit parameter
    const limit = parseInt(req.query.limit as string) || 100;
    const validLimit = Math.min(Math.max(limit, 1), 200); // بين 1 و 200

    console.log(`📊 Fetching ${validLimit} conversations`);

    // جلب المحادثات أولاً
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(validLimit);

    if (error) {
      throw error;
    }

    // جلب معلومات الصفحات
    const { data: pages, error: pagesError } = await supabase
      .from('facebook_settings')
      .select('page_id, page_name');

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
    }

    // دمج البيانات
    const conversationsWithPageInfo = conversations?.map(conversation => {
      const pageInfo = pages?.find(page => page.page_id === conversation.facebook_page_id);
      console.log(`🔍 Conversation ${conversation.id}: facebook_page_id=${conversation.facebook_page_id}, found page: ${pageInfo?.page_name || 'NOT FOUND'}`);
      return {
        ...conversation,
        page_name: pageInfo?.page_name || 'صفحة غير معروفة'
      };
    }) || [];

    console.log(`✅ Successfully fetched ${conversationsWithPageInfo?.length || 0} conversations with page info`);
    console.log(`📄 Available pages: ${pages?.map(p => `${p.page_id}:${p.page_name}`).join(', ')}`);
    res.json(conversationsWithPageInfo);
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Messages endpoint
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message endpoint
app.post('/api/conversations/:id/messages', async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    const { id } = req.params;
    const { content, sender_type, image_url } = req.body;

    console.log(`📤 [${requestId}] START SENDING MESSAGE:`);
    console.log(`   📋 Conversation ID: ${id}`);
    console.log(`   📝 Content Length: ${content?.length || 0} chars`);
    console.log(`   📝 Content Preview: "${content?.substring(0, 30)}${content?.length > 30 ? '...' : ''}"`);
    console.log(`   👤 Sender Type: ${sender_type || 'admin'}`);
    console.log(`   🖼️ Has Image: ${image_url ? 'YES' : 'NO'}`);

    // التحقق من صحة البيانات
    if (!content?.trim() && !image_url) {
      console.log(`❌ [${requestId}] EMPTY MESSAGE - REJECTED`);
      return res.status(400).json({
        error: 'Message content or image is required',
        requestId
      });
    }

    // Save message to database
    console.log(`💾 [${requestId}] SAVING MESSAGE TO DATABASE...`);
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        content: content,
        sender_type: sender_type || 'admin',
        is_read: false,
        is_auto_reply: false,
        image_url: image_url
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ [${requestId}] DATABASE SAVE ERROR:`, error);
      throw error;
    }

    console.log(`✅ [${requestId}] MESSAGE SAVED SUCCESSFULLY - ID: ${data.id}`);

    // Update conversation last message
    console.log(`🔄 [${requestId}] UPDATING CONVERSATION...`);
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message: content || '[IMAGE]',
        last_message_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error(`⚠️ [${requestId}] CONVERSATION UPDATE ERROR:`, updateError);
    } else {
      console.log(`✅ [${requestId}] CONVERSATION UPDATED SUCCESSFULLY`);
    }

    const duration = Date.now() - startTime;
    console.log(`🏁 [${requestId}] MESSAGE SENDING COMPLETED - Duration: ${duration}ms`);

    res.json({
      ...data,
      requestId,
      duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${requestId}] MESSAGE SENDING FAILED (${duration}ms):`, error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message,
      requestId,
      duration
    });
  }
});

// Frontend logging endpoint - SIMPLE VERSION
app.post('/api/frontend-log', (req, res) => {
  console.log('🔥 FRONTEND LOG ENDPOINT HIT!');
  console.log('📝 Body:', req.body);

  const { level, message, data, timestamp, source } = req.body;
  const logPrefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'info' ? 'ℹ️' : '🔍';
  const logMessage = `${logPrefix} [FRONTEND-${source || 'UNKNOWN'}] ${message}`;

  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }

  res.json({ success: true });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Facebook Reply Automator API',
    webhook: '/api/process-message',
    health: '/health',
    frontendLog: '/api/frontend-log'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Message Processing API' });
});

// Test endpoint
app.post('/api/test-endpoint', (req, res) => {
  console.log('🧪 TEST ENDPOINT HIT!');
  console.log('📝 Body:', req.body);
  res.json({ success: true, message: 'Test endpoint working!' });
});

// إرسال رسائل لفيسبوك (وسيط لتجنب مشاكل CORS)
app.post('/api/facebook/send-message', async (req, res) => {
  try {
    const { access_token, recipient_id, message } = req.body;
    
    if (!access_token || !recipient_id || !message) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'access_token, recipient_id, and message are required'
      });
    }

    console.log('🔄 API Server: Forwarding message to Facebook...', {
      recipientIdPreview: recipient_id.substring(0, 5) + '...',
      messageLength: message.length
    });

    // إرسال الطلب إلى فيسبوك
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${access_token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipient_id },
          message: { text: message },
        }),
      }
    );

    // التعامل مع الرد من فيسبوك
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Facebook API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return res.status(response.status).json({
        error: 'Facebook API Error',
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ Message sent to Facebook successfully!');
    return res.json(data);
    
  } catch (error) {
    console.error('❌ Error in send-message endpoint:', error);
    return res.status(500).json({
      error: 'Failed to send message to Facebook',
      details: error.message
    });
  }
});

// إرسال صور لفيسبوك (وسيط لتجنب مشاكل CORS)
app.post('/api/facebook/send-image', async (req, res) => {
  try {
    const { access_token, recipient_id, image_url } = req.body;
    
    if (!access_token || !recipient_id || !image_url) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'access_token, recipient_id, and image_url are required'
      });
    }

    console.log('🔄 API Server: Forwarding image to Facebook...', {
      recipientIdPreview: recipient_id.substring(0, 5) + '...',
      imageUrl: image_url
    });

    // إرسال الطلب إلى فيسبوك
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${access_token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipient_id },
          message: { 
            attachment: {
              type: 'image',
              payload: {
                url: image_url,
                is_reusable: true
              }
            }
          }
        }),
      }
    );

    // التعامل مع الرد من فيسبوك
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Facebook API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return res.status(response.status).json({
        error: 'Facebook API Error',
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ Image sent to Facebook successfully!');
    return res.json(data);
    
  } catch (error) {
    console.error('❌ Error in send-image endpoint:', error);
    return res.status(500).json({
      error: 'Failed to send image to Facebook',
      details: error.message
    });
  }
});

// الحصول على إعدادات صفحة فيسبوك
app.get('/api/facebook/page-settings/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    
    if (!pageId) {
      return res.status(400).json({
        error: 'Missing page ID',
        details: 'Page ID is required in the URL parameter'
      });
    }
    
    console.log('🔍 API Server: Getting Facebook page settings...', {
      pageId
    });
    
    // الحصول على إعدادات الصفحة من قاعدة البيانات
    const { data, error } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('page_id', pageId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ API Server: Error fetching page settings:', error);
      return res.status(500).json({
        error: 'Database error',
        details: error.message
      });
    }
    
    if (!data) {
      console.log('⚠️ API Server: No settings found for page:', pageId);
      return res.status(404).json({
        error: 'Page settings not found',
        details: `No settings found for page ID: ${pageId}`
      });
    }
    
    console.log('✅ API Server: Page settings retrieved successfully', {
      pageId,
      hasAccessToken: !!data.access_token
    });
    
    return res.json(data);
    
  } catch (error) {
    console.error('❌ Error in page-settings endpoint:', error);
    return res.status(500).json({
      error: 'Failed to get page settings',
      details: error.message
    });
  }
});

// Webhook verification endpoint (for Facebook)
app.get('/api/process-message', (req, res) => {
  const VERIFY_TOKEN = 'facebook_verify_token_123';

  console.log(' Webhook verification request:', {
    mode: req.query['hub.mode'],
    token: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge']
  });

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // إضافة headers مطلوبة
  res.set({
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache'
  });

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully!');
      console.log('📤 Sending challenge:', challenge);
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed!');
      console.log('Expected token:', VERIFY_TOKEN);
      console.log('Received token:', token);
      res.sendStatus(403);
    }
  } else {
    console.log('❌ Missing verification parameters');
    res.status(400).send('Bad Request: Missing verification parameters');
  }
});

console.log('🔧 Setting up /api/process-message endpoint...');

// Simple test endpoint first
app.post('/api/test-simple', (req, res) => {
  console.log('🧪 SIMPLE TEST ENDPOINT HIT!');
  res.json({ success: true, message: 'Simple test working!' });
});

// Process message endpoint
app.post('/api/process-message', async (req, res) => {
  console.log('🚀🚀🚀 POST /api/process-message endpoint hit! 🚀🚀🚀');
  console.log('📝 Headers:', JSON.stringify(req.headers));
  console.log('📝 Full Body:', JSON.stringify(req.body));

  // إضافة try-catch للـ imports
  let processIncomingMessage, validateMessageRequest;
  try {
    console.log('🔍 Testing imports...');
    const imported = await import('./process-message');
    processIncomingMessage = imported.processIncomingMessage;
    validateMessageRequest = imported.validateMessageRequest;
    console.log('✅ Imports successful');
    console.log('🔍 processIncomingMessage:', typeof processIncomingMessage);
    console.log('🔍 validateMessageRequest:', typeof validateMessageRequest);
  } catch (importError) {
    console.error('❌ Import error:', importError);
    return res.status(500).json({
      success: false,
      message: 'Import error: ' + importError.message
    });
  }

  try {
    console.log('📨 Received message processing request:', req.body);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);

    // إضافة headers للاستجابة
    res.set({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });

    // التحقق من نوع الطلب
    if (req.body.object === 'page') {
      // معالجة webhook من Facebook
      const results = [];

      for (const entry of req.body.entry) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message) {
              // التحقق من نوع الرسالة
              const isEcho = messagingEvent.message.is_echo || false;
              const isFromPage = isEcho; // الرسائل من الصفحة تكون echo
              const isFromCustomer = !isEcho; // الرسائل من العملاء مش echo

              // استخراج النص والمرفقات
              const messageText = messagingEvent.message.text || '';
              const attachments = messagingEvent.message.attachments || [];

              // التحقق من وجود صور
              let imageUrl = null;
              for (const attachment of attachments) {
                if (attachment.type === 'image') {
                  imageUrl = attachment.payload?.url;
                  console.log('📸 Image received:', imageUrl);
                  break;
                }
              }

              // إذا كان هناك نص أو صورة، معالج الرسالة
              if (messageText || imageUrl) {
                // تحديد نوع المرسل
                let senderId, senderType;
                if (isFromPage) {
                  // رسالة من الصفحة - استخدم recipient كـ customer
                  senderId = messagingEvent.recipient.id;
                  senderType = 'page';
                  console.log('📤 Message from page to customer:', senderId);
                } else {
                  // رسالة من العميل
                  senderId = messagingEvent.sender.id;
                  senderType = 'customer';
                  console.log('📥 Message from customer:', senderId);
                }

                // تحويل إلى format المطلوب
                const messageRequest = {
                  senderId: senderId,
                  messageText: messageText || '[صورة]',
                  messageId: messagingEvent.message.mid,
                  pageId: entry.id,
                  timestamp: messagingEvent.timestamp,
                  imageUrl: imageUrl,
                  senderType: senderType,
                  isEcho: isEcho
                };

                console.log('🔄 Processing Facebook message:', messageRequest);

                // معالجة الرسالة (بدون auto-reply للرسائل من الصفحة)
                const result = await processIncomingMessage(messageRequest);
                results.push(result);

                console.log('✅ Message processing result:', result);
              }
            }
          }
        }
      }

      res.status(200).json({ success: true, results });
    } else {
      // معالجة direct API call
      if (!validateMessageRequest(req.body)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request format'
        });
      }

      // معالجة الرسالة
      const result = await processIncomingMessage(req.body);

      console.log('✅ Message processing result:', result);

      res.json(result);
    }
  } catch (error) {
    console.error('❌ Error in message processing API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Facebook Webhook endpoints (compatible with Facebook's requirements)
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = 'facebook_webhook_verify_token_2024';

  console.log('🔍 Facebook Webhook verification request:', {
    mode: req.query['hub.mode'],
    token: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge']
  });

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Facebook Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Facebook Webhook verification failed!');
    res.status(403).send('Forbidden');
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;

  console.log('🔥🔥🔥 FACEBOOK WEBHOOK RECEIVED! 🔥🔥🔥');
  console.log('📨 Received Facebook webhook:', JSON.stringify(body, null, 2));
  console.log('🔥🔥🔥 END WEBHOOK DATA 🔥🔥🔥');

  try {
    // التأكد من أن الطلب من Facebook Page
    if (body.object === 'page') {
      // معالجة كل entry
      for (const entry of body.entry || []) {
        const pageId = entry.id;

        // 🔍 فحص حالة الصفحة أولاً - التحكم الذكي
        console.log(`🔍 Checking page status for: ${pageId}`);

        const { data: pageSettings, error: pageError } = await supabase
          .from('facebook_settings')
          .select('page_id, page_name, is_active, webhook_enabled')
          .eq('page_id', pageId)
          .single();

        if (pageError || !pageSettings) {
          console.log(`⚠️ Page ${pageId} not found in system - ignoring all messages`);
          continue; // تجاهل هذه الصفحة تمام سؤال
        }

        if (!pageSettings.is_active) {
          console.log(`🔴 Page ${pageSettings.page_name} (${pageId}) is INACTIVE - ignoring messages`);
          continue; // تجاهل الصفحة المعطلة
        }

        if (!pageSettings.webhook_enabled) {
          console.log(`🔴 Page ${pageSettings.page_name} (${pageId}) has WEBHOOK DISABLED - ignoring messages`);
          continue; // تجاهل الصفحة مع webhook معطل
        }

        console.log(`✅ Page ${pageSettings.page_name} (${pageId}) is ACTIVE and WEBHOOK ENABLED - processing messages`);

        // معالجة رسائل Messenger
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await handleMessagingEvent(messagingEvent, pageId);
          }
        }

        // معالجة تعليقات المنشورات
        if (entry.changes) {
          for (const change of entry.changes) {
            await handlePageChange(change, pageId);
          }
        }
      }

      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(404).send('Not Found');
    }

  } catch (error) {
    console.error('❌ Error processing Facebook webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// معالجة أحداث الرسائل من Facebook
async function handleMessagingEvent(messagingEvent: any, pageId: string) {
  const senderId = messagingEvent.sender?.id;
  const timestamp = messagingEvent.timestamp;

  console.log(`📱 Processing messaging event from ${senderId}`);

  // رسالة واردة من المستخدم
  if (messagingEvent.message && !messagingEvent.message.is_echo) {
    await handleUserMessage(messagingEvent, pageId);
  }

  // تأكيد التسليم
  if (messagingEvent.delivery) {
    console.log('✅ Message delivered:', messagingEvent.delivery.mids);
  }

  // تأكيد القراءة
  if (messagingEvent.read) {
    console.log('👁️ Message read:', messagingEvent.read.watermark);
  }

  // Postback (أزرار)
  if (messagingEvent.postback) {
    await handlePostback(messagingEvent, pageId);
  }
}

// معالجة رسالة المستخدم من Facebook
async function handleUserMessage(messagingEvent: any, pageId: string) {
  const senderId = messagingEvent.sender.id;
  const message = messagingEvent.message;
  const messageText = message.text;
  const messageId = message.mid;

  console.log(`💬 Facebook message from ${senderId}: "${messageText}"`);

  try {
    // معالجة الرسالة مباشرة (نفس المنطق الموجود في process-message)
    const messageRequest = {
      senderId,
      messageText,
      messageId,
      pageId,
      timestamp: messagingEvent.timestamp
    };

    console.log('🔄 Processing Facebook message:', messageRequest);

    // معالجة الرسالة (بدون auto-reply للرسائل من الصفحة)
    const result = await processIncomingMessage(messageRequest);

    console.log('✅ Facebook message processing result:', result);

  } catch (error) {
    console.error('❌ Error processing Facebook user message:', error);
  }
}

// معالجة Postback من Facebook
async function handlePostback(messagingEvent: any, pageId: string) {
  const senderId = messagingEvent.sender.id;
  const postback = messagingEvent.postback;
  const payload = postback.payload;

  console.log(`🔘 Facebook Postback from ${senderId}: ${payload}`);

  // يمكن إضافة منطق معالجة الأزرار هنا
}

// معالجة تغييرات الصفحة من Facebook
async function handlePageChange(change: any, pageId: string) {
  const field = change.field;
  const value = change.value;

  console.log(`📄 Facebook Page change: ${field}`, value);

  // معالجة التعليقات
  if (field === 'feed' && value.item === 'comment') {
    console.log(`💭 New Facebook comment: ${value.message}`);
    // يمكن إضافة رد آلي على التعليقات
  }
}

app.get('/api/force-update-names', async (req, res) => {
  try {
    console.log('🚀 بدء التحديث القسري للأسماء من واجهة API');

    // تشغيل عملية تحديث جميع أسماء المستخدمين عند بدء الخادم
    const results = await forceUpdateAllUserNames();

    res.json({
      success: true,
      message: 'تم بدء عملية تحديث الأسماء بنجاح',
      results
    });
  } catch (error) {
    console.error('❌ خطأ في تنفيذ التحديث القسري للأسماء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الأسماء',
      error: error.message
    });
  }
});

// مسار API لتحديث الأسماء المفقودة فقط
app.post('/api/force-update-names', async (req, res) => {
  try {
    const { onlyMissingNames = true } = req.body;
    console.log(`🔄 تم استلام طلب لتحديث أسماء المستخدمين. تحديث الأسماء المفقودة فقط: ${onlyMissingNames}`);

    // تشغيل عملية التحديث مع خيار تحديث الأسماء المفقودة فقط
    const results = await forceUpdateAllUserNames(onlyMissingNames);

    res.status(200).json({
      success: true,
      message: `تم إكمال عملية تحديث الأسماء بنجاح. تم تحديث ${results.totalUpdated} محادثة من أصل ${results.totalProcessed}`,
      results
    });
  } catch (error) {
    console.error('❌ خطأ في معالجة طلب تحديث الأسماء:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء تحديث الأسماء'
    });
  }
});

// Test page endpoint
app.get('/test', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧪 اختبار API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .conversation { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; background: #f9f9f9; }
        .loading { text-align: center; color: #666; font-size: 18px; }
        .error { color: red; background: #ffe6e6; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .success { color: green; background: #e6ffe6; padding: 10px; border-radius: 5px; margin: 10px 0; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 اختبار API - من السيرفر مباشرة</h1>
        <div>
            <button onclick="testAPI()">🔄 اختبار API</button>
            <button onclick="testWithLimit()">📊 اختبار مع Limit</button>
            <button onclick="clearResults()">🗑️ مسح النتائج</button>
        </div>
        <div id="status" class="loading">جاهز للاختبار...</div>
        <div id="results"></div>
    </div>

    <script>
        const statusDiv = document.getElementById('status');
        const resultsDiv = document.getElementById('results');

        function updateStatus(message, type = 'loading') {
            statusDiv.className = type;
            statusDiv.innerHTML = message;
        }

        function addResult(content) {
            const div = document.createElement('div');
            div.innerHTML = content;
            resultsDiv.appendChild(div);
        }

        function clearResults() {
            resultsDiv.innerHTML = '';
            updateStatus('تم مسح النتائج', 'success');
        }

        async function testAPI() {
            updateStatus('🔄 جاري اختبار API...', 'loading');
            clearResults();

            try {
                const startTime = Date.now();
                const response = await fetch('/api/conversations');
                const endTime = Date.now();
                const duration = endTime - startTime;

                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }

                const data = await response.json();
                updateStatus(\`✅ نجح الاختبار! (\${duration}ms)\`, 'success');

                addResult(\`
                    <div class="success">
                        <h3>✅ نتائج الاختبار:</h3>
                        <p><strong>📊 عدد المحادثات:</strong> \${data.length}</p>
                        <p><strong>⏱️ وقت الاستجابة:</strong> \${duration}ms</p>
                        <p><strong>📡 حالة HTTP:</strong> \${response.status} \${response.statusText}</p>
                    </div>
                \`);

                if (data.length > 0) {
                    addResult(\`
                        <div class="conversation">
                            <h4>📝 أول محادثة:</h4>
                            <p><strong>👤 العميل:</strong> \${data[0].customer_name}</p>
                            <p><strong>💬 آخر رسالة:</strong> \${data[0].last_message || 'لا توجد'}</p>
                            <p><strong>📅 التاريخ:</strong> \${new Date(data[0].last_message_at).toLocaleString('ar-EG')}</p>
                        </div>
                    \`);
                }
            } catch (error) {
                updateStatus(\`❌ فشل الاختبار: \${error.message}\`, 'error');
            }
        }

        async function testWithLimit() {
            updateStatus('🔄 جاري اختبار API مع Limit...', 'loading');
            clearResults();

            try {
                const startTime = Date.now();
                const response = await fetch('/api/conversations?limit=5');
                const endTime = Date.now();
                const duration = endTime - startTime;

                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }

                const data = await response.json();
                updateStatus(\`✅ نجح الاختبار مع Limit! (\${duration}ms)\`, 'success');

                addResult(\`
                    <div class="success">
                        <h3>✅ نتائج الاختبار مع Limit:</h3>
                        <p><strong>📊 عدد المحادثات:</strong> \${data.length} (المطلوب: 5)</p>
                        <p><strong>⏱️ وقت الاستجابة:</strong> \${duration}ms</p>
                        <p><strong>✅ Limit يعمل:</strong> \${data.length <= 5 ? 'نعم' : 'لا'}</p>
                    </div>
                \`);
            } catch (error) {
                updateStatus(\`❌ فشل الاختبار: \${error.message}\`, 'error');
            }
        }

        window.addEventListener('load', () => {
            updateStatus('🎯 الصفحة جاهزة للاختبار', 'success');
        });
    </script>
</body>
</html>
  `);
});

// 📊 API للحصول على المحادثات (للتشخيص)
app.get('/api/conversations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, customer_name, customer_facebook_id, last_message, last_message_at')
      .order('last_message_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// 📨 API للحصول على الرسائل الأخيرة (للتشخيص)
app.get('/api/messages/recent', async (req, res) => {
  try {
    // أولاً جلب الرسائل
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, conversation_id, content, sender_type, created_at, facebook_message_id')
      .order('created_at', { ascending: false })
      .limit(50);

    if (messagesError) throw messagesError;

    // ثم جلب أسماء العملاء
    const conversationIds = [...new Set(messages?.map(m => m.conversation_id) || [])];
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, customer_name')
      .in('id', conversationIds);

    if (conversationsError) throw conversationsError;

    // دمج البيانات
    const conversationMap = new Map(conversations?.map(c => [c.id, c.customer_name]) || []);
    const enrichedMessages = messages?.map(msg => ({
      ...msg,
      customer_name: conversationMap.get(msg.conversation_id) || 'غير معروف'
    })) || [];

    res.json(enrichedMessages);
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// 📤 API لإرسال رسالة اختبار (للتشخيص)
app.post('/api/send-message', async (req, res) => {
  try {
    const { conversation_id, content, sender_type = 'admin' } = req.body;

    if (!conversation_id || !content) {
      return res.status(400).json({ error: 'conversation_id and content are required' });
    }

    console.log(`📤 [DEBUG] Sending test message: "${content}" to conversation: ${conversation_id}`);

    // حفظ الرسالة في قاعدة البيانات
    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        content,
        sender_type,
        is_read: false,
        is_auto_reply: false,
        is_ai_generated: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ [DEBUG] Error saving message:', saveError);
      throw saveError;
    }

    console.log(`✅ [DEBUG] Message saved with ID: ${savedMessage.id}`);

    // جلب معلومات المحادثة للإرسال عبر Facebook
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('customer_facebook_id, facebook_page_id')
      .eq('id', conversation_id)
      .single();

    if (convError) {
      console.error('❌ [DEBUG] Error fetching conversation:', convError);
      throw convError;
    }

    // جلب إعدادات Facebook
    const { data: fbSettings, error: fbError } = await supabase
      .from('facebook_settings')
      .select('access_token')
      .eq('page_id', conversation.facebook_page_id)
      .single();

    if (fbError || !fbSettings) {
      console.log('⚠️ [DEBUG] No Facebook settings found, message saved to DB only');
      return res.json({
        success: true,
        message: 'Message saved to database (no Facebook sending)',
        messageId: savedMessage.id
      });
    }

    // إرسال عبر Facebook API
    try {
      const facebookResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/messages?access_token=${fbSettings.access_token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: conversation.customer_facebook_id },
            message: { text: content }
          })
        }
      );

      const facebookResult = await facebookResponse.json();

      if (facebookResponse.ok && !facebookResult.error) {
        console.log(`✅ [DEBUG] Message sent via Facebook: ${facebookResult.message_id}`);

        // تحديث الرسالة بمعرف Facebook
        await supabase
          .from('messages')
          .update({ facebook_message_id: facebookResult.message_id })
          .eq('id', savedMessage.id);

        res.json({
          success: true,
          message: 'Message sent successfully',
          messageId: savedMessage.id,
          facebookMessageId: facebookResult.message_id
        });
      } else {
        console.error('❌ [DEBUG] Facebook API error:', facebookResult);
        res.json({
          success: true,
          message: 'Message saved to database but Facebook sending failed',
          messageId: savedMessage.id,
          facebookError: facebookResult.error
        });
      }
    } catch (facebookError) {
      console.error('❌ [DEBUG] Facebook request failed:', facebookError);
      res.json({
        success: true,
        message: 'Message saved to database but Facebook request failed',
        messageId: savedMessage.id,
        error: facebookError.message
      });
    }

  } catch (error) {
    console.error('❌ [DEBUG] Error in send-message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Add in-memory logs storage for debugging UI
const logs: { timestamp: string, message: string }[] = [];
const MAX_LOGS = 1000; // Limit to prevent memory issues

const originalConsoleLog = console.log;
console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    logs.push({ timestamp: new Date().toISOString(), message });
    if (logs.length > MAX_LOGS) {
        logs.shift(); // Remove oldest log to maintain size limit
    }
};

// Add endpoint for logs retrieval
app.get('/api/logs', (req, res) => {
    res.json(logs);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Message Processing API started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`🔗 Process message endpoint: http://localhost:${PORT}/api/process-message`);
  console.log(`🔗 Debug conversations endpoint: http://localhost:${PORT}/api/conversations`);
  console.log(`🔗 Debug messages endpoint: http://localhost:${PORT}/api/messages/recent`);
  console.log(`🔗 Debug send message endpoint: http://localhost:${PORT}/api/send-message`);

  // بدء تشغيل الخدمات الاضافية
  try {
    console.log('🚀 بدء خدمة تحديث أسماء المستخدمين من فيسبوك...');
    NameUpdateService.startAutoUpdate();
  } catch (error) {
    console.error('❌ خطأ في بدء خدمة تحديث الأسماء:', error);
  }
});

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;
