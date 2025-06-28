/**
 * 👑 جدول الشركات للمدير الأساسي مع ميزة "دخول كـ"
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  LogIn,
  Mail,
  Phone,
  Calendar,
  Users,
  Crown,
  Loader2,
  Eye,
  Activity
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  last_login_at?: string;
  company_subscriptions?: {
    id: string;
    status: string;
    end_date: string;
    subscription_plans: {
      name: string;
    };
  }[];
}

interface SuperAdminCompaniesTableProps {
  superAdminId: string;
}

const SuperAdminCompaniesTable: React.FC<SuperAdminCompaniesTableProps> = ({
  superAdminId
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginAsLoading, setLoginAsLoading] = useState<string | null>(null);

  // جلب قائمة الشركات
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3002/api/subscriptions/admin/companies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        setCompanies(result.data);
      } else {
        toast({
          title: "خطأ",
          description: "فشل في جلب قائمة الشركات",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('خطأ في جلب الشركات:', error);
      toast({
        title: "خطأ",
        description: "خطأ في الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الدخول كشركة
  const handleLoginAsCompany = async (companyId: string, companyName: string) => {
    try {
      setLoginAsLoading(companyId);
      
      const response = await fetch('http://localhost:3002/api/subscriptions/admin/login-as-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          superAdminId,
          companyId
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // حفظ بيانات الشركة مع معلومات المدير الأساسي
        localStorage.setItem('company', JSON.stringify(result.data.company));
        localStorage.setItem('superAdminSession', JSON.stringify({
          superAdmin: result.data.superAdmin,
          originalLoginType: 'super_admin_as_company',
          loginAsCompany: true
        }));
        
        toast({
          title: "نجح",
          description: `تم تسجيل الدخول كشركة ${companyName} 👑`,
        });

        // الانتقال للوحة تحكم الشركة
        navigate('/company-dashboard');
      } else {
        toast({
          title: "خطأ",
          description: result.message || 'فشل في تسجيل الدخول كشركة',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول كشركة:', error);
      toast({
        title: "خطأ",
        description: "خطأ في الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setLoginAsLoading(null);
    }
  };

  // تحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // تحديد لون حالة الاشتراك
  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="mr-2">جاري تحميل الشركات...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          إدارة الشركات ({companies.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <TableHead className="font-bold text-gray-800 py-4 w-[250px]">🏢 الشركة</TableHead>
                <TableHead className="font-bold text-gray-800 py-4 w-[200px]">📞 معلومات الاتصال</TableHead>
                <TableHead className="font-bold text-gray-800 py-4 text-center w-[120px]">📊 الحالة</TableHead>
                <TableHead className="font-bold text-gray-800 py-4 text-center w-[180px]">💳 الاشتراك</TableHead>
                <TableHead className="font-bold text-gray-800 py-4 text-center w-[200px]">📅 التواريخ</TableHead>
                <TableHead className="font-bold text-gray-800 py-4 text-center w-[160px]">⚙️ الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} className="hover:bg-blue-50 transition-all duration-200 border-b border-gray-100">
                  {/* عمود الشركة */}
                  <TableCell className="py-4 w-[250px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{company.name}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          ID: {company.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* عمود معلومات الاتصال */}
                  <TableCell className="py-4 w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-700">{company.email}</span>
                      </div>
                      {company.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span className="text-gray-700">{company.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* عمود الحالة */}
                  <TableCell className="py-4 text-center w-[120px]">
                    <Badge className={getStatusColor(company.status)}>
                      {company.status === 'active' ? '✅ نشط' :
                       company.status === 'suspended' ? '🚫 معلق' :
                       company.status === 'cancelled' ? '❌ ملغي' : company.status}
                    </Badge>
                  </TableCell>

                  {/* عمود الاشتراك */}
                  <TableCell className="py-4 text-center w-[180px]">
                    {company.company_subscriptions && company.company_subscriptions.length > 0 ? (
                      <div className="space-y-2">
                        <Badge className={getSubscriptionStatusColor(company.company_subscriptions[0].status)}>
                          {company.company_subscriptions[0].subscription_plans?.name || 'خطة غير محددة'}
                        </Badge>
                        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          📅 ينتهي: {formatDate(company.company_subscriptions[0].end_date)}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100">
                        ❌ لا يوجد اشتراك
                      </Badge>
                    )}
                  </TableCell>

                  {/* عمود التواريخ */}
                  <TableCell className="py-4 text-center w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-700">التسجيل</div>
                          <div className="text-xs text-gray-500">{formatDate(company.created_at)}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="font-medium text-gray-700">آخر دخول</div>
                          <div className="text-xs text-gray-500">
                            {company.last_login_at ? formatDate(company.last_login_at) : 'لم يسجل دخول'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* عمود الإجراءات */}
                  <TableCell className="py-4 w-[160px]">
                    <div className="flex flex-col gap-2">
                      {/* زر عرض التفاصيل */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('🔗 تم الضغط على زر عرض التفاصيل');
                          console.log('🏢 معرف الشركة:', company.id);
                          console.log('🎯 المسار المطلوب:', `/super-admin-company/${company.id}`);

                          try {
                            navigate(`/super-admin-company/${company.id}`);
                            console.log('✅ تم استدعاء navigate بنجاح');
                          } catch (error) {
                            console.error('❌ خطأ في navigate:', error);
                            alert(`خطأ في التوجيه: ${error.message}`);
                          }
                        }}
                        className="flex items-center gap-2 w-full hover:bg-blue-50 border-blue-200"
                      >
                        <Eye className="h-4 w-4" />
                        عرض التفاصيل
                      </Button>

                      {/* زر دخول كـ */}
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleLoginAsCompany(company.id, company.name)}
                        disabled={loginAsLoading === company.id}
                        className="flex items-center gap-2 w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {loginAsLoading === company.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Crown className="h-4 w-4" />
                        )}
                        دخول كـ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {companies.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg m-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد شركات مسجلة</h3>
            <p className="text-gray-500">سيتم عرض الشركات هنا عند تسجيلها في النظام</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminCompaniesTable;
