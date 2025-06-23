/**
 * 💳 صفحة إدارة طرق الدفع
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
  CreditCard,
  Plus,
  Trash2,
  Star,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertTriangle,
  Edit,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  Lock,
  Smartphone,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'digital_wallet' | 'instapay';
  provider: string;
  card_last_four?: string;
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  wallet_email?: string;
  wallet_phone?: string;
  instapay_identifier?: string;
  instapay_type?: 'phone' | 'email' | 'card';
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface NewPaymentMethod {
  type: string;
  // بيانات البطاقة الائتمانية
  card_number: string;
  card_exp_month: string;
  card_exp_year: string;
  card_cvc: string;
  card_holder_name: string;
  // بيانات المحفظة الرقمية
  wallet_email: string;
  wallet_phone: string;
  wallet_provider: string;
  // بيانات InstaPay
  instapay_identifier: string;
  instapay_type: string;
  // عنوان الفوترة
  billing_address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

const PaymentMethods: React.FC = () => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [showCardNumber, setShowCardNumber] = useState(false);

  const [newMethod, setNewMethod] = useState<NewPaymentMethod>({
    type: 'credit_card',
    // بيانات البطاقة الائتمانية
    card_number: '',
    card_exp_month: '',
    card_exp_year: '',
    card_cvc: '',
    card_holder_name: '',
    // بيانات المحفظة الرقمية
    wallet_email: '',
    wallet_phone: '',
    wallet_provider: 'paypal',
    // بيانات InstaPay
    instapay_identifier: '',
    instapay_type: 'phone',
    // عنوان الفوترة
    billing_address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'EG'
    }
  });

  useEffect(() => {
    // التحقق من تسجيل دخول الشركة
    const companyData = localStorage.getItem('company');
    if (!companyData) {
      navigate('/company-login');
      return;
    }

    try {
      const parsedCompany = JSON.parse(companyData);
      setCompany(parsedCompany);
      loadPaymentMethods(parsedCompany.id);
    } catch (error) {
      console.error('Error parsing company data:', error);
      navigate('/company-login');
    }
  }, [navigate]);

  const loadPaymentMethods = async (companyId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3002/api/subscriptions/companies/${companyId}/payment-methods`);
      const result = await response.json();

      if (result.success) {
        setPaymentMethods(result.data || []);
      } else {
        toast.error('فشل في تحميل طرق الدفع');
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('حدث خطأ في تحميل طرق الدفع');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      // التحقق من صحة البيانات حسب نوع طريقة الدفع
      let isValid = true;
      let errorMessage = '';

      switch (newMethod.type) {
        case 'credit_card':
        case 'debit_card':
          if (!newMethod.card_number || !newMethod.card_exp_month || !newMethod.card_exp_year || !newMethod.card_cvc) {
            isValid = false;
            errorMessage = 'يرجى ملء جميع بيانات البطاقة المطلوبة';
          }
          break;
        case 'digital_wallet':
          if (!newMethod.wallet_provider || (!newMethod.wallet_email && !newMethod.wallet_phone)) {
            isValid = false;
            errorMessage = 'يرجى اختيار مزود المحفظة وإدخال البريد الإلكتروني أو رقم الهاتف';
          }
          break;
        case 'instapay':
          if (!newMethod.instapay_type || !newMethod.instapay_identifier) {
            isValid = false;
            errorMessage = 'يرجى اختيار نوع المعرف وإدخال البيانات المطلوبة';
          }
          break;
        case 'bank_transfer':
          // لا توجد بيانات إضافية مطلوبة للتحويل البنكي
          break;
        default:
          isValid = false;
          errorMessage = 'يرجى اختيار نوع طريقة الدفع';
      }

      if (!isValid) {
        toast.error(errorMessage);
        return;
      }

      const response = await fetch(`http://localhost:3002/api/subscriptions/companies/${company.id}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMethod)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم إضافة طريقة الدفع بنجاح');
        setIsAddDialogOpen(false);
        // إعادة تعيين النموذج
        setNewMethod({
          type: 'credit_card',
          card_number: '',
          card_exp_month: '',
          card_exp_year: '',
          card_cvc: '',
          card_holder_name: '',
          wallet_email: '',
          wallet_phone: '',
          wallet_provider: 'paypal',
          instapay_identifier: '',
          instapay_type: 'phone',
          billing_address: {
            line1: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'EG'
          }
        });
        loadPaymentMethods(company.id);
      } else {
        toast.error(result.error || 'فشل في إضافة طريقة الدفع');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('حدث خطأ في إضافة طريقة الدفع');
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/subscriptions/payment-methods/${methodId}/set-default`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم تعيين طريقة الدفع الافتراضية');
        loadPaymentMethods(company.id);
      } else {
        toast.error(result.error || 'فشل في تعيين طريقة الدفع الافتراضية');
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error('حدث خطأ في تعيين طريقة الدفع الافتراضية');
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/subscriptions/payment-methods/${methodId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم حذف طريقة الدفع');
        loadPaymentMethods(company.id);
      } else {
        toast.error(result.error || 'فشل في حذف طريقة الدفع');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('حدث خطأ في حذف طريقة الدفع');
    }
  };

  const getPaymentMethodIcon = (type: string, provider?: string, brand?: string) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        switch (brand?.toLowerCase()) {
          case 'visa': return '💳';
          case 'mastercard': return '💳';
          case 'amex': return '💳';
          case 'discover': return '💳';
          default: return '💳';
        }
      case 'digital_wallet':
        switch (provider?.toLowerCase()) {
          case 'paypal': return '🅿️';
          case 'apple_pay': return '🍎';
          case 'google_pay': return '🔵';
          case 'samsung_pay': return '📱';
          default: return '💰';
        }
      case 'instapay':
        return '⚡';
      case 'bank_transfer':
        return '🏦';
      default:
        return '💳';
    }
  };

  const getPaymentMethodColor = (type: string, provider?: string, brand?: string) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        switch (brand?.toLowerCase()) {
          case 'visa': return 'bg-blue-500';
          case 'mastercard': return 'bg-red-500';
          case 'amex': return 'bg-green-500';
          case 'discover': return 'bg-orange-500';
          default: return 'bg-gray-500';
        }
      case 'digital_wallet':
        switch (provider?.toLowerCase()) {
          case 'paypal': return 'bg-blue-600';
          case 'apple_pay': return 'bg-black';
          case 'google_pay': return 'bg-blue-500';
          case 'samsung_pay': return 'bg-blue-800';
          default: return 'bg-purple-500';
        }
      case 'instapay':
        return 'bg-orange-500';
      case 'bank_transfer':
        return 'bg-green-600';
      default:
        return 'bg-gray-500';
    }
  };

  const formatExpiryDate = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  const isCardExpired = (month: number, year: number) => {
    const now = new Date();
    const expiry = new Date(year, month - 1);
    return expiry < now;
  };

  const getPaymentMethodDisplayName = (method: PaymentMethod) => {
    switch (method.type) {
      case 'credit_card':
      case 'debit_card':
        return `${method.card_brand?.toUpperCase()} •••• ${method.card_last_four}`;
      case 'digital_wallet':
        if (method.wallet_email) {
          return `${method.provider.toUpperCase()} - ${method.wallet_email}`;
        } else if (method.wallet_phone) {
          return `${method.provider.toUpperCase()} - ${method.wallet_phone}`;
        }
        return method.provider.toUpperCase();
      case 'instapay':
        const typeText = method.instapay_type === 'phone' ? 'رقم الهاتف' :
                        method.instapay_type === 'email' ? 'البريد الإلكتروني' : 'البطاقة';
        return `InstaPay - ${typeText}: ${method.instapay_identifier}`;
      case 'bank_transfer':
        return 'تحويل بنكي';
      default:
        return method.provider || method.type;
    }
  };

  const getPaymentMethodSubtitle = (method: PaymentMethod) => {
    switch (method.type) {
      case 'credit_card':
      case 'debit_card':
        if (method.card_exp_month && method.card_exp_year) {
          return `انتهاء: ${formatExpiryDate(method.card_exp_month, method.card_exp_year)}`;
        }
        return 'بطاقة ائتمانية';
      case 'digital_wallet':
        return 'محفظة رقمية';
      case 'instapay':
        return 'دفع فوري - InstaPay';
      case 'bank_transfer':
        return 'تحويل بنكي';
      default:
        return method.type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل طرق الدفع...</p>
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
              onClick={() => navigate('/billing-management')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة للفوترة
            </Button>
            
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              إدارة طرق الدفع
            </h1>
            
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة طريقة دفع
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* معلومات الأمان */}
        <Alert className="mb-8 border-green-200 bg-green-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center">
              <Lock className="h-4 w-4 mr-2 text-green-600" />
              <span>جميع معلومات الدفع محمية بتشفير SSL 256-bit ولا يتم حفظ أرقام البطاقات كاملة</span>
            </div>
          </AlertDescription>
        </Alert>

        {/* طرق الدفع المحفوظة */}
        <Card>
          <CardHeader>
            <CardTitle>طرق الدفع المحفوظة</CardTitle>
            <CardDescription>
              إدارة بطاقاتك الائتمانية وطرق الدفع المختلفة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طرق دفع محفوظة</h3>
                <p className="text-gray-600 mb-6">أضف طريقة دفع لتسهيل عمليات الدفع المستقبلية</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة طريقة دفع
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg ${method.is_default ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-8 rounded ${getPaymentMethodColor(method.type, method.provider, method.card_brand)} flex items-center justify-center text-white font-bold`}>
                          {getPaymentMethodIcon(method.type, method.provider, method.card_brand)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">
                              {getPaymentMethodDisplayName(method)}
                            </h3>
                            {method.is_default && (
                              <Badge className="bg-blue-500 text-white">
                                <Star className="h-3 w-3 mr-1" />
                                افتراضي
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{getPaymentMethodSubtitle(method)}</span>
                            {(method.type === 'credit_card' || method.type === 'debit_card') &&
                             method.card_exp_month && method.card_exp_year &&
                             isCardExpired(method.card_exp_month, method.card_exp_year) && (
                              <div className="flex items-center text-red-500">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                <span>منتهية الصلاحية</span>
                              </div>
                            )}
                            <span>تم الإضافة: {new Date(method.created_at).toLocaleDateString('ar')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!method.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMethod(method);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) {
                              handleDeletePaymentMethod(method.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isCardExpired(method.card_exp_month || 0, method.card_exp_year || 0) && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          هذه البطاقة منتهية الصلاحية. يرجى تحديث معلومات البطاقة أو إضافة طريقة دفع جديدة.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                الأمان والحماية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  تشفير SSL 256-bit لجميع المعاملات
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  عدم حفظ أرقام البطاقات كاملة
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  مراقبة مستمرة للأنشطة المشبوهة
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  امتثال لمعايير PCI DSS
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                طرق الدفع المدعومة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* البطاقات الائتمانية */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">البطاقات الائتمانية</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <div className="w-8 h-5 bg-blue-500 rounded mr-2"></div>
                      <span className="text-sm">Visa</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-5 bg-red-500 rounded mr-2"></div>
                      <span className="text-sm">Mastercard</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-5 bg-green-500 rounded mr-2"></div>
                      <span className="text-sm">American Express</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-5 bg-orange-500 rounded mr-2"></div>
                      <span className="text-sm">Discover</span>
                    </div>
                  </div>
                </div>

                {/* المحافظ الرقمية */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">المحافظ الرقمية</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <div className="w-8 h-5 bg-blue-600 rounded mr-2 flex items-center justify-center text-white text-xs">🅿️</div>
                      <span className="text-sm">PayPal</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-5 bg-black rounded mr-2 flex items-center justify-center text-white text-xs">🍎</div>
                      <span className="text-sm">Apple Pay</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-5 bg-blue-500 rounded mr-2 flex items-center justify-center text-white text-xs">🔵</div>
                      <span className="text-sm">Google Pay</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-5 bg-blue-800 rounded mr-2 flex items-center justify-center text-white text-xs">📱</div>
                      <span className="text-sm">Samsung Pay</span>
                    </div>
                  </div>
                </div>

                {/* الدفع الفوري */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">الدفع الفوري</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center">
                      <div className="w-8 h-5 bg-orange-500 rounded mr-2 flex items-center justify-center text-white text-xs">⚡</div>
                      <span className="text-sm">InstaPay - الدفع الفوري</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* نافذة إضافة طريقة دفع */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              إضافة طريقة دفع جديدة
            </DialogTitle>
            <DialogDescription>
              أضف بطاقة ائتمان أو طريقة دفع جديدة لحسابك
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* اختيار نوع طريقة الدفع */}
            <div>
              <Label htmlFor="payment_type">نوع طريقة الدفع *</Label>
              <Select value={newMethod.type} onValueChange={(value) => setNewMethod({...newMethod, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">بطاقة ائتمانية</SelectItem>
                  <SelectItem value="debit_card">بطاقة خصم</SelectItem>
                  <SelectItem value="digital_wallet">محفظة رقمية</SelectItem>
                  <SelectItem value="instapay">InstaPay - الدفع الفوري</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* حقول البطاقة الائتمانية */}
            {(newMethod.type === 'credit_card' || newMethod.type === 'debit_card') && (
              <>
                <div>
                  <Label htmlFor="card_holder_name">اسم حامل البطاقة *</Label>
                  <Input
                    id="card_holder_name"
                    value={newMethod.card_holder_name}
                    onChange={(e) => setNewMethod({...newMethod, card_holder_name: e.target.value})}
                    placeholder="الاسم كما هو مكتوب على البطاقة"
                  />
                </div>

                <div>
                  <Label htmlFor="card_number">رقم البطاقة *</Label>
                  <div className="relative">
                    <Input
                      id="card_number"
                      type={showCardNumber ? "text" : "password"}
                      value={newMethod.card_number}
                      onChange={(e) => setNewMethod({...newMethod, card_number: e.target.value.replace(/\s/g, '')})}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowCardNumber(!showCardNumber)}
                    >
                      {showCardNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="card_exp_month">الشهر *</Label>
                    <Select value={newMethod.card_exp_month} onValueChange={(value) => setNewMethod({...newMethod, card_exp_month: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                          <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                            {month.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="card_exp_year">السنة *</Label>
                    <Select value={newMethod.card_exp_year} onValueChange={(value) => setNewMethod({...newMethod, card_exp_year: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="YYYY" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="card_cvc">CVC *</Label>
                    <Input
                      id="card_cvc"
                      type="password"
                      value={newMethod.card_cvc}
                      onChange={(e) => setNewMethod({...newMethod, card_cvc: e.target.value})}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
              </>
            )}

            {/* حقول المحفظة الرقمية */}
            {newMethod.type === 'digital_wallet' && (
              <>
                <div>
                  <Label htmlFor="wallet_provider">مزود المحفظة *</Label>
                  <Select value={newMethod.wallet_provider} onValueChange={(value) => setNewMethod({...newMethod, wallet_provider: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مزود المحفظة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="apple_pay">Apple Pay</SelectItem>
                      <SelectItem value="google_pay">Google Pay</SelectItem>
                      <SelectItem value="samsung_pay">Samsung Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="wallet_email">البريد الإلكتروني للمحفظة</Label>
                  <Input
                    id="wallet_email"
                    type="email"
                    value={newMethod.wallet_email}
                    onChange={(e) => setNewMethod({...newMethod, wallet_email: e.target.value})}
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="wallet_phone">رقم الهاتف للمحفظة</Label>
                  <Input
                    id="wallet_phone"
                    type="tel"
                    value={newMethod.wallet_phone}
                    onChange={(e) => setNewMethod({...newMethod, wallet_phone: e.target.value})}
                    placeholder="+20 123 456 7890"
                  />
                </div>
              </>
            )}

            {/* حقول InstaPay */}
            {newMethod.type === 'instapay' && (
              <>
                <div>
                  <Label htmlFor="instapay_type">نوع معرف InstaPay *</Label>
                  <Select value={newMethod.instapay_type} onValueChange={(value) => setNewMethod({...newMethod, instapay_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المعرف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">رقم الهاتف</SelectItem>
                      <SelectItem value="email">البريد الإلكتروني</SelectItem>
                      <SelectItem value="card">رقم البطاقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="instapay_identifier">
                    {newMethod.instapay_type === 'phone' ? 'رقم الهاتف' :
                     newMethod.instapay_type === 'email' ? 'البريد الإلكتروني' : 'رقم البطاقة'} *
                  </Label>
                  <Input
                    id="instapay_identifier"
                    type={newMethod.instapay_type === 'email' ? 'email' : 'text'}
                    value={newMethod.instapay_identifier}
                    onChange={(e) => setNewMethod({...newMethod, instapay_identifier: e.target.value})}
                    placeholder={
                      newMethod.instapay_type === 'phone' ? '+20 123 456 7890' :
                      newMethod.instapay_type === 'email' ? 'example@email.com' : '1234 5678 9012 3456'
                    }
                  />
                </div>
              </>
            )}

            {/* رسالة للتحويل البنكي */}
            {newMethod.type === 'bank_transfer' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  سيتم إرسال تفاصيل التحويل البنكي إليك عبر البريد الإلكتروني بعد تأكيد الطلب.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddPaymentMethod}>
                <Plus className="h-4 w-4 mr-2" />
                إضافة طريقة الدفع
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentMethods;
