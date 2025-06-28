import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Store, Edit, Save, Globe, Mail, Phone, MapPin, Building, Power, PowerOff } from 'lucide-react';
import {
  getCompanyStore,
  updateCompanyStore,
  ensureCompanyHasStore,
  CompanyStore
} from '@/utils/companyStoreUtils';
import { supabase } from '@/lib/supabase';

interface StoreFormData {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  logo_url: string;
}

const StoreManagement: React.FC = () => {
  const { toast } = useToast();
  const { company } = useCurrentCompany();
  const [store, setStore] = useState<CompanyStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [storeForm, setStoreForm] = useState<StoreFormData>({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    logo_url: ''
  });

  // جلب متجر الشركة الوحيد
  const fetchCompanyStore = async () => {
    try {
      setLoading(true);

      if (!company?.id) {
        console.warn('لا توجد شركة محددة');
        setStore(null);
        return;
      }

      console.log('🔍 بيانات الشركة الحالية:', {
        id: company.id,
        name: company.name,
        email: company.email
      });

      // محاولة البحث عن الشركة بالاسم إذا كان المعرف غير صحيح
      let actualCompanyId = company.id;

      // التحقق من صحة معرف الشركة
      const { data: companyCheck } = await supabase
        .from('companies')
        .select('id, name, email')
        .eq('id', company.id)
        .single();

      if (!companyCheck) {
        console.warn('⚠️ معرف الشركة غير صحيح، البحث بالاسم...');
        // البحث بالاسم
        const { data: companyByName } = await supabase
          .from('companies')
          .select('id, name, email')
          .eq('name', company.name)
          .single();

        if (companyByName) {
          actualCompanyId = companyByName.id;
          console.log('✅ تم العثور على الشركة بالاسم:', companyByName);
        } else {
          console.error('❌ لم يتم العثور على الشركة');
          toast({
            title: "خطأ",
            description: "لم يتم العثور على بيانات الشركة",
            variant: "destructive",
          });
          return;
        }
      }

      // التأكد من وجود متجر للشركة وإنشاؤه إذا لم يكن موجوداً
      const companyStore = await ensureCompanyHasStore(
        actualCompanyId,
        company.name,
        company.email
      );

      if (companyStore) {
        console.log('✅ تم جلب/إنشاء المتجر بنجاح:', companyStore);
        setStore(companyStore);
        // تحديث النموذج ببيانات المتجر
        setStoreForm({
          name: companyStore.name || '',
          description: companyStore.description || '',
          phone: companyStore.phone || '',
          email: companyStore.email || '',
          address: companyStore.address || '',
          website: companyStore.website || '',
          logo_url: companyStore.logo_url || ''
        });
      } else {
        console.error('❌ فشل في إنشاء أو جلب متجر الشركة');
        toast({
          title: "خطأ",
          description: "فشل في إنشاء أو جلب متجر الشركة",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب بيانات المتجر",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // تحديث بيانات المتجر
  const saveStoreChanges = async () => {
    try {
      setSaving(true);

      // التحقق من صحة البيانات
      if (!storeForm.name?.trim()) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال اسم المتجر",
          variant: "destructive",
        });
        return;
      }

      if (!company?.id) {
        toast({
          title: "خطأ",
          description: "لا توجد شركة محددة",
          variant: "destructive",
        });
        return;
      }

      // تحديث بيانات المتجر
      const updateData = {
        name: storeForm.name.trim(),
        description: storeForm.description?.trim() || null,
        phone: storeForm.phone?.trim() || null,
        email: storeForm.email?.trim() || null,
        address: storeForm.address?.trim() || null,
        website: storeForm.website?.trim() || null,
        logo_url: storeForm.logo_url?.trim() || null,
      };

      const updatedStore = await updateCompanyStore(company.id, updateData);

      if (updatedStore) {
        setStore(updatedStore);
        setEditing(false);
        toast({
          title: "نجح",
          description: "تم تحديث بيانات المتجر بنجاح",
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في تحديث بيانات المتجر",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "خطأ",
        description: `حدث خطأ غير متوقع: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // إلغاء التعديل والعودة للبيانات الأصلية
  const cancelEditing = () => {
    if (store) {
      setStoreForm({
        name: store.name || '',
        description: store.description || '',
        phone: store.phone || '',
        email: store.email || '',
        address: store.address || '',
        website: store.website || '',
        logo_url: store.logo_url || ''
      });
    }
    setEditing(false);
  };

  // بدء التعديل
  const startEditing = () => {
    setEditing(true);
  };

  // تفعيل/إلغاء تفعيل المتجر
  const toggleStoreStatus = async () => {
    if (!store || !company?.id) return;

    try {
      setSaving(true);

      const newStatus = !store.is_active;
      const updatedStore = await updateCompanyStore(company.id, { is_active: newStatus });

      if (updatedStore) {
        setStore(updatedStore);
        toast({
          title: "نجح",
          description: `تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} المتجر بنجاح`,
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في تحديث حالة المتجر",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة المتجر:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث حالة المتجر",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (company?.id) {
      fetchCompanyStore();
    }
  }, [company?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">جاري تحميل المتاجر...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">يرجى تحديد شركة أولاً</p>
        </div>
      </div>
    );
  }

  // Debug info
  console.log('Store Management Debug:', {
    store,
    editing,
    loading,
    company: company?.name,
    storeActive: store?.is_active
  });

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إعدادات المتجر</h1>
          <p className="text-gray-600 mt-2">إدارة بيانات متجر شركة {company.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={store?.is_active ? "default" : "secondary"}>
            {store?.is_active ? 'متجر نشط' : 'متجر معطل'}
          </Badge>
          {!editing && store && (
            <div className="flex gap-2">
              <Button
                onClick={startEditing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Edit className="w-4 h-4 ml-2" />
                تعديل البيانات
              </Button>
              <Button
                onClick={toggleStoreStatus}
                variant={store?.is_active ? "destructive" : "default"}
                disabled={saving}
                className={store?.is_active ? "" : "bg-green-600 hover:bg-green-700 text-white"}
              >
                {store?.is_active ? (
                  <>
                    <PowerOff className="w-4 h-4 ml-2" />
                    إلغاء التفعيل
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 ml-2" />
                    تفعيل المتجر
                  </>
                )}
              </Button>
            </div>
          )}
          {!store && !loading && (
            <div className="flex items-center gap-2">
              <div className="text-red-600 text-sm">
                لا يوجد متجر للشركة {company?.name}
              </div>
              <Button
                onClick={fetchCompanyStore}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                إنشاء متجر
              </Button>
            </div>
          )}
          {loading && (
            <div className="text-blue-600 text-sm">
              جاري تحميل بيانات المتجر...
            </div>
          )}
        </div>
      </div>

      {/* معلومات المتجر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Store className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">1</p>
                <p className="text-gray-600">متجر واحد</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{company.name}</p>
                <p className="text-gray-600">الشركة المالكة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 ${store?.is_active ? 'bg-green-100' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                <div className={`w-4 h-4 ${store?.is_active ? 'bg-green-600' : 'bg-gray-600'} rounded-full`}></div>
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">
                  {store?.is_active ? 'نشط' : 'معطل'}
                </p>
                <p className="text-gray-600">حالة المتجر</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نموذج تعديل المتجر */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {editing ? 'تعديل بيانات المتجر' : 'بيانات المتجر'}
          </CardTitle>
          <CardDescription>
            {editing ? 'قم بتعديل البيانات وحفظ التغييرات' : 'عرض بيانات المتجر الحالية'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المتجر *
              </label>
              <Input
                value={storeForm.name}
                onChange={(e) => setStoreForm({...storeForm, name: e.target.value})}
                placeholder="اسم المتجر"
                disabled={!editing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={storeForm.email}
                onChange={(e) => setStoreForm({...storeForm, email: e.target.value})}
                placeholder="store@example.com"
                disabled={!editing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <Input
                value={storeForm.phone}
                onChange={(e) => setStoreForm({...storeForm, phone: e.target.value})}
                placeholder="+20 123 456 7890"
                disabled={!editing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الموقع الإلكتروني
              </label>
              <Input
                value={storeForm.website}
                onChange={(e) => setStoreForm({...storeForm, website: e.target.value})}
                placeholder="https://example.com"
                disabled={!editing}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <Textarea
                value={storeForm.description}
                onChange={(e) => setStoreForm({...storeForm, description: e.target.value})}
                placeholder="وصف المتجر..."
                rows={3}
                disabled={!editing}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <Textarea
                value={storeForm.address}
                onChange={(e) => setStoreForm({...storeForm, address: e.target.value})}
                placeholder="عنوان المتجر..."
                rows={2}
                disabled={!editing}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الشعار
              </label>
              <Input
                value={storeForm.logo_url}
                onChange={(e) => setStoreForm({...storeForm, logo_url: e.target.value})}
                placeholder="https://example.com/logo.png"
                disabled={!editing}
              />
            </div>
          </div>

          {editing && (
            <div className="flex gap-4 mt-6">
              <Button
                onClick={saveStoreChanges}
                className="bg-green-600 hover:bg-green-700"
                disabled={saving}
              >
                <Save className="w-4 h-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
              <Button
                variant="outline"
                onClick={cancelEditing}
                disabled={saving}
              >
                إلغاء
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      {store && (
        <Card>
          <CardHeader>
            <CardTitle>معلومات المتجر</CardTitle>
            <CardDescription>تفاصيل إضافية عن المتجر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">معلومات الاتصال</h4>
                <div className="space-y-2">
                  {store.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 ml-2" />
                      <a href={`mailto:${store.email}`} className="text-blue-600 hover:underline">
                        {store.email}
                      </a>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 ml-2" />
                      <a href={`tel:${store.phone}`} className="text-blue-600 hover:underline">
                        {store.phone}
                      </a>
                    </div>
                  )}
                  {store.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="w-4 h-4 ml-2" />
                      <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {store.website}
                      </a>
                    </div>
                  )}
                  {store.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 ml-2" />
                      {store.address}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">معلومات النظام</h4>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>معرف المتجر:</strong> {store.id}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>تاريخ الإنشاء:</strong> {new Date(store.created_at).toLocaleDateString('ar-EG')}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>الحالة:</strong>
                    <Badge variant={store.is_active ? "default" : "secondary"} className="mr-2">
                      {store.is_active ? 'نشط' : 'معطل'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info - سيتم إزالته لاحقاً */}
      <Card className="mt-6 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">معلومات التشخيص</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1">
            <div><strong>الشركة:</strong> {company?.name} (ID: {company?.id})</div>
            <div><strong>المتجر:</strong> {store?.name || 'غير موجود'} (ID: {store?.id || 'غير موجود'})</div>
            <div><strong>حالة التحميل:</strong> {loading ? 'جاري التحميل' : 'مكتمل'}</div>
            <div><strong>حالة التعديل:</strong> {editing ? 'في وضع التعديل' : 'في وضع العرض'}</div>
            <div><strong>حالة المتجر:</strong> {store?.is_active ? 'نشط' : 'معطل'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreManagement;
