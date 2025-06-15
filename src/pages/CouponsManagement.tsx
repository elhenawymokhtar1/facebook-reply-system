import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCoupons } from "@/hooks/useCoupons";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Percent, 
  DollarSign, 
  Calendar,
  Users,
  TrendingUp,
  Search,
  Filter,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

const CouponsManagement = () => {
  const { 
    coupons, 
    isLoading, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon,
    getCouponsStats,
    searchCoupons,
    isCreating,
    isUpdating,
    isDeleting
  } = useCoupons();
  
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // بيانات الكوبون الجديد
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    type: 'percentage',
    amount: '',
    minimum_amount: '',
    usage_limit: '',
    expires_at: '',
    is_active: true
  });

  const stats = getCouponsStats();
  const filteredCoupons = searchCoupons(searchTerm, statusFilter, typeFilter);

  // إنشاء كود كوبون عشوائي
  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCoupon({...newCoupon, code: result});
  };

  // إضافة كوبون جديد
  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const couponData = {
      code: newCoupon.code.toUpperCase(),
      description: newCoupon.description,
      type: newCoupon.type,
      amount: parseFloat(newCoupon.amount),
      minimum_amount: newCoupon.minimum_amount ? parseFloat(newCoupon.minimum_amount) : null,
      usage_limit: newCoupon.usage_limit ? parseInt(newCoupon.usage_limit) : null,
      expires_at: newCoupon.expires_at || null,
      is_active: newCoupon.is_active
    };

    await createCoupon(couponData);
    
    // إعادة تعيين النموذج
    setNewCoupon({
      code: '',
      description: '',
      type: 'percentage',
      amount: '',
      minimum_amount: '',
      usage_limit: '',
      expires_at: '',
      is_active: true
    });
    setShowAddForm(false);
  };

  // تعديل كوبون
  const handleEditCoupon = async () => {
    if (!editingCoupon) return;

    const couponData = {
      description: editingCoupon.description,
      type: editingCoupon.type,
      amount: parseFloat(editingCoupon.amount),
      minimum_amount: editingCoupon.minimum_amount ? parseFloat(editingCoupon.minimum_amount) : null,
      usage_limit: editingCoupon.usage_limit ? parseInt(editingCoupon.usage_limit) : null,
      expires_at: editingCoupon.expires_at || null,
      is_active: editingCoupon.is_active
    };

    await updateCoupon({ id: editingCoupon.id, updates: couponData });
    setEditingCoupon(null);
  };

  // حذف كوبون
  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`هل أنت متأكد من حذف الكوبون ${code}؟`)) return;
    await deleteCoupon(id);
  };

  // نسخ كود الكوبون
  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "تم النسخ",
      description: `تم نسخ كود الكوبون: ${code}`,
    });
  };

  // تبديل حالة الكوبون
  const toggleCouponStatus = async (coupon: any) => {
    await updateCoupon({ 
      id: coupon.id, 
      updates: { is_active: !coupon.is_active } 
    });
  };

  // الحصول على نوع الخصم
  const getDiscountTypeText = (type: string) => {
    switch (type) {
      case 'percentage': return 'نسبة مئوية';
      case 'fixed_cart': return 'مبلغ ثابت';
      case 'fixed_product': return 'خصم على المنتج';
      case 'free_shipping': return 'شحن مجاني';
      default: return type;
    }
  };

  // الحصول على لون الحالة
  const getStatusColor = (coupon: any) => {
    if (!coupon.is_active) return 'bg-gray-100 text-gray-800';
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return 'bg-red-100 text-red-800';
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  // الحصول على نص الحالة
  const getStatusText = (coupon: any) => {
    if (!coupon.is_active) return 'غير نشط';
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return 'منتهي الصلاحية';
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return 'مستنفد';
    return 'نشط';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">جاري تحميل الكوبونات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الكوبونات</h1>
          <p className="text-gray-600 mt-2">إنشاء وإدارة كوبونات الخصم</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة كوبون جديد
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tag className="w-8 h-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الكوبونات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">كوبونات نشطة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الاستخدامات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsage}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-orange-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الخصومات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSavings} ج</p>
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
                  placeholder="البحث في الكوبونات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="expired">منتهي الصلاحية</option>
              </select>
            </div>

            <div className="md:w-48">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value="percentage">نسبة مئوية</option>
                <option value="fixed_cart">مبلغ ثابت</option>
                <option value="fixed_product">خصم على المنتج</option>
                <option value="free_shipping">شحن مجاني</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة كوبون */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>إضافة كوبون جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كود الكوبون *
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                    placeholder="SAVE20"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateCouponCode}
                  >
                    توليد
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الخصم *
                </label>
                <select
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed_cart">مبلغ ثابت (ج)</option>
                  <option value="fixed_product">خصم على المنتج</option>
                  <option value="free_shipping">شحن مجاني</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  قيمة الخصم *
                </label>
                <Input
                  type="number"
                  value={newCoupon.amount}
                  onChange={(e) => setNewCoupon({...newCoupon, amount: e.target.value})}
                  placeholder={newCoupon.type === 'percentage' ? '20' : '100'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحد الأدنى للطلب
                </label>
                <Input
                  type="number"
                  value={newCoupon.minimum_amount}
                  onChange={(e) => setNewCoupon({...newCoupon, minimum_amount: e.target.value})}
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حد الاستخدام
                </label>
                <Input
                  type="number"
                  value={newCoupon.usage_limit}
                  onChange={(e) => setNewCoupon({...newCoupon, usage_limit: e.target.value})}
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الانتهاء
                </label>
                <Input
                  type="datetime-local"
                  value={newCoupon.expires_at}
                  onChange={(e) => setNewCoupon({...newCoupon, expires_at: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <Textarea
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({...newCoupon, description: e.target.value})}
                  placeholder="وصف الكوبون..."
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCoupon.is_active}
                    onChange={(e) => setNewCoupon({...newCoupon, is_active: e.target.checked})}
                    className="ml-2"
                  />
                  كوبون نشط
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button 
                onClick={handleAddCoupon} 
                disabled={isCreating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isCreating ? 'جاري الإضافة...' : 'إضافة الكوبون'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة الكوبونات */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCoupons.length > 0 ? (
          filteredCoupons.map((coupon) => (
            <Card key={coupon.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Tag className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-gray-900">{coupon.code}</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyCouponCode(coupon.code)}
                          className="p-1"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">{coupon.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(coupon)}>
                      {getStatusText(coupon)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleCouponStatus(coupon)}
                      className="p-1"
                    >
                      {coupon.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">نوع الخصم</p>
                    <p className="font-medium">{getDiscountTypeText(coupon.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">قيمة الخصم</p>
                    <p className="font-medium text-green-600">
                      {coupon.type === 'percentage' ? `${coupon.amount}%` : `${coupon.amount} ج`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">الاستخدامات</p>
                    <p className="font-medium">
                      {coupon.used_count} / {coupon.usage_limit || '∞'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ينتهي في</p>
                    <p className="font-medium">
                      {coupon.expires_at 
                        ? new Date(coupon.expires_at).toLocaleDateString('ar-EG')
                        : 'لا ينتهي'
                      }
                    </p>
                  </div>
                </div>

                {coupon.minimum_amount && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-700">
                      <strong>الحد الأدنى للطلب:</strong> {coupon.minimum_amount} ج
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingCoupon(coupon)}
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
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
              <Tag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد كوبونات</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'لا توجد كوبونات تطابق البحث'
                  : 'لم يتم إنشاء أي كوبونات بعد'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة أول كوبون
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CouponsManagement;
