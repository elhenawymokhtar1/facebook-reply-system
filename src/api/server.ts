// Simple API server for handling webhook messages
import dotenv from 'dotenv';

// إعداد الترميز للنصوص العربية
process.env.LANG = 'en_US.UTF-8';
process.env.LC_ALL = 'en_US.UTF-8';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { NameUpdateService } from '../services/nameUpdateService';
import { processIncomingMessage } from './process-message';
import geminiRouter from './gemini-routes';
import whatsappBaileysRoutes from './whatsapp-baileys-routes';
import subscriptionRouter from './subscription-routes';
import { forceUpdateAllUserNames } from '../services/forceUpdateNames';
import { SuperAdminService } from '../services/superAdminService';
import { requestLogger, errorHandler, notFoundHandler } from './middleware/auth';

// تحميل متغيرات البيئة
dotenv.config();

console.log('🔥🔥🔥 [SERVER] STARTING WITH UPDATED CODE VERSION 2.0! 🔥🔥🔥');

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
// إعدادات الترميز للنصوص العربية
app.use(express.json({
  limit: '10mb',
  type: 'application/json',
  verify: (req, res, buf) => {
    // التأكد من الترميز الصحيح للنصوص العربية
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 1000,
  type: 'application/x-www-form-urlencoded'
}));

// إضافة مسار للملفات الثابتة
app.use(express.static('public'));

// إعداد ترميز UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// إضافة middleware للتسجيل
app.use(requestLogger);

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

console.log('🤖 Setting up Gemini AI routes...');
// استخدام مسارات Gemini المنفصلة
app.use('/api/gemini', geminiRouter);

console.log('📱 Setting up WhatsApp Baileys routes...');
// استخدام مسارات WhatsApp Baileys الحقيقية
try {
  app.use('/api/whatsapp-baileys', whatsappBaileysRoutes);
  console.log('✅ WhatsApp Baileys routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading WhatsApp Baileys routes:', error);

  // مسارات احتياطية في حالة فشل التحميل
  app.get('/api/whatsapp-baileys/test', (req, res) => {
    console.log('🧪 WhatsApp Baileys test endpoint hit! (fallback)');
    res.json({ success: true, message: 'WhatsApp Baileys API is working! (fallback)' });
  });
}

console.log('🏢 Setting up Subscription routes...');
// استخدام مسارات نظام الاشتراكات
try {
  app.use('/api/subscriptions', subscriptionRouter);
  console.log('✅ Subscription routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading Subscription routes:', error);

  // مسار احتياطي في حالة فشل التحميل
  app.get('/api/subscriptions/test', (req, res) => {
    console.log('🧪 Subscription test endpoint hit! (fallback)');
    res.json({ success: true, message: 'Subscription API is working! (fallback)' });
  });
}

// إضافة مسارات WhatsApp AI Settings مباشرة كـ fallback
console.log('🤖 Setting up WhatsApp AI Settings fallback routes...');

app.get('/api/whatsapp-baileys/ai-settings', async (req, res) => {
  try {
    console.log('🤖 [API] جلب إعدادات WhatsApp AI (fallback)...');

    const { data: settings, error } = await supabase
      .from('whatsapp_ai_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [API] خطأ في قاعدة البيانات:', error);
      throw error;
    }

    if (!settings) {
      console.log('📝 [API] لا توجد إعدادات، إرجاع الإعدادات الافتراضية...');
      const defaultSettings = {
        is_enabled: false,
        use_existing_prompt: true,
        custom_prompt: 'أنت مساعد ذكي لمتجر WhatsApp. اسمك سارة وأنت بائعة لطيفة ومتفهمة.',
        api_key: '',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        max_tokens: 1000,
        can_access_orders: true,
        can_access_products: true,
        auto_reply_enabled: true
      };

      return res.json({
        success: true,
        settings: defaultSettings
      });
    }

    console.log('✅ [API] تم جلب إعدادات WhatsApp AI بنجاح');
    res.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب إعدادات WhatsApp AI:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإعدادات: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

app.post('/api/whatsapp-baileys/ai-settings', async (req, res) => {
  try {
    console.log('💾 [API] حفظ إعدادات WhatsApp AI (fallback)...');
    console.log('📝 [API] البيانات المرسلة:', req.body);

    const settings = req.body;

    // التحقق من وجود سجل موجود
    const { data: existingSettings, error: selectError } = await supabase
      .from('whatsapp_ai_settings')
      .select('id')
      .limit(1)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    let result;
    if (existingSettings) {
      // تحديث السجل الموجود
      console.log('🔄 [API] تحديث السجل الموجود...');
      result = await supabase
        .from('whatsapp_ai_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id);
    } else {
      // إنشاء سجل جديد
      console.log('➕ [API] إنشاء سجل جديد...');
      result = await supabase
        .from('whatsapp_ai_settings')
        .insert(settings);
    }

    if (result.error) {
      throw result.error;
    }

    console.log('✅ [API] تم حفظ إعدادات WhatsApp AI بنجاح');

    res.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في حفظ إعدادات WhatsApp AI:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في حفظ الإعدادات: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

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

    // استدعاء المعالج الصحيح
    const { SimpleGeminiService } = await import('../services/simpleGeminiService');
    const conversationId = `temp_${senderId}_${Date.now()}`;

    console.log('🚀 Calling SimpleGeminiService processor...');
    const success = await SimpleGeminiService.processMessage(
      messageText,
      conversationId,
      senderId,
      pageId
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

// Dashboard stats endpoint - moved here for testing
app.get('/api/dashboard-stats', (req, res) => {
  console.log('📊 Dashboard stats requested - working version');
  res.json({
    totalMessages: 1234,
    autoReplies: 856,
    activeConversations: 42,
    responseRate: "98%",
    lastUpdated: new Date().toISOString()
  });
});

// فحص العلاقة بين الشركات والمتاجر والمنتجات
app.get('/api/check-company-stores', async (req, res) => {
  try {
    console.log('🔍 فحص العلاقة بين الشركات والمتاجر والمنتجات...');

    // جلب جميع الشركات مع متاجرها
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        email,
        stores (
          id,
          name,
          is_active,
          ecommerce_products (
            id,
            name,
            price,
            status
          )
        )
      `)
      .order('name');

    if (companiesError) {
      console.error('❌ خطأ في جلب البيانات:', companiesError);
      return res.status(500).json({ error: companiesError.message });
    }

    const result = companies.map(company => ({
      company_name: company.name,
      company_id: company.id,
      stores_count: company.stores?.length || 0,
      total_products: company.stores?.reduce((total, store) =>
        total + (store.ecommerce_products?.length || 0), 0) || 0,
      stores: company.stores?.map(store => ({
        store_name: store.name,
        store_id: store.id,
        is_active: store.is_active,
        products_count: store.ecommerce_products?.length || 0,
        products: store.ecommerce_products?.map(product => ({
          name: product.name,
          price: product.price,
          status: product.status
        })) || []
      })) || []
    }));

    res.json({
      success: true,
      data: result,
      summary: {
        total_companies: companies.length,
        companies_with_stores: companies.filter(c => c.stores?.length > 0).length,
        total_stores: companies.reduce((total, c) => total + (c.stores?.length || 0), 0),
        total_products: companies.reduce((total, c) =>
          total + (c.stores?.reduce((storeTotal, store) =>
            storeTotal + (store.ecommerce_products?.length || 0), 0) || 0), 0)
      }
    });
  } catch (error) {
    console.error('❌ خطأ في فحص البيانات:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// إصلاح عزل المنتجات بين الشركات
app.post('/api/fix-company-isolation', async (req, res) => {
  try {
    console.log('🔧 بدء إصلاح عزل المنتجات بين الشركات...');

    // 1. جلب جميع الشركات
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, email')
      .order('name');

    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError);
      return res.status(500).json({ error: companiesError.message });
    }

    // 2. جلب المنتجات الموجودة (من أول متجر كنموذج)
    const { data: existingProducts, error: productsError } = await supabase
      .from('ecommerce_products')
      .select('*')
      .limit(5); // نأخذ 5 منتجات فقط كنموذج

    if (productsError) {
      console.error('❌ خطأ في جلب المنتجات:', productsError);
      return res.status(500).json({ error: productsError.message });
    }

    const results = [];

    // 3. معالجة كل شركة
    for (const company of companies) {
      console.log(`🏢 معالجة الشركة: ${company.name}`);

      // التحقق من وجود متاجر للشركة
      const { data: existingStores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('company_id', company.id);

      if (storesError) {
        console.error(`❌ خطأ في جلب متاجر الشركة: ${storesError.message}`);
        continue;
      }

      let storeId;
      let storeCreated = false;

      if (existingStores.length === 0) {
        // إنشاء متجر جديد للشركة
        const storeName = `متجر ${company.name}`;
        const storeSlug = `store-${company.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;

        const { data: newStore, error: createStoreError } = await supabase
          .from('stores')
          .insert({
            company_id: company.id,
            name: storeName,
            slug: storeSlug,
            description: `متجر إلكتروني لشركة ${company.name}`,
            owner_email: company.email,
            currency: 'EGP',
            is_active: true,
            settings: {}
          })
          .select()
          .single();

        if (createStoreError) {
          console.error(`❌ خطأ في إنشاء المتجر: ${createStoreError.message}`);
          continue;
        }

        storeId = newStore.id;
        storeCreated = true;
        console.log(`✅ تم إنشاء المتجر: ${storeName}`);
      } else {
        storeId = existingStores[0].id;
        console.log(`✅ المتجر موجود: ${existingStores[0].name}`);
      }

      // إنشاء منتجات للمتجر إذا لم تكن موجودة
      const { data: storeProducts } = await supabase
        .from('ecommerce_products')
        .select('id')
        .eq('store_id', storeId);

      let productsCreated = 0;

      if (!storeProducts || storeProducts.length === 0) {
        // إنشاء نسخ من المنتجات النموذجية
        for (const product of existingProducts) {
          const newProductData = {
            store_id: storeId,
            name: product.name,
            slug: `${product.slug}-${company.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
            description: product.description,
            short_description: product.short_description,
            sku: `${product.sku}-${company.name.substring(0, 3).toUpperCase()}-${Date.now()}`,
            price: product.price,
            sale_price: product.sale_price,
            stock_quantity: product.stock_quantity,
            status: product.status,
            featured: product.featured,
            image_url: product.image_url,
            category: product.category,
            brand: product.brand
          };

          const { error: createProductError } = await supabase
            .from('ecommerce_products')
            .insert(newProductData);

          if (!createProductError) {
            productsCreated++;
          }
        }
      }

      results.push({
        company_name: company.name,
        company_id: company.id,
        store_created: storeCreated,
        store_id: storeId,
        products_created: productsCreated,
        existing_products: storeProducts?.length || 0
      });
    }

    res.json({
      success: true,
      message: 'تم إصلاح عزل المنتجات بنجاح',
      results: results,
      summary: {
        companies_processed: companies.length,
        stores_created: results.filter(r => r.store_created).length,
        total_products_created: results.reduce((sum, r) => sum + r.products_created, 0)
      }
    });

  } catch (error) {
    console.error('❌ خطأ في إصلاح عزل المنتجات:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// اختبار نظام تسجيل الشركات
app.get('/api/test-company-registration', async (req, res) => {
  try {
    console.log('🧪 اختبار نظام تسجيل الشركات...');

    // 1. فحص جدول الشركات
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, email, status, is_verified, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError);
      return res.status(500).json({ error: companiesError.message });
    }

    // 2. فحص جدول خطط الاشتراك
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, price, features')
      .eq('is_active', true);

    if (plansError) {
      console.error('❌ خطأ في جلب خطط الاشتراك:', plansError);
      return res.status(500).json({ error: plansError.message });
    }

    // 3. فحص الاشتراكات النشطة
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('company_subscriptions')
      .select(`
        id,
        company_id,
        status,
        start_date,
        end_date,
        companies (name, email)
      `)
      .eq('status', 'active');

    if (subscriptionsError) {
      console.error('❌ خطأ في جلب الاشتراكات:', subscriptionsError);
      return res.status(500).json({ error: subscriptionsError.message });
    }

    // 4. إحصائيات
    const stats = {
      total_companies: companies.length,
      verified_companies: companies.filter(c => c.is_verified).length,
      active_companies: companies.filter(c => c.status === 'active').length,
      total_plans: plans.length,
      active_subscriptions: subscriptions.length
    };

    res.json({
      success: true,
      message: 'نظام تسجيل الشركات يعمل بشكل صحيح',
      data: {
        companies: companies.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          status: c.status,
          is_verified: c.is_verified,
          created_at: c.created_at
        })),
        plans: plans.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          features: p.features
        })),
        subscriptions: subscriptions.map(s => ({
          id: s.id,
          company_name: s.companies?.name,
          company_email: s.companies?.email,
          status: s.status,
          start_date: s.start_date,
          end_date: s.end_date
        })),
        stats
      }
    });

  } catch (error) {
    console.error('❌ خطأ في اختبار نظام التسجيل:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// فحص بيانات تسجيل الدخول للشركات
app.get('/api/check-company-credentials', async (req, res) => {
  try {
    console.log('🔍 فحص بيانات تسجيل الدخول للشركات...');

    // جلب جميع الشركات مع بيانات تسجيل الدخول
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        email,
        password_hash,
        status,
        is_verified,
        created_at,
        last_login_at
      `)
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError);
      return res.status(500).json({ error: companiesError.message });
    }

    // تحليل البيانات
    const analysis = companies.map(company => ({
      id: company.id,
      name: company.name,
      email: company.email,
      has_password: !!company.password_hash,
      password_length: company.password_hash ? company.password_hash.length : 0,
      status: company.status,
      is_verified: company.is_verified,
      created_at: company.created_at,
      last_login_at: company.last_login_at,
      can_login: !!company.password_hash && company.status === 'active'
    }));

    // إحصائيات
    const stats = {
      total_companies: companies.length,
      companies_with_passwords: companies.filter(c => c.password_hash).length,
      companies_without_passwords: companies.filter(c => !c.password_hash).length,
      active_companies: companies.filter(c => c.status === 'active').length,
      verified_companies: companies.filter(c => c.is_verified).length,
      companies_that_logged_in: companies.filter(c => c.last_login_at).length
    };

    res.json({
      success: true,
      message: 'تم فحص بيانات تسجيل الدخول',
      data: {
        companies: analysis,
        stats,
        issues: {
          companies_without_passwords: analysis.filter(c => !c.has_password),
          inactive_companies: analysis.filter(c => c.status !== 'active'),
          unverified_companies: analysis.filter(c => !c.is_verified)
        }
      }
    });

  } catch (error) {
    console.error('❌ خطأ في فحص بيانات تسجيل الدخول:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// إضافة كلمات مرور للشركات التي لا تملك بيانات تسجيل دخول
app.post('/api/fix-company-passwords', async (req, res) => {
  try {
    console.log('🔧 إضافة كلمات مرور للشركات...');

    // جلب الشركات التي لا تملك كلمات مرور
    const { data: companiesWithoutPasswords, error: fetchError } = await supabase
      .from('companies')
      .select('id, name, email')
      .is('password_hash', null);

    if (fetchError) {
      console.error('❌ خطأ في جلب الشركات:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!companiesWithoutPasswords || companiesWithoutPasswords.length === 0) {
      return res.json({
        success: true,
        message: 'جميع الشركات لديها كلمات مرور',
        data: { companies_updated: 0 }
      });
    }

    const bcrypt = require('bcrypt');
    const results = [];

    // إضافة كلمة مرور افتراضية لكل شركة
    for (const company of companiesWithoutPasswords) {
      const defaultPassword = '123456'; // كلمة مرور افتراضية
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          password_hash: passwordHash,
          status: 'active',
          is_verified: true
        })
        .eq('id', company.id);

      if (updateError) {
        console.error(`❌ خطأ في تحديث الشركة ${company.name}:`, updateError);
        results.push({
          company_id: company.id,
          company_name: company.name,
          success: false,
          error: updateError.message
        });
      } else {
        console.log(`✅ تم تحديث كلمة المرور للشركة: ${company.name}`);
        results.push({
          company_id: company.id,
          company_name: company.name,
          email: company.email,
          success: true,
          default_password: defaultPassword
        });
      }
    }

    res.json({
      success: true,
      message: `تم تحديث كلمات المرور لـ ${results.filter(r => r.success).length} شركة`,
      data: {
        companies_updated: results.filter(r => r.success).length,
        companies_failed: results.filter(r => !r.success).length,
        results: results,
        note: 'كلمة المرور الافتراضية: 123456'
      }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة كلمات المرور:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// فحص شامل لجميع البيانات في قاعدة البيانات
app.get('/api/database-overview', async (req, res) => {
  try {
    console.log('🔍 فحص شامل لقاعدة البيانات...');

    const overview: any = {};

    // 1. فحص جدول الشركات
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (!companiesError) {
      overview.companies = {
        count: companies.length,
        data: companies.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          status: c.status,
          is_verified: c.is_verified,
          has_password: !!c.password_hash,
          created_at: c.created_at,
          last_login_at: c.last_login_at
        }))
      };
    }

    // 2. فحص جدول المتاجر
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (!storesError) {
      overview.stores = {
        count: stores.length,
        data: stores.map(s => ({
          id: s.id,
          name: s.name,
          company_id: s.company_id,
          is_active: s.is_active,
          created_at: s.created_at
        }))
      };
    }

    // 3. فحص جدول المنتجات
    const { data: products, error: productsError } = await supabase
      .from('ecommerce_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!productsError) {
      overview.ecommerce_products = {
        count: products.length,
        data: products.map(p => ({
          id: p.id,
          name: p.name,
          store_id: p.store_id,
          price: p.price,
          status: p.status,
          created_at: p.created_at
        }))
      };
    }

    // 4. فحص جدول صفحات فيسبوك
    const { data: fbSettings, error: fbError } = await supabase
      .from('facebook_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!fbError) {
      overview.facebook_settings = {
        count: fbSettings.length,
        data: fbSettings.map(f => ({
          id: f.id,
          page_id: f.page_id,
          page_name: f.page_name,
          company_id: f.company_id,
          is_active: f.is_active,
          created_at: f.created_at
        }))
      };
    }

    // 5. فحص جدول المحادثات
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!convError) {
      overview.conversations = {
        count: conversations.length,
        data: conversations.map(c => ({
          id: c.id,
          customer_name: c.customer_name,
          page_id: c.page_id,
          company_id: c.company_id,
          last_message_at: c.last_message_at,
          created_at: c.created_at
        }))
      };
    }

    // 6. فحص جدول الرسائل
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!msgError) {
      overview.messages = {
        count: messages.length,
        data: messages.map(m => ({
          id: m.id,
          conversation_id: m.conversation_id,
          content: m.content?.substring(0, 100) + '...',
          sender_type: m.sender_type,
          created_at: m.created_at
        }))
      };
    }

    // 7. فحص جدول الاشتراكات
    const { data: subscriptions, error: subError } = await supabase
      .from('company_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!subError) {
      overview.company_subscriptions = {
        count: subscriptions.length,
        data: subscriptions
      };
    }

    // 8. فحص جداول إضافية
    const additionalTables = [
      'subscription_plans',
      'company_users',
      'user_sessions',
      'system_settings',
      'api_keys',
      'webhooks',
      'notifications',
      'audit_logs'
    ];

    for (const tableName of additionalTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(10);

        if (!error && data) {
          overview[tableName] = {
            count: data.length,
            data: data
          };
        }
      } catch (err) {
        // الجدول غير موجود، تجاهل
      }
    }

    // 9. إحصائيات عامة
    overview.summary = {
      total_companies: overview.companies?.count || 0,
      total_stores: overview.stores?.count || 0,
      total_products: overview.ecommerce_products?.count || 0,
      total_facebook_pages: overview.facebook_settings?.count || 0,
      total_conversations: overview.conversations?.count || 0,
      total_messages: overview.messages?.count || 0,
      total_subscriptions: overview.company_subscriptions?.count || 0,
      total_subscription_plans: overview.subscription_plans?.count || 0,
      total_company_users: overview.company_users?.count || 0
    };

    res.json({
      success: true,
      message: 'تم فحص قاعدة البيانات بنجاح',
      data: overview
    });

  } catch (error) {
    console.error('❌ خطأ في فحص قاعدة البيانات:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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



// API للمنتجات - معطل مؤقتاً (لا توجد منتجات محددة)
app.get('/api/products-grouped', async (req, res) => {
  try {
    console.log('🔍 Products API called - returning empty result (no specific products)');

    // إرجاع قائمة فارغة - لا توجد منتجات محددة
    res.json([]);
    return;

    // الكود القديم معطل
    const groupedProducts: { [key: string]: any } = {};

    products?.forEach(item => {
      const productName = item.product_name;

      if (!groupedProducts[productName]) {
        groupedProducts[productName] = {
          product_id: item.product_id,
          product_name: productName,
          product_description: item.product_description,
          product_category: item.product_category,
          product_base_price: item.product_base_price,
          product_brand: item.product_brand,
          product_created_at: item.product_created_at,
          variants: []
        };
      }

      // إضافة المتغير (اللون) للمنتج
      groupedProducts[productName].variants.push({
        variant_id: item.variant_id,
        color: item.variant_color,
        size: item.variant_size,
        price: item.variant_price,
        stock_quantity: item.variant_stock_quantity,
        image_url: item.variant_image_url,
        is_available: item.variant_is_available,
        created_at: item.variant_created_at
      });
    });

    // تحويل إلى مصفوفة وترتيب المتغيرات
    const result = Object.values(groupedProducts).map(product => ({
      ...product,
      variants: product.variants.sort((a, b) => a.color.localeCompare(b.color, 'ar'))
    }));

    console.log(`✅ Successfully grouped ${result.length} products with ${products?.length || 0} total variants`);
    res.json(result);

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





// Facebook settings endpoints
// اختبار بسيط
app.get('/api/test-company', async (req, res) => {
  const { company_id } = req.query;
  console.log('🧪 Test endpoint called with company_id:', company_id);

  const { data, error } = await supabase
    .from('facebook_settings')
    .select('page_name, page_id, company_id')
    .eq('company_id', company_id || '21e34b5d-2750-412c-9a1d-b539addf8cb8');

  console.log('🧪 Test result:', { data, error });
  res.json({ company_id, data, error });
});

app.get('/api/facebook/settings', async (req, res) => {
  try {
    console.log('🔍 API Server: Getting Facebook settings...');
    console.log('🔍 Query params:', req.query);

    const { company_id } = req.query;

    let query = supabase
      .from('facebook_settings')
      .select('*')
      .order('created_at', { ascending: false });

    // فلترة حسب company_id إذا تم تمريره
    if (company_id) {
      console.log(`🏢 API Server: Filtering by company_id: ${company_id}`);
      query = query.eq('company_id', company_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ API Server: Error fetching Facebook settings:', error);
      throw error;
    }

    console.log(`✅ API Server: Found ${data?.length || 0} Facebook settings${company_id ? ` for company ${company_id}` : ''}`);

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
    const { pageId, pageName, accessToken, webhookUrl, companyId } = req.body;

    console.log(`➕ Adding new Facebook page: ${pageName} (${pageId})${companyId ? ` for company: ${companyId}` : ''}`);

    // التحقق من البيانات المطلوبة
    if (!pageId || !pageName || !accessToken) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['pageId', 'pageName', 'accessToken']
      });
    }

    // تحذير إذا لم يتم تمرير company_id
    if (!companyId) {
      console.log('⚠️ تحذير: لم يتم تمرير company_id - الصفحة لن تُربط بشركة محددة');
      console.log('💡 هذا قد يسبب مشاكل في عرض الصفحات للشركات الجديدة');
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

    // إضافة الصفحة الجديدة مع company_id
    const insertData: any = {
      page_id: pageId,
      page_name: pageName,
      access_token: accessToken,
      webhook_url: webhookUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // إضافة company_id إذا تم تمريره
    if (companyId) {
      insertData.company_id = companyId;
      console.log(`🏢 ربط الصفحة بالشركة: ${companyId}`);
    } else {
      console.log('⚠️ لم يتم تمرير company_id - الصفحة لن تُربط بشركة محددة');
    }

    console.log('💾 إضافة صفحة Facebook جديدة:', { pageId, pageName, hasToken: !!accessToken });

    const { data, error } = await supabase
      .from('facebook_settings')
      .insert(insertData)
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

// Get Facebook conversations endpoint with company filtering
app.get('/api/facebook/conversations', async (req, res) => {
  try {
    console.log('🔍 Facebook conversations endpoint called');
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    console.log(`🔍 API Server: Getting Facebook conversations for company: ${company_id}`);

    // جلب المحادثات مع فلترة الشركة
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('company_id', company_id)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching conversations:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    // جلب معلومات الصفحات
    const { data: pages, error: pagesError } = await supabase
      .from('facebook_settings')
      .select('page_id, page_name');

    if (pagesError) {
      console.error('❌ Error fetching pages:', pagesError);
    }

    // إنشاء خريطة للصفحات
    const pageMap = {};
    if (pages) {
      pages.forEach(page => {
        pageMap[page.page_id] = page.page_name;
      });
    }

    // تنسيق البيانات
    const formattedConversations = conversations?.map(conv => ({
      id: conv.id,
      facebook_page_id: conv.facebook_page_id,
      customer_name: conv.customer_name,
      customer_facebook_id: conv.customer_facebook_id,
      last_message: conv.last_message,
      last_message_at: conv.last_message_at,
      is_online: conv.is_online,
      unread_count: conv.unread_count || 0,
      conversation_status: conv.conversation_status,
      page_id: conv.page_id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      page_name: pageMap[conv.facebook_page_id] || 'صفحة غير معروفة'
    })) || [];

    console.log(`✅ API Server: Found ${formattedConversations.length} conversations for company ${company_id}`);

    res.json(formattedConversations);
  } catch (error) {
    console.error('❌ Error in conversations endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Conversations endpoint (DEPRECATED - استخدم /api/facebook/conversations بدلاً منه)
app.get('/api/conversations', async (req, res) => {
  try {
    console.log('⚠️ [API] DEPRECATED: Conversations endpoint called - يجب استخدام /api/facebook/conversations');
    console.log('📋 [API] Conversations endpoint called...');

    // تحذير في الاستجابة
    const warningMessage = 'تحذير: هذا الـ endpoint مهجور. استخدم /api/facebook/conversations مع company_id للحصول على نتائج مفلترة';

    // دعم للـ limit parameter
    const limit = parseInt(req.query.limit as string) || 100;
    const validLimit = Math.min(Math.max(limit, 1), 200); // بين 1 و 200

    console.log(`📊 Fetching ${validLimit} conversations (WITHOUT COMPANY FILTERING - DEPRECATED)`);

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

    // إضافة تحذير في الاستجابة
    res.json({
      warning: warningMessage,
      deprecated: true,
      recommended_endpoint: '/api/facebook/conversations?company_id=YOUR_COMPANY_ID',
      data: conversationsWithPageInfo
    });
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

// Health check with detailed info for webhook diagnostics
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  res.json({
    status: 'OK',
    service: 'Facebook Reply Automator API',
    uptime: uptime,
    port: PORT,
    timestamp: new Date().toISOString(),
    messagesReceived: 0, // يمكن إضافة عداد حقيقي لاحقاً
    messagesIgnored: 0,
    lastMessageTime: null,
    errors: []
  });
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

// دالة للتحقق من صحة طلب الرسالة
function validateMessageRequest(body: any): boolean {
  console.log('🔍 Validating message request...');
  console.log('🔍 Body type:', typeof body);
  console.log('🔍 Body content:', JSON.stringify(body, null, 2));

  try {
    // التحقق من وجود body
    if (!body) {
      console.log('❌ No body provided');
      return false;
    }

    // التحقق من الحقول المطلوبة الأساسية
    if (!body.senderId) {
      console.log('❌ Missing required field: senderId');
      console.log('🔍 Available fields:', Object.keys(body));
      return false;
    }

    // التحقق من وجود messageText أو أي محتوى
    if (!body.messageText && !body.imageUrl) {
      console.log('❌ Missing message content: messageText or imageUrl');
      console.log('🔍 messageText:', body.messageText);
      console.log('🔍 imageUrl:', body.imageUrl);
      return false;
    }

    console.log('✅ Message request validation passed');
    return true;
  } catch (validationError) {
    console.error('❌ Error during validation:', validationError);
    return false;
  }
}

// Process message endpoint
app.post('/api/process-message', async (req, res) => {
  console.log('🚀🚀🚀 POST /api/process-message endpoint hit! 🚀🚀🚀');

  try {
    console.log('📝 Headers:', JSON.stringify(req.headers));
    console.log('📝 Full Body:', JSON.stringify(req.body));
    console.log('📨 Received message processing request:', req.body);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);
    console.log('🔍 About to check request type...');
    console.log('🔍 Request body type:', typeof req.body);
    console.log('🔍 Request body keys:', Object.keys(req.body || {}));

    console.log('🔍 About to set response headers...');
    // إضافة headers للاستجابة
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      console.log('✅ Response headers set successfully');
    } catch (headerError) {
      console.error('❌ Error setting response headers:', headerError);
      throw headerError;
    }

    console.log('🔍 About to check request type...');
    // التحقق من نوع الطلب
    try {
      console.log('🔍 Request body structure:', {
        bodyExists: !!req.body,
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        hasObject: !!req.body?.object,
        objectValue: req.body?.object,
        hasEntry: !!req.body?.entry,
        isDirectCall: !req.body?.object
      });
      console.log('✅ Request type check completed');
    } catch (typeCheckError) {
      console.error('❌ Error checking request type:', typeCheckError);
      throw typeCheckError;
    }

    if (req.body?.object === 'page' && req.body?.entry) {
      // معالجة webhook من Facebook
      console.log('🔄 Processing Facebook webhook...');
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
      console.log('🔄 Processing direct API call...');
      console.log('🔍 Direct API call body:', JSON.stringify(req.body, null, 2));

      try {
        console.log('🔍 About to validate message request...');
        const isValid = validateMessageRequest(req.body);
        console.log('🔍 Validation result:', isValid);

        if (!isValid) {
          console.log('❌ Request validation failed');
          return res.status(400).json({
            success: false,
            message: 'Invalid request format'
          });
        }

        console.log('✅ Request validation passed, processing message...');

        // تحويل الطلب إلى format المطلوب
        const messageRequest = {
          senderId: req.body.senderId,
          messageText: req.body.messageText || '',
          messageId: req.body.messageId || `direct_${Date.now()}`,
          pageId: req.body.pageId || 'direct_api',
          timestamp: req.body.timestamp || Date.now(),
          imageUrl: req.body.imageUrl || null,
          senderType: req.body.senderType || 'customer',
          isEcho: req.body.isEcho || false
        };

        console.log('🔄 Processing direct message request:', messageRequest);

        // معالجة الرسالة
        const result = await processIncomingMessage(messageRequest);

        console.log('✅ Direct message processing result:', result);

        res.json(result);
      } catch (directError) {
        console.error('❌ Error in direct API call processing:', directError);
        res.status(500).json({
          success: false,
          message: 'Error processing direct API call: ' + (directError instanceof Error ? directError.message : 'Unknown error')
        });
      }
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
  const VERIFY_TOKEN = 'facebook_verify_token_123';

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

  // إضافة log للكونسول فقط (لا يمكن استخدام fs في البراوزر)
  try {
    console.log('📝 [WEBHOOK DEBUG]', `${new Date().toISOString()} - WEBHOOK RECEIVED: ${JSON.stringify(body)}`);
  } catch (err) {
    console.error('Error writing to debug log:', err);
  }

  console.log('🔥🔥🔥 FACEBOOK WEBHOOK RECEIVED! 🔥🔥🔥');
  console.log('📨 Received Facebook webhook:', JSON.stringify(body, null, 2));
  console.log('🔥🔥🔥 END WEBHOOK DATA 🔥🔥🔥');

  try {
    // التأكد من أن الطلب من Facebook Page
    if (body.object === 'page') {
      // معالجة كل entry
      for (const entry of body.entry || []) {
        const pageId = entry.id;

        // 🔍 فحص حالة الصفحة أولاً - التحكم المرن
        console.log(`🔍 Checking page status for: ${pageId}`);

        // البحث عن إعدادات الصفحة في قاعدة البيانات
        const { data: pageSettings, error: pageError } = await supabase
          .from('facebook_pages')
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
        if (entry.messaging && Array.isArray(entry.messaging)) {
          console.log(`💬 Found ${entry.messaging.length} messaging events`);
          for (const messagingEvent of entry.messaging) {
            console.log(`🔄 Processing messaging event:`, JSON.stringify(messagingEvent, null, 2));
            await handleMessagingEvent(messagingEvent, pageId);
          }
        } else {
          console.log(`📭 No messaging events found in entry`);
        }

        // معالجة تعليقات المنشورات
        if (entry.changes && Array.isArray(entry.changes)) {
          console.log(`📝 Found ${entry.changes.length} page changes`);
          for (const change of entry.changes) {
            console.log(`🔄 Processing page change:`, JSON.stringify(change, null, 2));
            await handlePageChange(change, pageId);
          }
        } else {
          console.log(`📭 No page changes found in entry`);
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
  const recipientId = messagingEvent.recipient?.id;
  const timestamp = messagingEvent.timestamp;

  console.log(`📱 Processing messaging event from ${senderId} to ${recipientId}`);
  console.log(`📋 Full messaging event:`, JSON.stringify(messagingEvent, null, 2));

  // رسالة واردة
  if (messagingEvent.message) {
    const isEcho = messagingEvent.message.is_echo;
    const isFromPage = senderId === pageId || senderId === recipientId;

    console.log(`📨 Message details:`, {
      senderId,
      recipientId,
      pageId,
      isEcho,
      isFromPage,
      messageText: messagingEvent.message.text
    });

    if (isEcho) {
      console.log('🔄 Echo message detected - this is a message sent BY the page');
      // رسالة مرسلة من الصفحة (echo)
      await handlePageMessage(messagingEvent, pageId);
    } else if (isFromPage) {
      console.log('📤 Message from page admin detected');
      // رسالة من إدارة الصفحة
      await handlePageMessage(messagingEvent, pageId);
    } else {
      console.log('📥 Message from customer detected');
      // رسالة من العميل
      await handleCustomerMessage(messagingEvent, pageId);
    }
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

// معالجة رسالة العميل من Facebook
async function handleCustomerMessage(messagingEvent: any, pageId: string) {
  const senderId = messagingEvent.sender.id;
  const message = messagingEvent.message;
  const messageText = message.text || '';
  const messageId = message.mid;

  console.log(`💬 Facebook customer message from ${senderId}: "${messageText}"`);

  try {
    // معالجة الرسالة من العميل
    const messageRequest = {
      senderId,
      messageText,
      messageId,
      pageId,
      timestamp: messagingEvent.timestamp,
      senderType: 'customer' as const,
      isEcho: false
    };

    console.log('🔄 Processing Facebook customer message:', messageRequest);

    // معالجة الرسالة مع إمكانية الرد الآلي
    const result = await processIncomingMessage(messageRequest);

    console.log('✅ Facebook customer message processing result:', result);

  } catch (error) {
    console.error('❌ Error processing Facebook customer message:', error);
  }
}

// معالجة رسالة الصفحة من Facebook (echo أو من الإدارة)
async function handlePageMessage(messagingEvent: any, pageId: string) {
  const senderId = messagingEvent.sender.id;
  const recipientId = messagingEvent.recipient.id;
  const message = messagingEvent.message;
  const messageText = message.text || '';
  const messageId = message.mid;
  const isEcho = message.is_echo;

  console.log(`📤 Facebook page message ${isEcho ? '(echo)' : '(admin)'} from ${senderId} to ${recipientId}: "${messageText}"`);

  try {
    // تحديد المستقبل الحقيقي (العميل)
    const customerId = isEcho ? recipientId : senderId;
    const actualPageId = isEcho ? senderId : recipientId;

    console.log(`🎯 Determined customer ID: ${customerId}, page ID: ${actualPageId}`);

    // معالجة الرسالة من الصفحة
    const messageRequest = {
      senderId: customerId, // المستقبل هو العميل
      messageText,
      messageId,
      pageId: actualPageId,
      timestamp: messagingEvent.timestamp,
      senderType: 'page' as const,
      isEcho
    };

    console.log('🔄 Processing Facebook page message:', messageRequest);

    // معالجة الرسالة بدون رد آلي
    const result = await processIncomingMessage(messageRequest);

    console.log('✅ Facebook page message processing result:', result);

  } catch (error) {
    console.error('❌ Error processing Facebook page message:', error);
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



// Get messages for a specific conversation
app.get('/api/facebook/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    console.log(`🔍 API Server: Getting messages for conversation: ${conversationId}`);

    // التحقق من أن المحادثة تنتمي للشركة
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, company_id')
      .eq('id', conversationId)
      .eq('company_id', company_id)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // جلب الرسائل
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    console.log(`✅ API Server: Found ${messages?.length || 0} messages for conversation ${conversationId}`);

    res.json(messages || []);
  } catch (error) {
    console.error('❌ Error in messages endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Message Processing API started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`📡 External access: http://192.168.1.3:${PORT}`);
  console.log(`🔗 Process message endpoint: http://192.168.1.3:${PORT}/api/process-message`);
  console.log(`🔗 Debug conversations endpoint: http://192.168.1.3:${PORT}/api/conversations`);
  console.log(`🔗 Debug messages endpoint: http://192.168.1.3:${PORT}/api/messages/recent`);
  console.log(`🔗 Debug send message endpoint: http://localhost:${PORT}/api/send-message`);

  // تهيئة النظام عند بدء التشغيل
  console.log('🔧 [SYSTEM] بدء تهيئة النظام...');
  try {
    await SuperAdminService.initializeSystem();
    console.log('✅ [SYSTEM] تم تهيئة النظام بنجاح');
  } catch (error) {
    console.error('❌ [SYSTEM] خطأ في تهيئة النظام:', error);
  }

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

// 🔄 API لتحديث قوائم المنتجات (للنظام الديناميكي)
app.post('/api/refresh-product-cache', async (req, res) => {
  try {
    console.log('🔄 API call: /api/refresh-product-cache');

    // يمكن إضافة منطق تحديث الكاش هنا إذا لزم الأمر
    // حال<|im_start|> النظام يجلب البيانات مباشرة من قاعدة البيانات

    res.json({
      success: true,
      message: 'Product cache refresh triggered - Dynamic system will auto-detect new products',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/refresh-product-cache:', error);
    res.status(500).json({ error: 'Failed to refresh product cache' });
  }
});

// إضافة معالج الأخطاء والمسارات غير الموجودة
// فحص مشكلة عدم ظهور المنتجات للشركة المحددة
app.get('/api/debug-company-products/:companyEmail', async (req, res) => {
  try {
    const companyEmail = req.params.companyEmail;
    console.log(`🔍 فحص منتجات الشركة: ${companyEmail}`);

    // 1. البحث عن الشركة
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('email', companyEmail)
      .single();

    if (companyError || !company) {
      return res.status(404).json({
        success: false,
        error: 'الشركة غير موجودة',
        details: companyError
      });
    }

    // 2. البحث عن متاجر الشركة
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('company_id', company.id);

    if (storesError) {
      return res.status(500).json({
        success: false,
        error: 'خطأ في جلب المتاجر',
        details: storesError
      });
    }

    // 3. البحث عن منتجات المتاجر
    let allProducts = [];
    if (stores && stores.length > 0) {
      const storeIds = stores.map(s => s.id);

      const { data: products, error: productsError } = await supabase
        .from('ecommerce_products')
        .select('*')
        .in('store_id', storeIds)
        .order('created_at', { ascending: false });

      if (!productsError) {
        allProducts = products || [];
      }
    }

    // 4. البحث عن جميع المنتجات في النظام (للمقارنة)
    const { data: allSystemProducts, error: allProductsError } = await supabase
      .from('ecommerce_products')
      .select('*, stores!inner(company_id, name as store_name)')
      .order('created_at', { ascending: false });

    res.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          status: company.status
        },
        stores: stores.map(s => ({
          id: s.id,
          name: s.name,
          is_active: s.is_active,
          company_id: s.company_id
        })),
        company_products: allProducts.map(p => ({
          id: p.id,
          name: p.name,
          store_id: p.store_id,
          price: p.price,
          status: p.status,
          created_at: p.created_at
        })),
        all_system_products: allSystemProducts?.map(p => ({
          id: p.id,
          name: p.name,
          store_id: p.store_id,
          store_name: p.stores?.store_name,
          company_id: p.stores?.company_id,
          price: p.price,
          status: p.status,
          created_at: p.created_at
        })) || [],
        summary: {
          company_stores_count: stores.length,
          company_products_count: allProducts.length,
          total_system_products: allSystemProducts?.length || 0,
          products_for_this_company: allSystemProducts?.filter(p => p.stores?.company_id === company.id).length || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ خطأ في فحص منتجات الشركة:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// إصلاح ربط المنتجات بالشركة المحددة
app.post('/api/fix-product-company-link/:companyEmail', async (req, res) => {
  try {
    const companyEmail = req.params.companyEmail;
    console.log(`🔧 إصلاح ربط المنتجات للشركة: ${companyEmail}`);

    // 1. البحث عن الشركة
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('email', companyEmail)
      .single();

    if (companyError || !company) {
      return res.status(404).json({
        success: false,
        error: 'الشركة غير موجودة'
      });
    }

    // 2. البحث عن متجر الشركة أو إنشاؤه
    let { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('company_id', company.id);

    if (storesError) {
      return res.status(500).json({
        success: false,
        error: 'خطأ في جلب المتاجر'
      });
    }

    let storeId: string;
    if (!stores || stores.length === 0) {
      // إنشاء متجر جديد للشركة
      const { data: newStore, error: createStoreError } = await supabase
        .from('stores')
        .insert({
          company_id: company.id,
          name: `متجر ${company.name}`,
          slug: `store-${company.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
          description: `متجر إلكتروني لشركة ${company.name}`,
          owner_email: company.email,
          currency: 'EGP',
          is_active: true,
          settings: {}
        })
        .select()
        .single();

      if (createStoreError) {
        return res.status(500).json({
          success: false,
          error: 'خطأ في إنشاء المتجر'
        });
      }

      storeId = newStore.id;
      console.log(`✅ تم إنشاء متجر جديد: ${newStore.name}`);
    } else {
      storeId = stores[0].id;
      console.log(`✅ استخدام المتجر الموجود: ${stores[0].name}`);
    }

    // 3. نقل آخر المنتجات المضافة إلى متجر هذه الشركة
    const { data: recentProducts, error: recentError } = await supabase
      .from('ecommerce_products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      return res.status(500).json({
        success: false,
        error: 'خطأ في جلب المنتجات الحديثة'
      });
    }

    let movedProducts = 0;
    for (const product of recentProducts) {
      // التحقق من أن المنتج ليس مرتبط بمتجر هذه الشركة بالفعل
      const { data: productStore } = await supabase
        .from('stores')
        .select('company_id')
        .eq('id', product.store_id)
        .single();

      if (productStore?.company_id !== company.id) {
        // إنشاء نسخة من المنتج في متجر الشركة الصحيحة
        const { error: copyError } = await supabase
          .from('ecommerce_products')
          .insert({
            store_id: storeId,
            name: product.name,
            slug: `${product.slug}-${company.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
            description: product.description,
            short_description: product.short_description,
            sku: `${product.sku}-${company.name.substring(0, 3).toUpperCase()}`,
            price: product.price,
            sale_price: product.sale_price,
            stock_quantity: product.stock_quantity,
            status: product.status,
            featured: product.featured,
            image_url: product.image_url,
            category: product.category,
            brand: product.brand
          });

        if (!copyError) {
          movedProducts++;
          console.log(`✅ تم نسخ المنتج: ${product.name}`);
        }
      }
    }

    res.json({
      success: true,
      message: `تم إصلاح ربط المنتجات بنجاح`,
      data: {
        company_name: company.name,
        company_email: company.email,
        store_id: storeId,
        products_moved: movedProducts
      }
    });

  } catch (error) {
    console.error('❌ خطأ في إصلاح ربط المنتجات:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;
