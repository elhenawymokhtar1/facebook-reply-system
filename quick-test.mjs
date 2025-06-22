import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function quickTest() {
  console.log('🔍 اختبار سريع للبحث...');
  
  // اختبار "حذاء أسود"
  const { data: products } = await supabase
    .from('ecommerce_products')
    .select('id, name, category')
    .limit(5);
  
  console.log('📦 المنتجات المتوفرة:');
  products.forEach(p => console.log(`   - ${p.name} (${p.category})`));
  
  // اختبار البحث
  const searchQuery = 'حذاء أسود';
  const searchTerms = searchQuery.toLowerCase();
  
  console.log(`\n🔍 البحث عن: "${searchQuery}"`);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const product of products) {
    const productText = `${product.name} ${product.category}`.toLowerCase();
    let score = 0;
    
    if (productText.includes(searchTerms)) score += 100;
    if (searchTerms.includes('حذاء') && productText.includes('حذاء')) score += 50;
    if (searchTerms.includes('أسود') && productText.includes('أسود')) score += 30;
    
    console.log(`   ${product.name}: ${score} نقطة`);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }
  
  if (bestMatch) {
    console.log(`\n🎯 أفضل تطابق: ${bestMatch.name} (${bestScore} نقطة)`);
    
    // جلب صورة المنتج
    const { data: productData } = await supabase
      .from('ecommerce_products')
      .select('image_url')
      .eq('id', bestMatch.id)
      .single();
    
    if (productData?.image_url) {
      console.log(`📸 صورة المنتج: ${productData.image_url.substring(0, 50)}...`);
    }
  }
}

quickTest();
