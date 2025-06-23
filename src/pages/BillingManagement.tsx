/**
 * 💳 صفحة إدارة الفواتير والمدفوعات
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
  Receipt, 
  Download, 
  Search, 
  Filter,
  Calendar, 
  DollarSign,
  CreditCard,
  ArrowLeft,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Mail,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  billing_period_start: string;
  billing_period_end: string;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  description: string;
  line_items?: any[];
}

interface Payment {
  id: string;
  invoice_id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  payment_date: string;
  provider: string;
}

const BillingManagement: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [company, setCompany] = useState<any>(null);

  // إحصائيات سريعة
  const [stats, setStats] = useState({
    total_invoices: 0,
    paid_amount: 0,
    pending_amount: 0,
    overdue_amount: 0
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
      loadBillingData(parsedCompany.id);
    } catch (error) {
      console.error('Error parsing company data:', error);
      navigate('/company-login');
    }
  }, [navigate]);

  const loadBillingData = async (companyId: string) => {
    try {
      setLoading(true);
      
      // تحميل الفواتير
      const invoicesRes = await fetch(`http://localhost:3002/api/subscriptions/companies/${companyId}/invoices`);
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        if (invoicesData.success) {
          setInvoices(invoicesData.data);
          calculateStats(invoicesData.data);
        }
      }

      // تحميل المدفوعات
      const paymentsRes = await fetch(`http://localhost:3002/api/subscriptions/companies/${companyId}/payments`);
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        if (paymentsData.success) {
          setPayments(paymentsData.data);
        }
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('فشل في تحميل بيانات الفوترة');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoicesData: Invoice[]) => {
    const stats = {
      total_invoices: invoicesData.length,
      paid_amount: 0,
      pending_amount: 0,
      overdue_amount: 0
    };

    invoicesData.forEach(invoice => {
      switch (invoice.status) {
        case 'paid':
          stats.paid_amount += invoice.total_amount;
          break;
        case 'sent':
          stats.pending_amount += invoice.total_amount;
          break;
        case 'overdue':
          stats.overdue_amount += invoice.total_amount;
          break;
      }
    });

    setStats(stats);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />مدفوع</Badge>;
      case 'sent':
        return <Badge className="bg-blue-500 text-white"><Clock className="h-3 w-3 mr-1" />مرسل</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />متأخر</Badge>;
      case 'draft':
        return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" />مسودة</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'sent': return 'text-blue-600';
      case 'overdue': return 'text-red-600';
      case 'draft': return 'text-gray-600';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/subscriptions/invoices/${invoiceId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('تم تحميل الفاتورة بنجاح');
      } else {
        toast.error('فشل في تحميل الفاتورة');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('حدث خطأ في تحميل الفاتورة');
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/subscriptions/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (result.success) {
        toast.success('تم إرسال الفاتورة بالبريد الإلكتروني');
        loadBillingData(company.id);
      } else {
        toast.error(result.error || 'فشل في إرسال الفاتورة');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('حدث خطأ في إرسال الفاتورة');
    }
  };

  // تصفية الفواتير
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const invoiceDate = new Date(invoice.issue_date);
      const now = new Date();
      
      switch (dateFilter) {
        case 'this_month':
          matchesDate = invoiceDate.getMonth() === now.getMonth() && 
                       invoiceDate.getFullYear() === now.getFullYear();
          break;
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          matchesDate = invoiceDate.getMonth() === lastMonth.getMonth() && 
                       invoiceDate.getFullYear() === lastMonth.getFullYear();
          break;
        case 'this_year':
          matchesDate = invoiceDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات الفوترة...</p>
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
              onClick={() => navigate('/subscription-management')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة لإدارة الاشتراك
            </Button>
            
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              إدارة الفواتير والمدفوعات
            </h1>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigate('/payment-methods')}
                variant="outline"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                طرق الدفع
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
                <Receipt className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي الفواتير</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total_invoices}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">المبلغ المدفوع</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">في الانتظار</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">متأخر</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue_amount)}</p>
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
              placeholder="البحث في الفواتير..."
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
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="sent">مرسل</SelectItem>
                  <SelectItem value="overdue">متأخر</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="تصفية بالتاريخ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التواريخ</SelectItem>
                  <SelectItem value="this_month">هذا الشهر</SelectItem>
                  <SelectItem value="last_month">الشهر الماضي</SelectItem>
                  <SelectItem value="this_year">هذا العام</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* قائمة الفواتير */}
        <Card>
          <CardHeader>
            <CardTitle>الفواتير ({filteredInvoices.length})</CardTitle>
            <CardDescription>
              إدارة ومراقبة جميع فواتيرك ومدفوعاتك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                    ? 'لا توجد فواتير مطابقة للبحث' 
                    : 'لا توجد فواتير حتى الآن'
                  }
                </div>
              ) : (
                filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-lg">{invoice.invoice_number}</h3>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>تاريخ الإصدار: {formatDate(invoice.issue_date)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>تاريخ الاستحقاق: {formatDate(invoice.due_date)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {invoice.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendInvoice(invoice.id)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نافذة تفاصيل الفاتورة */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              تفاصيل الفاتورة
            </DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">رقم الفاتورة</Label>
                  <p className="text-lg font-semibold">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">الحالة</Label>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">المبلغ</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">تاريخ الإصدار</Label>
                  <p>{formatDate(selectedInvoice.issue_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">تاريخ الاستحقاق</Label>
                  <p>{formatDate(selectedInvoice.due_date)}</p>
                </div>
                {selectedInvoice.paid_date && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">تاريخ الدفع</Label>
                    <p>{formatDate(selectedInvoice.paid_date)}</p>
                  </div>
                )}
              </div>

              {/* فترة الفوترة */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">فترة الفوترة</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">من</Label>
                    <p>{formatDate(selectedInvoice.billing_period_start)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">إلى</Label>
                    <p>{formatDate(selectedInvoice.billing_period_end)}</p>
                  </div>
                </div>
              </div>

              {/* تفاصيل المبلغ */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">تفاصيل المبلغ</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المبلغ الأساسي:</span>
                    <span>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضرائب:</span>
                    <span>{formatCurrency(selectedInvoice.tax_amount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>الإجمالي:</span>
                    <span>{formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}</span>
                  </div>
                </div>
              </div>

              {/* الوصف */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">الوصف</h3>
                <p className="text-gray-700">{selectedInvoice.description}</p>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  إغلاق
                </Button>
                <Button onClick={() => handleDownloadInvoice(selectedInvoice.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  تحميل PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingManagement;
