import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEcommerceProducts } from "@/hooks/useEcommerceProducts";
import { useCart } from "@/hooks/useCart";
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Star, 
  Eye,
  Plus,
  Minus,
  Heart,
  Share2,
  Grid3X3,
  List,
  Palette,
  Ruler,
  Grid2X2,
  LayoutGrid,
  Columns4
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Shop = () => {
  const { products, isLoading, getCategories, getBrands } = useEcommerceProducts();
  const { addToCart, isAdding, sessionId, cartItems, getCartSummary } = useCart();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridColumns, setGridColumns] = useState(3);

  // Debug log للتأكد من الـ state
  useEffect(() => {
    console.log('Current state - viewMode:', viewMode, 'gridColumns:', gridColumns);
  }, [viewMode, gridColumns]);

  // state للـ window width
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // حساب عدد الأعمدة الفعلي حسب حجم الشاشة
  const getActualColumns = () => {
    if (viewMode === 'list') return 1;

    if (windowWidth < 768) return 1; // mobile
    if (windowWidth < 1024) return Math.min(gridColumns, 2); // tablet
    if (windowWidth < 1280) return Math.min(gridColumns, 3); // desktop
    return gridColumns; // large desktop
  };

  // listener للـ window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // عدد الأعمدة في الـ grid
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [productVariants, setProductVariants] = useState<Record<string, any[]>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);

  // فلترة وترتيب المنتجات
  const getFilteredProducts = () => {
    let filtered = products.filter(product => {
      // فلتر البحث
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // فلتر الفئة
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      // فلتر العلامة التجارية
      const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand;

      // فلتر السعر
      const price = product.sale_price || product.price;
      const matchesPrice = (!priceRange.min || price >= parseFloat(priceRange.min)) &&
                          (!priceRange.max || price <= parseFloat(priceRange.max));

      // المنتجات النشطة فقط
      const isActive = product.status === 'active';

      return matchesSearch && matchesCategory && matchesBrand && matchesPrice && isActive;
    });

    // ترتيب المنتجات
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();
  const categories = getCategories();
  const brands = getBrands();

  // الحصول على classes الـ grid حسب عدد الأعمدة
  const getGridClasses = () => {
    if (viewMode === 'list') return 'grid-cols-1';

    switch (gridColumns) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  // جلب variants للمنتجات
  useEffect(() => {
    const fetchProductVariants = async () => {
      if (products.length === 0) return;

      const variantsData: Record<string, any[]> = {};

      for (const product of products) {
        try {
          const { data: variants, error } = await supabase
            .from('product_variants')
            .select('id, sku, color, size, price, stock_quantity, image_url')
            .eq('product_id', product.id)
            .eq('is_available', true);

          if (!error && variants && variants.length > 0) {
            variantsData[product.id] = variants;
          }
        } catch (error) {
          console.error(`Error fetching variants for product ${product.id}:`, error);
        }
      }

      setProductVariants(variantsData);
    };

    fetchProductVariants();
  }, [products]);

  // الحصول على الألوان المتاحة لمنتج
  const getAvailableColors = (productId: string) => {
    const variants = productVariants[productId] || [];
    const colors = [...new Set(variants.map(v => v.color))].filter(Boolean);
    return colors;
  };

  // الحصول على المقاسات المتاحة لمنتج ولون محدد
  const getAvailableSizes = (productId: string, selectedColor?: string) => {
    const variants = productVariants[productId] || [];
    const filteredVariants = selectedColor
      ? variants.filter(v => v.color === selectedColor)
      : variants;
    const sizes = [...new Set(filteredVariants.map(v => v.size))].filter(Boolean);
    return sizes.sort((a, b) => parseInt(a) - parseInt(b));
  };

  // الحصول على variant محدد
  const getSelectedVariant = (productId: string) => {
    const variants = productVariants[productId] || [];
    const selected = selectedVariants[productId];

    if (!selected || !selected.color || !selected.size) return null;

    return variants.find(v => v.color === selected.color && v.size === selected.size);
  };

  // تحديث اختيار variant
  const updateVariantSelection = (productId: string, type: 'color' | 'size', value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [type]: value,
        // إعادة تعيين المقاس إذا تم تغيير اللون
        ...(type === 'color' ? { size: '' } : {})
      }
    }));
  };

  // إضافة للسلة
  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    console.log('🛒 محاولة إضافة منتج للسلة:', { productId, quantity, sessionId });

    // التحقق من وجود variants
    const variants = productVariants[productId] || [];
    if (variants.length > 0) {
      const selectedVariant = getSelectedVariant(productId);
      if (!selectedVariant) {
        toast({
          title: "يرجى اختيار المواصفات",
          description: "يرجى اختيار اللون والمقاس قبل إضافة المنتج للسلة",
          variant: "destructive",
        });
        return;
      }

      // التحقق من المخزون
      if (selectedVariant.stock_quantity < quantity) {
        toast({
          title: "مخزون غير كافي",
          description: `متوفر فقط ${selectedVariant.stock_quantity} قطعة من هذا المنتج`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      await addToCart({
        productId,
        quantity,
        sessionId
      });

      console.log('✅ تم إضافة المنتج للسلة بنجاح');

      toast({
        title: "تم الإضافة للسلة",
        description: "تم إضافة المنتج لسلة التسوق بنجاح",
      });
    } catch (error) {
      console.error('❌ خطأ في إضافة المنتج للسلة:', error);

      toast({
        title: "خطأ في إضافة المنتج",
        description: error instanceof Error ? error.message : "فشل في إضافة المنتج للسلة",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">متجر سوان شوب</h1>
              <p className="text-gray-600">اكتشف أحدث المنتجات العصرية</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 ml-2" />
                المفضلة
              </Button>
              <Link to="/cart">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 ml-2" />
                  السلة ({getCartSummary().itemsCount})
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Overlay للفلاتر على الشاشات الصغيرة */}
        {showFilters && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - الفلاتر */}
          <div className={`
            w-full lg:w-64 lg:flex-shrink-0 space-y-6
            ${showFilters ? 'fixed inset-y-0 right-0 z-50 bg-white p-6 shadow-xl overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0 lg:shadow-none' : 'hidden lg:block'}
          `}>
            {/* عنوان الفلاتر */}
            <div className="lg:hidden mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">الفلاتر</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  ✕
                </Button>
              </div>
            </div>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Search className="w-4 h-4 ml-2" />
                  البحث
                </h3>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="ابحث عن منتج..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Filter className="w-4 h-4 ml-2" />
                  الفئات
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === 'all' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    جميع الفئات ({products.length})
                  </button>
                  {categories.map(category => {
                    const count = products.filter(p => p.category === category).length;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === category 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {category} ({count})
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="w-4 h-4 ml-2" />
                  العلامات التجارية
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedBrand('all')}
                    className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedBrand === 'all' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    جميع العلامات
                  </button>
                  {brands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedBrand === brand 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  💰
                  نطاق السعر
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">من</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">إلى</label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* زر الفلاتر للشاشات الصغيرة */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4 ml-2" />
                  الفلاتر
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {filteredProducts.length} منتج
                  </span>
                  {viewMode === 'grid' && (
                    <span className="text-sm text-gray-500">
                      ({gridColumns} أعمدة - {viewMode})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">ترتيب:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">الأحدث</option>
                    <option value="price-low">السعر: من الأقل للأعلى</option>
                    <option value="price-high">السعر: من الأعلى للأقل</option>
                    <option value="name">الاسم</option>
                    <option value="featured">المميزة أولاً</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* أزرار عدد الأعمدة */}
                {viewMode === 'grid' && (
                  <>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <Button
                        variant={gridColumns === 2 ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          console.log('Setting grid to 2 columns');
                          setGridColumns(2);
                        }}
                        title="عمودين"
                        className="h-8 w-8 p-0"
                      >
                        <Grid2X2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={gridColumns === 3 ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          console.log('Setting grid to 3 columns');
                          setGridColumns(3);
                        }}
                        title="ثلاثة أعمدة"
                        className="h-8 w-8 p-0"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={gridColumns === 4 ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          console.log('Setting grid to 4 columns');
                          setGridColumns(4);
                        }}
                        title="أربعة أعمدة"
                        className="h-8 w-8 p-0"
                      >
                        <Columns4 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="w-px h-6 bg-gray-300"></div>
                  </>
                )}

                {/* أزرار نوع العرض */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    title="عرض شبكي"
                    className="h-8 w-8 p-0"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    title="عرض قائمة"
                    className="h-8 w-8 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns: `repeat(${getActualColumns()}, minmax(0, 1fr))`
                }}
              >
                {filteredProducts.map((product) => (
                  <Card key={product.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${
                    viewMode === 'list' ? 'flex flex-row' : ''
                  }`}>
                    <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                      {(() => {
                        const selectedVariant = getSelectedVariant(product.id);
                        const imageUrl = selectedVariant?.image_url || product.image_url;

                        return imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className={`object-cover transition-all duration-300 ${
                              viewMode === 'list' ? 'w-48 h-32' : 'w-full h-48'
                            }`}
                          />
                        ) : (
                          <div className={`bg-gray-200 flex items-center justify-center ${
                            viewMode === 'list' ? 'w-48 h-32' : 'w-full h-48'
                          }`}>
                            <ShoppingCart className="w-12 h-12 text-gray-400" />
                          </div>
                        );
                      })()}
                      
                      {product.featured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500">
                          <Star className="w-3 h-3 ml-1" />
                          مميز
                        </Badge>
                      )}

                      {product.sale_price && (
                        <Badge className="absolute top-2 left-2 bg-red-500">
                          خصم
                        </Badge>
                      )}

                      {productVariants[product.id] && productVariants[product.id].length > 0 && (
                        <Badge className="absolute bottom-2 right-2 bg-purple-500">
                          <Palette className="w-3 h-3 ml-1" />
                          متعدد الأنواع
                        </Badge>
                      )}

                      <div className="absolute top-2 left-2 flex flex-col gap-2">
                        <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                      <div className="mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-gray-500">{product.brand}</p>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.short_description || product.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const selectedVariant = getSelectedVariant(product.id);
                            const displayPrice = selectedVariant?.price || product.sale_price || product.price;
                            const originalPrice = selectedVariant ? null : product.price;

                            return (
                              <>
                                <span className="text-xl font-bold text-green-600">
                                  {displayPrice} ج
                                </span>
                                {product.sale_price && !selectedVariant && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {originalPrice} ج
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">4.5</span>
                        </div>
                      </div>

                      {/* اختيار المواصفات للمنتجات متعددة الأنواع */}
                      {productVariants[product.id] && productVariants[product.id].length > 0 && (
                        <div className="space-y-3 mb-4">
                          {/* اختيار اللون */}
                          {getAvailableColors(product.id).length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Palette className="w-4 h-4 inline ml-1" />
                                اللون:
                              </label>
                              <Select
                                value={selectedVariants[product.id]?.color || ''}
                                onValueChange={(value) => updateVariantSelection(product.id, 'color', value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="اختر اللون" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableColors(product.id).map((color) => (
                                    <SelectItem key={color} value={color}>
                                      {color}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* اختيار المقاس */}
                          {selectedVariants[product.id]?.color && getAvailableSizes(product.id, selectedVariants[product.id]?.color).length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Ruler className="w-4 h-4 inline ml-1" />
                                المقاس:
                              </label>
                              <Select
                                value={selectedVariants[product.id]?.size || ''}
                                onValueChange={(value) => updateVariantSelection(product.id, 'size', value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="اختر المقاس" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableSizes(product.id, selectedVariants[product.id]?.color).map((size) => (
                                    <SelectItem key={size} value={size}>
                                      {size}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* عرض السعر والمخزون للـ variant المحدد */}
                          {(() => {
                            const selectedVariant = getSelectedVariant(product.id);
                            if (selectedVariant) {
                              return (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-800">
                                      السعر: {selectedVariant.price} ج
                                    </span>
                                    <span className="text-sm text-blue-600">
                                      متوفر: {selectedVariant.stock_quantity}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">
                          المخزون: {(() => {
                            const selectedVariant = getSelectedVariant(product.id);
                            return selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
                          })()}
                        </span>
                        {(() => {
                          const selectedVariant = getSelectedVariant(product.id);
                          const stock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
                          return stock === 0 && <Badge variant="secondary">نفد المخزون</Badge>;
                        })()}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={(() => {
                            const variants = productVariants[product.id] || [];
                            if (variants.length > 0) {
                              const selectedVariant = getSelectedVariant(product.id);
                              return !selectedVariant || selectedVariant.stock_quantity === 0 || isAdding;
                            }
                            return product.stock_quantity === 0 || isAdding;
                          })()}
                        >
                          <ShoppingCart className={`w-4 h-4 ml-2 ${isAdding ? 'animate-spin' : ''}`} />
                          {(() => {
                            const variants = productVariants[product.id] || [];
                            if (variants.length > 0) {
                              const selectedVariant = getSelectedVariant(product.id);
                              if (!selectedVariant) {
                                return 'اختر المواصفات';
                              }
                              if (selectedVariant.stock_quantity === 0) {
                                return 'نفد المخزون';
                              }
                            } else if (product.stock_quantity === 0) {
                              return 'نفد المخزون';
                            }

                            return isAdding ? 'جاري الإضافة...' : 'أضف للسلة';
                          })()}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
                  <p className="text-gray-600">
                    لا توجد منتجات تطابق معايير البحث الحالية
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
