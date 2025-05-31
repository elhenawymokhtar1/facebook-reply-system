import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Package, Search, Palette, Ruler, ShoppingBag, Settings } from "lucide-react";
import { useProductsVariants, getAvailableColors, getMinPrice, getMaxPrice } from "@/hooks/useProductsVariants";
import { useActiveCategories, useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";

interface ProductVariant {
  id: string;
  color: string;
  size: string;
  price: number;
  stock_quantity: number;
  sku: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  brand?: string;
  is_active: boolean;
  created_at: string;
  variants: ProductVariant[];
}

const ProductsVariants = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterColor, setFilterColor] = useState<string>("all");

  // إدارة الفئات البسيطة
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    base_price: '',
    brand: '',
    variants: [
      { color: '', size: '', price: '', stock_quantity: '', image_url: '' }
    ]
  });

  const { products, isLoading, addProduct, updateProduct, deleteProduct } = useProductsVariants();
  const { data: activeCategories = [] } = useActiveCategories();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();

  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;

    // فلترة بالألوان
    let matchesColor = true;
    if (filterColor !== "all") {
      const availableColors = getAvailableColors(product.variants);
      matchesColor = availableColors.includes(filterColor);
    }

    return matchesSearch && matchesCategory && matchesColor;
  });

  // الحصول على قائمة الفئات والألوان الفريدة
  const productCategories = [...new Set(products.map(p => p.category))];
  const allColors = [...new Set(products.flatMap(p => getAvailableColors(p.variants)))];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      base_price: '',
      brand: '',
      variants: [
        { color: '', size: '', price: '', stock_quantity: '', image_url: '' }
      ]
    });
    setEditingProduct(null);
  };

  const addVariantRow = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { color: '', size: '', price: '', stock_quantity: '', image_url: '' }]
    });
  };

  const removeVariantRow = (index: number) => {
    if (formData.variants.length > 1) {
      const newVariants = formData.variants.filter((_, i) => i !== index);
      setFormData({ ...formData, variants: newVariants });
    }
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.base_price) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // التحقق من المتغيرات
    const validVariants = formData.variants.filter(v => v.color && v.size && v.price);
    if (validVariants.length === 0) {
      toast.error('يرجى إضافة متغير واحد على الأقل (لون ومقاس وسعر)');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        base_price: parseFloat(formData.base_price),
        brand: formData.brand,
        variants: validVariants.map(v => ({
          color: v.color,
          size: v.size,
          price: parseFloat(v.price),
          stock_quantity: parseInt(v.stock_quantity) || 0,
          image_url: v.image_url
        }))
      };

      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await addProduct.mutateAsync(productData);
        toast.success('تم إضافة المنتج بنجاح');
      }

      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ المنتج');
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      base_price: product.base_price.toString(),
      brand: product.brand || '',
      variants: product.variants.length > 0 ? product.variants.map(v => ({
        color: v.color,
        size: v.size,
        price: v.price.toString(),
        stock_quantity: v.stock_quantity.toString(),
        image_url: v.image_url
      })) : [{ color: '', size: '', price: '', stock_quantity: '', image_url: '' }]
    });
    setEditingProduct(product);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}" مع جميع متغيراته؟`)) return;

    try {
      await deleteProduct.mutateAsync(id);
      toast.success('تم حذف المنتج بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف المنتج');
    }
  };

  // دوال إدارة الفئات البسيطة
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('يرجى إدخال اسم الفئة');
      return;
    }

    try {
      await addCategory.mutateAsync({
        name: newCategoryName.trim(),
        description: '',
        icon: 'package',
        color: 'blue'
      });
      setNewCategoryName('');
      toast.success('تم إضافة الفئة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الفئة');
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    // التحقق من وجود منتجات في هذه الفئة
    const hasProducts = products.some(product => product.category === categoryName);

    if (hasProducts) {
      toast.error('لا يمكن حذف الفئة لأنها تحتوي على منتجات');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف فئة "${categoryName}"؟`)) return;

    try {
      await deleteCategory.mutateAsync(categoryId);
      toast.success('تم حذف الفئة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الفئة');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المنتجات والمتغيرات</h1>
          <p className="text-gray-600">إدارة المنتجات مع الألوان والمقاسات والمخزون</p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                المنتجات ({filteredProducts.length})
              </span>
              <div className="flex gap-2">
                {/* زر إدارة الفئات البسيط */}
                <Dialog open={isCategoriesDialogOpen} onOpenChange={setIsCategoriesDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 ml-2" />
                      إدارة الفئات
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>إدارة الفئات</DialogTitle>
                      <DialogDescription>
                        إضافة أو حذف فئات المنتجات
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* إضافة فئة جديدة */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="اسم الفئة الجديدة..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        />
                        <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* قائمة الفئات الموجودة */}
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {categories.map((category) => {
                          const productsCount = products.filter(p => p.category === category.name).length;
                          return (
                            <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <span className="font-medium">{category.name}</span>
                                <span className="text-sm text-gray-500 mr-2">({productsCount} منتج)</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                                disabled={productsCount > 0}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>

                      {categories.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                          لا توجد فئات
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة منتج جديد
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProduct ? 'تعديل بيانات المنتج ومتغيراته' : 'أضف منتج جديد مع الألوان والمقاسات'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* بيانات المنتج الأساسية */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>اسم المنتج *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="حذاء رياضي عصري..."
                        />
                      </div>
                      <div>
                        <Label>السعر الأساسي (جنيه) *</Label>
                        <Input
                          type="number"
                          value={formData.base_price}
                          onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                          placeholder="450"
                        />
                      </div>
                      <div>
                        <Label>الفئة *</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeCategories.map(category => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>الماركة</Label>
                        <Input
                          value={formData.brand}
                          onChange={(e) => setFormData({...formData, brand: e.target.value})}
                          placeholder="اسم الماركة..."
                        />
                      </div>
                    </div>

                    <div>
                      <Label>الوصف</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="وصف المنتج..."
                        rows={3}
                      />
                    </div>

                    {/* المتغيرات */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-lg font-semibold">المتغيرات (الألوان والمقاسات)</Label>
                        <Button type="button" variant="outline" onClick={addVariantRow}>
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة متغير
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {formData.variants.map((variant, index) => (
                          <Card key={index} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                              <div>
                                <Label>اللون *</Label>
                                <Input
                                  value={variant.color}
                                  onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                  placeholder="أبيض، أسود..."
                                />
                              </div>
                              <div>
                                <Label>المقاس *</Label>
                                <Input
                                  value={variant.size}
                                  onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                  placeholder="40، 41، 42..."
                                />
                              </div>
                              <div>
                                <Label>السعر *</Label>
                                <Input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                  placeholder="450"
                                />
                              </div>
                              <div>
                                <Label>الكمية</Label>
                                <Input
                                  type="number"
                                  value={variant.stock_quantity}
                                  onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                                  placeholder="10"
                                />
                              </div>
                              <div className="flex items-end">
                                {formData.variants.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeVariantRow(index)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="mt-2">
                              <Label>رابط الصورة</Label>
                              <Input
                                value={variant.image_url}
                                onChange={(e) => updateVariant(index, 'image_url', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                              />
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      className="w-full"
                      disabled={addProduct.isPending || updateProduct.isPending}
                    >
                      {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
                    </Button>
                  </div>
                </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {productCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterColor} onValueChange={setFilterColor}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الألوان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الألوان</SelectItem>
                  {allColors.map(color => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-8">جاري تحميل المنتجات...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا توجد منتجات</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const availableColors = getAvailableColors(product.variants);
              const minPrice = getMinPrice(product.variants);
              const maxPrice = getMaxPrice(product.variants);
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock_quantity, 0);

              return (
                <Card key={product.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                        <div className="flex items-center gap-2">
                          {minPrice === maxPrice ? (
                            <p className="text-xl font-bold text-green-600">{minPrice} ج</p>
                          ) : (
                            <p className="text-xl font-bold text-green-600">{minPrice} - {maxPrice} ج</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* الألوان المتاحة */}
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-gray-500" />
                        <div className="flex gap-1 flex-wrap">
                          {availableColors.map(color => (
                            <Badge key={color} variant="secondary" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* المخزون */}
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          {totalStock} قطعة في المخزون
                        </span>
                      </div>

                      {/* عدد المتغيرات */}
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          {product.variants.length} متغير
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 ml-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsVariants;
