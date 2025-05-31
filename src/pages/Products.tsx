import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Package, Eye, EyeOff, Search, Filter, Palette, Ruler } from "lucide-react";
import { useProductsVariants, getAvailableColors, getAvailableSizes, getMinPrice, getMaxPrice } from "@/hooks/useProductsVariants";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  color: string;
  category: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
}

const Products = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterColor, setFilterColor] = useState<string>("all");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    color: '',
    category: '',
    image_url: '',
    is_available: true
  });

  const { products, isLoading, addProduct, updateProduct, deleteProduct, toggleAvailability } = useProducts();

  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    const matchesColor = filterColor === "all" || product.color === filterColor;
    const matchesAvailability = !showAvailableOnly || product.is_available;

    return matchesSearch && matchesCategory && matchesColor && matchesAvailability;
  });

  // الحصول على قائمة الفئات والألوان الفريدة
  const categories = [...new Set(products.map(p => p.category))];
  const colors = [...new Set(products.map(p => p.color))];

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      color: '',
      category: '',
      image_url: '',
      is_available: true
    });
    setEditingProduct(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.color || !formData.category) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          ...formData,
          price: parseFloat(formData.price)
        });
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await addProduct.mutateAsync({
          ...formData,
          price: parseFloat(formData.price)
        });
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
      price: product.price.toString(),
      description: product.description,
      color: product.color,
      category: product.category,
      image_url: product.image_url,
      is_available: product.is_available
    });
    setEditingProduct(product);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;

    try {
      await deleteProduct.mutateAsync(id);
      toast.success('تم حذف المنتج بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف المنتج');
    }
  };

  const handleToggleAvailability = async (id: string, name: string) => {
    try {
      await toggleAvailability.mutateAsync(id);
      toast.success(`تم تحديث حالة "${name}"`);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة المنتج');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المنتجات</h1>
          <p className="text-gray-600">إضافة وإدارة منتجات المتجر</p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                المنتجات ({filteredProducts.length})
              </span>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة منتج جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProduct ? 'تعديل بيانات المنتج' : 'أضف منتج جديد للمتجر'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>اسم المنتج *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="حذاء رياضي أبيض..."
                      />
                    </div>
                    <div>
                      <Label>السعر (جنيه) *</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="450"
                      />
                    </div>
                    <div>
                      <Label>اللون *</Label>
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        placeholder="أبيض، أسود، بني..."
                      />
                    </div>
                    <div>
                      <Label>الفئة *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="رياضي">رياضي</SelectItem>
                          <SelectItem value="كلاسيك">كلاسيك</SelectItem>
                          <SelectItem value="كاجوال">كاجوال</SelectItem>
                          <SelectItem value="رسمي">رسمي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>رابط الصورة</Label>
                      <Input
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
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
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={formData.is_available}
                        onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
                      />
                      <Label>متاح للبيع</Label>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                  {categories.map(category => (
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
                  {colors.map(color => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  checked={showAvailableOnly}
                  onCheckedChange={setShowAvailableOnly}
                />
                <Label className="text-sm">المتاح فقط</Label>
              </div>
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
            {filteredProducts.map((product) => (
              <Card key={product.id} className={`${!product.is_available ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{product.name}</h3>
                      <p className="text-2xl font-bold text-green-600 mt-1">{product.price} ج</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.is_available ? "default" : "secondary"}>
                        {product.is_available ? "متاح" : "غير متاح"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Badge variant="outline">{product.color}</Badge>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    )}
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
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
                        onClick={() => handleToggleAvailability(product.id, product.name)}
                        className="flex-1"
                      >
                        {product.is_available ? <EyeOff className="w-4 h-4 ml-1" /> : <Eye className="w-4 h-4 ml-1" />}
                        {product.is_available ? 'إخفاء' : 'إظهار'}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
