import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Eye, EyeOff, GripVertical, BarChart3, Package, Tags } from "lucide-react";
import { useCategories, getCategoryIcon, getCategoryColor, getCategoriesStats } from "@/hooks/useCategories";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  total_products?: number;
  active_products?: number;
  total_stock?: number;
}

const Categories = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'package'
  });

  const { categories, isLoading, addCategory, updateCategory, deleteCategory, toggleCategory } = useCategories();

  // فلترة الفئات
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showInactive || category.is_active;

    return matchesSearch && matchesStatus;
  });

  // إحصائيات الفئات
  const stats = getCategoriesStats(categories);

  // خيارات الأيقونات
  const iconOptions = [
    { value: 'package', label: '📦 عام', name: 'package' },
    { value: 'shirt', label: '👕 ملابس', name: 'shirt' },
    { value: 'smartphone', label: '📱 إلكترونيات', name: 'smartphone' },
    { value: 'home', label: '🏠 منزل وحديقة', name: 'home' },
    { value: 'dumbbell', label: '🏋️ رياضة', name: 'dumbbell' },
    { value: 'book', label: '📚 كتب', name: 'book' },
    { value: 'sparkles', label: '✨ جمال وعناية', name: 'sparkles' },
    { value: 'car', label: '🚗 سيارات', name: 'car' },
    { value: 'camera', label: '📷 تصوير', name: 'camera' },
    { value: 'watch', label: '⌚ ساعات', name: 'watch' },
    { value: 'bag', label: '👜 حقائب', name: 'bag' },
    { value: 'gift', label: '🎁 هدايا', name: 'gift' }
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'package'
    });
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم الفئة');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          ...formData
        });
        toast.success('تم تحديث الفئة بنجاح');
      } else {
        await addCategory.mutateAsync(formData);
        toast.success('تم إضافة الفئة بنجاح');
      }
      
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الفئة');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon
    });
    setEditingCategory(category);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string, hasProducts: boolean) => {
    if (hasProducts) {
      toast.error('لا يمكن حذف الفئة لأنها تحتوي على منتجات');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف فئة "${name}"؟`)) return;
    
    try {
      await deleteCategory.mutateAsync(id);
      toast.success('تم حذف الفئة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الفئة');
    }
  };

  const handleToggle = async (id: string, name: string) => {
    try {
      await toggleCategory.mutateAsync(id);
      toast.success(`تم تحديث حالة "${name}"`);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الفئة');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الفئات</h1>
          <p className="text-gray-600">إضافة وإدارة فئات المنتجات</p>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الفئات</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalCategories}</p>
                </div>
                <Tags className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">الفئات النشطة</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeCategories}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalProducts}</p>
                </div>
                <Package className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">متوسط المنتجات</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.averageProductsPerCategory}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Tags className="w-5 h-5" />
                الفئات ({filteredCategories.length})
              </span>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة فئة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCategory ? 'تعديل بيانات الفئة' : 'أضف فئة جديدة للمنتجات'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>اسم الفئة *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="مثل: رياضي، كلاسيك..."
                      />
                    </div>
                    <div>
                      <Label>الوصف</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="وصف الفئة..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>الأيقونة</Label>
                      <Select value={formData.icon} onValueChange={(value) => setFormData({...formData, icon: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleSubmit} 
                      className="w-full"
                      disabled={addCategory.isPending || updateCategory.isPending}
                    >
                      {editingCategory ? 'تحديث الفئة' : 'إضافة الفئة'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في الفئات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label className="text-sm">عرض الفئات غير النشطة</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="text-center py-8">جاري تحميل الفئات...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا توجد فئات</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.id} className={`${!category.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getCategoryIcon(category.icon)}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{category.name}</h3>
                        <Badge
                          variant="outline"
                          className={category.is_active ? 'text-green-600 border-green-200' : 'text-gray-500 border-gray-200'}
                        >
                          {category.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                    )}
                    
                    {/* إحصائيات */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-semibold text-blue-600">{category.active_products || 0}</div>
                        <div className="text-blue-500">منتج نشط</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-semibold text-green-600">{category.total_stock || 0}</div>
                        <div className="text-green-500">قطعة في المخزون</div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(category.id, category.name)}
                        className="flex-1"
                      >
                        {category.is_active ? <EyeOff className="w-4 h-4 ml-1" /> : <Eye className="w-4 h-4 ml-1" />}
                        {category.is_active ? 'إخفاء' : 'إظهار'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id, category.name, (category.active_products || 0) > 0)}
                        className="text-red-600 hover:text-red-700"
                        disabled={(category.active_products || 0) > 0}
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

export default Categories;
