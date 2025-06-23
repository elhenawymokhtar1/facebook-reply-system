/**
 * 🧪 صفحة اختبار النظام الشامل
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Server, 
  Database, 
  Users, 
  CreditCard,
  BarChart3,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

const SystemTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'اختبار اتصال السيرفر', status: 'pending' },
    { name: 'اختبار قاعدة البيانات', status: 'pending' },
    { name: 'اختبار API الاشتراكات', status: 'pending' },
    { name: 'اختبار تسجيل الشركات', status: 'pending' },
    { name: 'اختبار تسجيل الدخول', status: 'pending' },
    { name: 'اختبار خطط الاشتراك', status: 'pending' },
    { name: 'اختبار مراقبة الاستخدام', status: 'pending' },
    { name: 'اختبار ترقية الخطة', status: 'pending' },
    { name: 'اختبار لوحة التحكم', status: 'pending' },
    { name: 'اختبار الواجهة الأمامية', status: 'pending' }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(-1);

  const updateTestStatus = (index: number, status: TestResult['status'], message?: string, duration?: number) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message, duration } : test
    ));
  };

  const runTest = async (testName: string, testFunction: () => Promise<void>): Promise<boolean> => {
    const startTime = Date.now();
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      throw error;
    }
  };

  const testServerConnection = async () => {
    const response = await fetch('http://localhost:3002/api/subscriptions/test');
    if (!response.ok) throw new Error('فشل في الاتصال بالسيرفر');
    const data = await response.json();
    if (!data.success) throw new Error('السيرفر لا يستجيب بشكل صحيح');
  };

  const testDatabase = async () => {
    const response = await fetch('http://localhost:3002/api/subscriptions/plans');
    if (!response.ok) throw new Error('فشل في الاتصال بقاعدة البيانات');
    const data = await response.json();
    if (!data.success || !Array.isArray(data.data)) throw new Error('قاعدة البيانات لا تعمل بشكل صحيح');
  };

  const testSubscriptionAPI = async () => {
    const response = await fetch('http://localhost:3002/api/subscriptions/plans');
    if (!response.ok) throw new Error('فشل في API الاشتراكات');
    const data = await response.json();
    if (!data.success) throw new Error('API الاشتراكات لا يعمل بشكل صحيح');
  };

  const testCompanyRegistration = async () => {
    const testCompany = {
      name: `شركة اختبار ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'test123456',
      phone: '+20123456789',
      city: 'القاهرة',
      country: 'Egypt'
    };

    const response = await fetch('http://localhost:3002/api/subscriptions/companies/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCompany)
    });

    if (!response.ok) throw new Error('فشل في تسجيل الشركة');
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'فشل في تسجيل الشركة');
    
    // حفظ بيانات الشركة للاختبارات التالية
    localStorage.setItem('testCompany', JSON.stringify(data.data));
  };

  const testCompanyLogin = async () => {
    const testCompany = JSON.parse(localStorage.getItem('testCompany') || '{}');
    if (!testCompany.email) throw new Error('لا توجد بيانات شركة للاختبار');

    const response = await fetch('http://localhost:3002/api/subscriptions/companies/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCompany.email,
        password: 'test123456'
      })
    });

    if (!response.ok) throw new Error('فشل في تسجيل الدخول');
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'فشل في تسجيل الدخول');
  };

  const testSubscriptionPlans = async () => {
    const response = await fetch('http://localhost:3002/api/subscriptions/plans');
    if (!response.ok) throw new Error('فشل في جلب خطط الاشتراك');
    const data = await response.json();
    if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('لا توجد خطط اشتراك');
    }
  };

  const testUsageTracking = async () => {
    const testCompany = JSON.parse(localStorage.getItem('testCompany') || '{}');
    if (!testCompany.id) throw new Error('لا توجد بيانات شركة للاختبار');

    // تسجيل استخدام
    const recordResponse = await fetch(`http://localhost:3002/api/subscriptions/companies/${testCompany.id}/usage/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceType: 'messages', count: 1 })
    });

    if (!recordResponse.ok) throw new Error('فشل في تسجيل الاستخدام');
    const recordData = await recordResponse.json();
    if (!recordData.success) throw new Error('فشل في تسجيل الاستخدام');

    // جلب إحصائيات الاستخدام
    const usageResponse = await fetch(`http://localhost:3002/api/subscriptions/companies/${testCompany.id}/usage`);
    if (!usageResponse.ok) throw new Error('فشل في جلب إحصائيات الاستخدام');
    const usageData = await usageResponse.json();
    if (!usageData.success) throw new Error('فشل في جلب إحصائيات الاستخدام');
  };

  const testPlanUpgrade = async () => {
    const testCompany = JSON.parse(localStorage.getItem('testCompany') || '{}');
    if (!testCompany.id) throw new Error('لا توجد بيانات شركة للاختبار');

    // جلب الخطط المتاحة
    const plansResponse = await fetch('http://localhost:3002/api/subscriptions/plans');
    if (!plansResponse.ok) throw new Error('فشل في جلب الخطط');
    const plansData = await plansResponse.json();
    if (!plansData.success || plansData.data.length < 2) throw new Error('لا توجد خطط كافية للاختبار');

    // محاولة ترقية للخطة الثانية
    const upgradeResponse = await fetch(`http://localhost:3002/api/subscriptions/companies/${testCompany.id}/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plansData.data[1].id,
        billingCycle: 'monthly'
      })
    });

    if (!upgradeResponse.ok) throw new Error('فشل في ترقية الخطة');
    const upgradeData = await upgradeResponse.json();
    if (!upgradeData.success) throw new Error(upgradeData.error || 'فشل في ترقية الخطة');
  };

  const testDashboard = async () => {
    const testCompany = JSON.parse(localStorage.getItem('testCompany') || '{}');
    if (!testCompany.id) throw new Error('لا توجد بيانات شركة للاختبار');

    const response = await fetch(`http://localhost:3002/api/subscriptions/companies/${testCompany.id}/dashboard`);
    if (!response.ok) throw new Error('فشل في جلب بيانات لوحة التحكم');
    const data = await response.json();
    if (!data.success) throw new Error('فشل في جلب بيانات لوحة التحكم');
  };

  const testFrontend = async () => {
    // اختبار بسيط للواجهة الأمامية
    const elements = [
      document.querySelector('[data-testid="system-test"]'),
      document.querySelector('button'),
      document.querySelector('.card')
    ];

    if (elements.some(el => !el)) {
      throw new Error('بعض عناصر الواجهة مفقودة');
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setCurrentTest(0);

    const testFunctions = [
      testServerConnection,
      testDatabase,
      testSubscriptionAPI,
      testCompanyRegistration,
      testCompanyLogin,
      testSubscriptionPlans,
      testUsageTracking,
      testPlanUpgrade,
      testDashboard,
      testFrontend
    ];

    for (let i = 0; i < tests.length; i++) {
      setCurrentTest(i);
      updateTestStatus(i, 'running');

      const startTime = Date.now();
      try {
        await testFunctions[i]();
        const duration = Date.now() - startTime;
        updateTestStatus(i, 'success', 'نجح الاختبار', duration);
        toast.success(`✅ ${tests[i].name} - نجح`);
      } catch (error) {
        const duration = Date.now() - startTime;
        const message = error instanceof Error ? error.message : 'خطأ غير معروف';
        updateTestStatus(i, 'error', message, duration);
        toast.error(`❌ ${tests[i].name} - ${message}`);
      }

      // انتظار قصير بين الاختبارات
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTest(-1);
    setIsRunning(false);

    // إحصائيات النتائج
    const successCount = tests.filter(t => t.status === 'success').length;
    const errorCount = tests.filter(t => t.status === 'error').length;
    
    if (errorCount === 0) {
      toast.success(`🎉 جميع الاختبارات نجحت! (${successCount}/${tests.length})`);
    } else {
      toast.error(`⚠️ ${errorCount} اختبار فشل من أصل ${tests.length}`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500">نجح</Badge>;
      case 'error': return <Badge variant="destructive">فشل</Badge>;
      case 'running': return <Badge className="bg-blue-500">جاري التشغيل</Badge>;
      default: return <Badge variant="outline">في الانتظار</Badge>;
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const totalDuration = tests.reduce((sum, test) => sum + (test.duration || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="system-test">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 اختبار النظام الشامل
          </h1>
          <p className="text-gray-600">
            اختبار جميع مكونات نظام اشتراك الشركات والسيرفر
          </p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Server className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي الاختبارات</p>
                  <p className="text-2xl font-bold">{tests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">نجح</p>
                  <p className="text-2xl font-bold text-green-600">{successCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">فشل</p>
                  <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">الوقت الإجمالي</p>
                  <p className="text-2xl font-bold">{totalDuration}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* زر تشغيل الاختبارات */}
        <div className="mb-8">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isRunning ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                جاري تشغيل الاختبارات...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                تشغيل جميع الاختبارات
              </>
            )}
          </Button>
        </div>

        {/* قائمة الاختبارات */}
        <Card>
          <CardHeader>
            <CardTitle>نتائج الاختبارات</CardTitle>
            <CardDescription>
              حالة كل اختبار ونتائجه التفصيلية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg transition-all ${
                    currentTest === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(test.status)}
                      <span className="ml-3 font-medium">{test.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {test.duration && (
                        <span className="text-sm text-gray-500">{test.duration}ms</span>
                      )}
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                  {test.message && (
                    <div className="mt-2">
                      <Alert variant={test.status === 'error' ? 'destructive' : 'default'}>
                        <AlertDescription>{test.message}</AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemTest;
