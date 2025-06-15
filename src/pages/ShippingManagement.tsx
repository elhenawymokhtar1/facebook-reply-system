import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useShipping } from "@/hooks/useShipping";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Package,
  Search,
  Filter,
  Globe,
  Zap,
  Timer
} from 'lucide-react';

const ShippingManagement = () => {
  const {
    shippingMethods,
    shippingZones,
    isLoading,
    createShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
    createShippingZone,
    getShippingStats,
    searchShippingMethods,
    isCreating,
    isUpdating,
    isDeleting
  } = useShipping();

  const { toast } = useToast();
  const [showAddMethodForm, setShowAddMethodForm] = useState(false);
  const [showAddZoneForm, setShowAddZoneForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // بيانات طريقة الشحن الجديدة
  const [newMethod, setNewMethod] = useState({
    name: '',
    description: '',
    type: 'flat_rate',
    base_cost: '',
    cost_per_kg: '',
    free_shipping_threshold: '',
    estimated_days_min: '',
    estimated_days_max: '',
    zones: [],
    is_active: true
  });

  // بيانات المنطقة الجديدة
  const [newZone, setNewZone] = useState({
    name: '',
    description: '',
    cities: '',
    additional_cost: '',
    is_active: true
  });

  const stats = getShippingStats();
  const filteredMethods = searchShippingMethods(searchTerm, activeFilter);

  // إضافة طريقة شحن جديدة
  const handleAddMethod = async () => {
    if (!newMethod.name || !newMethod.base_cost) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const methodData = {
      name: newMethod.name,
      description: newMethod.description,
      type: newMethod.type,
      base_cost: parseFloat(newMethod.base_cost),
      cost_per_kg: newMethod.cost_per_kg ? parseFloat(newMethod.cost_per_kg) : 0,
      free_shipping_threshold: newMethod.free_shipping_threshold ? parseFloat(newMethod.free_shipping_threshold) : null,
      estimated_days_min: parseInt(newMethod.estimated_days_min) || 1,
      estimated_days_max: parseInt(newMethod.estimated_days_max) || 3,
      zones: newMethod.zones,
      is_active: newMethod.is_active
    };

    await createShippingMethod(methodData);

    // إعادة تعيين النموذج
    setNewMethod({
      name: '',
      description: '',
      type: 'flat_rate',
      base_cost: '',
      cost_per_kg: '',
      free_shipping_threshold: '',
      estimated_days_min: '',
      estimated_days_max: '',
      zones: [],
      is_active: true
    });
    setShowAddMethodForm(false);
  };

  // إضافة منطقة شحن جديدة
  const handleAddZone = async () => {
    if (!newZone.name || !newZone.cities) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const zoneData = {
      name: newZone.name,
      description: newZone.description,
      cities: newZone.cities.split(',').map(city => city.trim()),
      additional_cost: newZone.additional_cost ? parseFloat(newZone.additional_cost) : 0,
      is_active: newZone.is_active
    };

    await createShippingZone(zoneData);

    // إعادة تعيين النموذج
    setNewZone({
      name: '',
      description: '',
      cities: '',
      additional_cost: '',
      is_active: true
    });
    setShowAddZoneForm(false);
  };

  // حذف طريقة شحن
  const handleDeleteMethod = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف طريقة الشحن "${name}"؟`)) return;
    await deleteShippingMethod(id);
  };

  // الحصول على أيقونة نوع الشحن
  const getShippingTypeIcon = (type: string) => {
    switch (type) {
      case 'express': return <Zap className="w-4 h-4" />;
      case 'same_day': return <Timer className="w-4 h-4" />;
      case 'standard': return <Truck className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  // الحصول على نص نوع الشحن
  const getShippingTypeText = (type: string) => {
    switch (type) {
      case 'flat_rate': return 'سعر ثابت';
      case 'weight_based': return 'حسب الوزن';
      case 'distance_based': return 'حسب المسافة';
      case 'express': return 'شحن سريع';
      case 'same_day': return 'نفس اليوم';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">جاري تحميل بيانات الشحن...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الشحن</h1>
          <p className="text-gray-600 mt-2">إدارة طرق الشحن والمناطق</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAddZoneForm(true)}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <MapPin className="w-4 h-4 ml-2" />
            إضافة منطقة
          </Button>
          <Button
            onClick={() => setShowAddMethodForm(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة طريقة شحن
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">طرق الشحن</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMethods}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">المناطق المغطاة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalZones}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-orange-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">متوسط تكلفة الشحن</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageCost} ج</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">متوسط وقت التوصيل</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageDeliveryTime} يوم</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلاتر */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في طرق الشحن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="md:w-48">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الطرق</option>
                <option value="active">نشطة</option>
                <option value="inactive">غير نشطة</option>
                <option value="express">شحن سريع</option>
                <option value="standard">شحن عادي</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة طريقة شحن */}
      {showAddMethodForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>إضافة طريقة شحن جديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم طريقة الشحن *
                </label>
                <Input
                  value={newMethod.name}
                  onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
                  placeholder="شحن سريع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الشحن *
                </label>
                <select
                  value={newMethod.type}
                  onChange={(e) => setNewMethod({...newMethod, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="flat_rate">سعر ثابت</option>
                  <option value="weight_based">حسب الوزن</option>
                  <option value="distance_based">حسب المسافة</option>
                  <option value="express">شحن سريع</option>
                  <option value="same_day">نفس اليوم</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التكلفة الأساسية (ج) *
                </label>
                <Input
                  type="number"
                  value={newMethod.base_cost}
                  onChange={(e) => setNewMethod({...newMethod, base_cost: e.target.value})}
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تكلفة إضافية لكل كيلو (ج)
                </label>
                <Input
                  type="number"
                  value={newMethod.cost_per_kg}
                  onChange={(e) => setNewMethod({...newMethod, cost_per_kg: e.target.value})}
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حد الشحن المجاني (ج)
                </label>
                <Input
                  type="number"
                  value={newMethod.free_shipping_threshold}
                  onChange={(e) => setNewMethod({...newMethod, free_shipping_threshold: e.target.value})}
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وقت التوصيل المتوقع
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newMethod.estimated_days_min}
                    onChange={(e) => setNewMethod({...newMethod, estimated_days_min: e.target.value})}
                    placeholder="1"
                  />
                  <span className="flex items-center px-2">إلى</span>
                  <Input
                    type="number"
                    value={newMethod.estimated_days_max}
                    onChange={(e) => setNewMethod({...newMethod, estimated_days_max: e.target.value})}
                    placeholder="3"
                  />
                  <span className="flex items-center px-2">يوم</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <Textarea
                  value={newMethod.description}
                  onChange={(e) => setNewMethod({...newMethod, description: e.target.value})}
                  placeholder="وصف طريقة الشحن..."
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMethod.is_active}
                    onChange={(e) => setNewMethod({...newMethod, is_active: e.target.checked})}
                    className="ml-2"
                  />
                  طريقة شحن نشطة
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleAddMethod}
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? 'جاري الإضافة...' : 'إضافة طريقة الشحن'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddMethodForm(false)}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نموذج إضافة منطقة شحن */}
      {showAddZoneForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>إضافة منطقة شحن جديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المنطقة *
                </label>
                <Input
                  value={newZone.name}
                  onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                  placeholder="القاهرة الكبرى"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تكلفة إضافية (ج)
                </label>
                <Input
                  type="number"
                  value={newZone.additional_cost}
                  onChange={(e) => setNewZone({...newZone, additional_cost: e.target.value})}
                  placeholder="20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدن المشمولة *
                </label>
                <Input
                  value={newZone.cities}
                  onChange={(e) => setNewZone({...newZone, cities: e.target.value})}
                  placeholder="القاهرة، الجيزة، القليوبية"
                />
                <p className="text-sm text-gray-500 mt-1">اكتب أسماء المدن مفصولة بفاصلة</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <Textarea
                  value={newZone.description}
                  onChange={(e) => setNewZone({...newZone, description: e.target.value})}
                  placeholder="وصف المنطقة..."
                  rows={2}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newZone.is_active}
                    onChange={(e) => setNewZone({...newZone, is_active: e.target.checked})}
                    className="ml-2"
                  />
                  منطقة نشطة
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleAddZone}
                disabled={isCreating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? 'جاري الإضافة...' : 'إضافة المنطقة'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddZoneForm(false)}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة طرق الشحن */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMethods.length > 0 ? (
          filteredMethods.map((method) => (
            <Card key={method.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getShippingTypeIcon(method.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={method.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {method.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                    <Badge variant="outline">
                      {getShippingTypeText(method.type)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">التكلفة الأساسية</p>
                    <p className="font-medium text-green-600">{method.base_cost} ج</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">تكلفة إضافية/كيلو</p>
                    <p className="font-medium">{method.cost_per_kg || 0} ج</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">شحن مجاني فوق</p>
                    <p className="font-medium">
                      {method.free_shipping_threshold ? `${method.free_shipping_threshold} ج` : 'غير محدد'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">وقت التوصيل</p>
                    <p className="font-medium">
                      {method.estimated_days_min}-{method.estimated_days_max} يوم
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMethod(method)}
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteMethod(method.id, method.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد طرق شحن</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || activeFilter !== 'all'
                  ? 'لا توجد طرق شحن تطابق البحث'
                  : 'لم يتم إنشاء أي طرق شحن بعد'
                }
              </p>
              {!searchTerm && activeFilter === 'all' && (
                <Button onClick={() => setShowAddMethodForm(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة أول طريقة شحن
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShippingManagement;