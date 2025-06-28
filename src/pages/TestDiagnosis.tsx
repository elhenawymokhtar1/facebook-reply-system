import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { supabase } from '@/lib/supabase';

const TestDiagnosis: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const { company } = useCurrentCompany();

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('🚀 TestDiagnosis component mounted');
    addLog(`🏢 Current company: ${company ? `${company.name} (${company.id})` : 'NULL'}`);
  }, []);

  useEffect(() => {
    if (company?.id) {
      addLog(`🔄 Company changed to: ${company.name} (${company.id})`);
    }
  }, [company?.id]);

  const testDirectQuery = async () => {
    addLog('🔍 Testing direct Supabase query...');
    
    try {
      if (!company?.id) {
        addLog('❌ No company ID available');
        return;
      }

      // جلب جميع الطلبات
      const { data: allData, error: allError } = await supabase
        .from('ecommerce_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) {
        addLog(`❌ Error fetching all orders: ${allError.message}`);
        return;
      }

      addLog(`📊 Total orders in database: ${allData?.length || 0}`);
      setAllOrders(allData || []);

      // جلب الطلبات المفلترة
      const { data: filteredData, error: filteredError } = await supabase
        .from('ecommerce_orders')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (filteredError) {
        addLog(`❌ Error fetching filtered orders: ${filteredError.message}`);
        return;
      }

      addLog(`🎯 Filtered orders for company ${company.name}: ${filteredData?.length || 0}`);
      setOrders(filteredData || []);

      // تحليل البيانات
      const companyIds = [...new Set(allData?.map(o => o.company_id) || [])];
      addLog(`🏢 Unique company IDs in orders: ${companyIds.length}`);
      
      allData?.forEach(order => {
        const matches = order.company_id === company.id;
        addLog(`📦 Order ${order.order_number}: company_id=${order.company_id}, matches=${matches}`);
      });

    } catch (error) {
      addLog(`💥 Exception: ${error}`);
    }
  };

  const testLocalStorage = () => {
    addLog('🗄️ Testing localStorage...');
    
    const currentCompany = localStorage.getItem('currentCompany');
    addLog(`📱 localStorage currentCompany: ${currentCompany || 'NULL'}`);
    
    if (currentCompany) {
      try {
        const parsed = JSON.parse(currentCompany);
        addLog(`📋 Parsed company: ${JSON.stringify(parsed, null, 2)}`);
      } catch (e) {
        addLog(`❌ Error parsing localStorage: ${e}`);
      }
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 تشخيص مشاكل الطلبات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testDirectQuery}>
              🔍 اختبار استعلام مباشر
            </Button>
            <Button onClick={testLocalStorage} variant="outline">
              🗄️ اختبار localStorage
            </Button>
            <Button onClick={clearLogs} variant="destructive">
              🗑️ مسح السجلات
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الشركة الحالية</CardTitle>
              </CardHeader>
              <CardContent>
                {company ? (
                  <div className="space-y-2">
                    <p><strong>الاسم:</strong> {company.name}</p>
                    <p><strong>المعرف:</strong> {company.id}</p>
                    <p><strong>البريد:</strong> {company.email}</p>
                  </div>
                ) : (
                  <p className="text-red-500">❌ لا توجد شركة محددة</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>جميع الطلبات:</strong> {allOrders.length}</p>
                  <p><strong>طلبات الشركة الحالية:</strong> {orders.length}</p>
                  <p><strong>نسبة التطابق:</strong> {allOrders.length > 0 ? Math.round((orders.length / allOrders.length) * 100) : 0}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>سجل التشخيص</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500">لا توجد سجلات بعد...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {orders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>طلبات الشركة الحالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="p-2 bg-gray-50 rounded">
                      <p><strong>{order.order_number}</strong></p>
                      <p className="text-sm text-gray-600">العميل: {order.customer_name}</p>
                      <p className="text-sm text-gray-600">معرف الشركة: {order.company_id}</p>
                    </div>
                  ))}
                  {orders.length > 5 && (
                    <p className="text-sm text-gray-500">... و {orders.length - 5} طلبات أخرى</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {allOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>جميع الطلبات في قاعدة البيانات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allOrders.slice(0, 10).map(order => (
                    <div key={order.id} className={`p-2 rounded ${order.company_id === company?.id ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <p><strong>{order.order_number}</strong></p>
                      <p className="text-sm text-gray-600">العميل: {order.customer_name}</p>
                      <p className="text-sm text-gray-600">معرف الشركة: {order.company_id}</p>
                      {order.company_id === company?.id && (
                        <p className="text-xs text-green-600">✅ يطابق الشركة الحالية</p>
                      )}
                    </div>
                  ))}
                  {allOrders.length > 10 && (
                    <p className="text-sm text-gray-500">... و {allOrders.length - 10} طلبات أخرى</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDiagnosis;
