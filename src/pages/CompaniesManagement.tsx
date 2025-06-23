/**
 * 🏢 صفحة إدارة الشركات (للمستخدم الأساسي)
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building, 
  Users, 
  Search, 
  Filter,
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Calendar,
  MapPin,
  Crown,
  ArrowLeft,
  Plus,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  subscription?: {
    plan: {
      name: string;
      price_monthly: number;
    };
    status: string;
    expires_at: string;
  };
  users_count: number;
  last_activity?: string;
}

const CompaniesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // إحصائيات سريعة
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0
  });

  useEffect(() => {
    // التحقق من تسجيل دخول المستخدم الأساسي
    const adminData = localStorage.getItem('superAdmin');
    if (!adminData) {
      navigate('/super-admin-login');
      return;
    }

    loadCompanies();
  }, [navigate]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3002/api/subscriptions/admin/companies');
      const result = await response.json();

      if (result.success) {
        const companiesData = result.data || [];
        setCompanies(companiesData);
        
        // حساب الإحصائيات
        const stats = {
          total: companiesData.length,
          active: companiesData.filter((c: Company) => c.status === 'active').length,
          inactive: companiesData.filter((c: Company) => c.status === 'inactive').length,
          suspended: companiesData.filter((c: Company) => c.status === 'suspended').length
        };
        setStats(stats);
      } else {
        toast.error('فشل في تحميل الشركات');
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('حدث خطأ في تحميل الشركات');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (companyId: string, newStatus: string) => {
    try {
      // API call لتحديث حالة الشركة
      const response = await fetch(`http://localhost:3002/api/subscriptions/admin/companies/${companyId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`تم تحديث حالة الشركة إلى ${getStatusName(newStatus)}`);
        loadCompanies(); // إعادة تحميل البيانات
      } else {
        toast.error(result.error || 'فشل في تحديث حالة الشركة');
      }
    } catch (error) {
      console.error('Error updating company status:', error);
      toast.error('حدث خطأ في تحديث حالة الشركة');
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'suspended': return 'معلق';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'suspended':
        return <Badge variant="destructive">معلق</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'suspended':
        return <Ban className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // تصفية الشركات
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.city && company.city.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الشركات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط التنقل */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/super-admin-dashboard')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة للوحة التحكم
            </Button>
            
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              إدارة الشركات
            </h1>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  // يمكن إضافة صفحة إضافة شركة جديدة
                  toast.info('صفحة إضافة شركة جديدة قيد التطوير');
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة شركة
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي الشركات</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">الشركات النشطة</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">غير النشطة</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ban className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">المعلقة</p>
                  <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* شريط البحث والتصفية */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في الشركات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="تصفية بالحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* قائمة الشركات */}
        <Card>
          <CardHeader>
            <CardTitle>الشركات المسجلة ({filteredCompanies.length})</CardTitle>
            <CardDescription>
              إدارة ومراقبة جميع الشركات في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCompanies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'لا توجد شركات مطابقة للبحث' 
                    : 'لا توجد شركات مسجلة حتى الآن'
                  }
                </div>
              ) : (
                filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-lg">{company.name}</h3>
                          {getStatusIcon(company.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            <span>{company.email}</span>
                          </div>
                          {company.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {company.city && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{company.city}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>تاريخ التسجيل: {new Date(company.created_at).toLocaleDateString('ar')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getStatusBadge(company.status)}
                      
                      {company.subscription?.plan && (
                        <Badge variant="outline" className="flex items-center">
                          <Crown className="h-3 w-3 mr-1" />
                          {company.subscription.plan.name}
                        </Badge>
                      )}
                      
                      <div className="text-sm text-gray-500 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {company.users_count || 0}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Select
                          value={company.status}
                          onValueChange={(newStatus) => handleStatusChange(company.id, newStatus)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="inactive">غير نشط</SelectItem>
                            <SelectItem value="suspended">معلق</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نافذة تفاصيل الشركة */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              تفاصيل الشركة
            </DialogTitle>
          </DialogHeader>
          
          {selectedCompany && (
            <div className="space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">اسم الشركة</Label>
                  <p className="text-lg font-semibold">{selectedCompany.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">الحالة</Label>
                  <div className="mt-1">{getStatusBadge(selectedCompany.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">البريد الإلكتروني</Label>
                  <p>{selectedCompany.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">رقم الهاتف</Label>
                  <p>{selectedCompany.phone || 'غير محدد'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">الموقع الإلكتروني</Label>
                  <p>{selectedCompany.website || 'غير محدد'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">المدينة</Label>
                  <p>{selectedCompany.city || 'غير محدد'}</p>
                </div>
              </div>

              {/* معلومات الاشتراك */}
              {selectedCompany.subscription && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Crown className="h-4 w-4 mr-2" />
                    معلومات الاشتراك
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">الخطة</Label>
                      <p>{selectedCompany.subscription.plan.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">السعر الشهري</Label>
                      <p>${selectedCompany.subscription.plan.price_monthly}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* إحصائيات */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  الإحصائيات
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-600">{selectedCompany.users_count || 0}</p>
                    <p className="text-sm text-gray-600">المستخدمين</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Calendar className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-bold text-green-600">
                      {new Date(selectedCompany.created_at).toLocaleDateString('ar')}
                    </p>
                    <p className="text-sm text-gray-600">تاريخ التسجيل</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Building className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm font-bold text-purple-600">نشط</p>
                    <p className="text-sm text-gray-600">الحالة</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل الشركة */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              تعديل بيانات الشركة
            </DialogTitle>
            <DialogDescription>
              تحديث معلومات الشركة الأساسية
            </DialogDescription>
          </DialogHeader>

          {selectedCompany && (
            <EditCompanyForm
              company={selectedCompany}
              onSave={(updatedCompany) => {
                // تحديث الشركة في القائمة
                setCompanies(prev => prev.map(c =>
                  c.id === updatedCompany.id ? updatedCompany : c
                ));
                setIsEditDialogOpen(false);
                toast.success('تم تحديث بيانات الشركة بنجاح');
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// مكون نموذج تعديل الشركة
interface EditCompanyFormProps {
  company: Company;
  onSave: (company: Company) => void;
  onCancel: () => void;
}

const EditCompanyForm: React.FC<EditCompanyFormProps> = ({ company, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: company.name,
    email: company.email,
    phone: company.phone || '',
    website: company.website || '',
    address: company.address || '',
    city: company.city || '',
    country: company.country || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3002/api/subscriptions/admin/companies/${company.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onSave({ ...company, ...formData });
      } else {
        toast.error(result.error || 'فشل في تحديث بيانات الشركة');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('حدث خطأ في تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">اسم الشركة *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">البريد الإلكتروني *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">رقم الهاتف</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="website">الموقع الإلكتروني</Label>
        <Input
          id="website"
          value={formData.website}
          onChange={(e) => setFormData({...formData, website: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="city">المدينة</Label>
        <Input
          id="city"
          value={formData.city}
          onChange={(e) => setFormData({...formData, city: e.target.value})}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>
    </form>
  );
};

export default CompaniesManagement;
