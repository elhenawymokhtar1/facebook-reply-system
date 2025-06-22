import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createProductsTable() {
  console.log('🔧 إنشاء جدول المنتجات...\n');
  
  try {
    // إنشاء جدول products
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2),
          category TEXT,
          image_urls TEXT[],
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (createError) {
      console.error('❌ خطأ في إنشاء جدول products:', createError);
      return;
    }
    
    console.log('✅ تم إنشاء جدول products بنجاح');
    
    // إنشاء جدول product_variants
    const { error: variantsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS product_variants (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          product_id UUID REFERENCES products(id) ON DELETE CASCADE,
          color TEXT,
          size TEXT,
          price DECIMAL(10,2),
          image_urls TEXT[],
          stock_quantity INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (variantsError) {
      console.error('❌ خطأ في إنشاء جدول product_variants:', variantsError);
      return;
    }
    
    console.log('✅ تم إنشاء جدول product_variants بنجاح');
    
    // إضافة بعض المنتجات التجريبية
    console.log('\n📦 إضافة منتجات تجريبية...');
    
    const sampleProducts = [
      {
        name: 'فستان صيفي',
        description: 'فستان صيفي أنيق ومريح',
        price: 150.00,
        category: 'فساتين',
        image_urls: [
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
          'https://images.unsplash.com/photo-1566479179817-c0b5b4b8b1c0?w=400'
        ]
      },
      {
        name: 'بلوزة كاجوال',
        description: 'بلوزة كاجوال للاستخدام اليومي',
        price: 80.00,
        category: 'بلوزات',
        image_urls: [
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
          'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400'
        ]
      },
      {
        name: 'جاكيت شتوي',
        description: 'جاكيت شتوي دافئ وأنيق',
        price: 200.00,
        category: 'جاكيتات',
        image_urls: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
        ]
      }
    ];
    
    for (const product of sampleProducts) {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ خطأ في إضافة ${product.name}:`, error);
      } else {
        console.log(`✅ تم إضافة ${product.name}`);
        
        // إضافة متغيرات للمنتج
        const variants = [
          { color: 'أحمر', size: 'S', price: product.price },
          { color: 'أزرق', size: 'M', price: product.price },
          { color: 'أسود', size: 'L', price: product.price + 10 }
        ];
        
        for (const variant of variants) {
          await supabase
            .from('product_variants')
            .insert({
              product_id: data.id,
              ...variant,
              image_urls: product.image_urls
            });
        }
      }
    }
    
    console.log('\n🎉 تم إعداد قاعدة بيانات المنتجات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل الإعداد
createProductsTable();
