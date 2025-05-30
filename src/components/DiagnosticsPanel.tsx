import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FacebookApiService } from '@/services/facebookApi';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export const DiagnosticsPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // فحص الاتصال بـ Supabase
      console.log('🔍 فحص الاتصال بـ Supabase...');
      try {
        const { data, error } = await supabase.from('conversations').select('count').limit(1);
        if (error) throw error;
        results.push({
          name: 'اتصال Supabase',
          status: 'success',
          message: 'متصل بنجاح',
          details: { count: data?.length || 0 }
        });
      } catch (error) {
        results.push({
          name: 'اتصال Supabase',
          status: 'error',
          message: 'فشل في الاتصال',
          details: error
        });
      }

      // فحص إعدادات Facebook
      console.log('🔍 فحص إعدادات Facebook...');
      try {
        const pages = await FacebookApiService.getAllConnectedPages();
        if (pages && pages.length > 0) {
          results.push({
            name: 'إعدادات Facebook',
            status: 'success',
            message: `تم العثور على ${pages.length} صفحة مربوطة`,
            details: pages.map(p => ({ id: p.page_id, name: p.page_name }))
          });

          // فحص كل صفحة
          for (const page of pages) {
            try {
              const response = await fetch(
                `https://graph.facebook.com/v18.0/me?access_token=${page.access_token}`
              );
              const data = await response.json();
              
              if (response.ok && !data.error) {
                results.push({
                  name: `صفحة ${page.page_name}`,
                  status: 'success',
                  message: 'Access Token صالح',
                  details: { page_id: page.page_id, token_valid: true }
                });
              } else {
                results.push({
                  name: `صفحة ${page.page_name}`,
                  status: 'error',
                  message: 'Access Token غير صالح',
                  details: { page_id: page.page_id, error: data.error }
                });
              }
            } catch (error) {
              results.push({
                name: `صفحة ${page.page_name}`,
                status: 'error',
                message: 'خطأ في فحص الصفحة',
                details: { page_id: page.page_id, error }
              });
            }
          }
        } else {
          results.push({
            name: 'إعدادات Facebook',
            status: 'warning',
            message: 'لا توجد صفحات مربوطة',
            details: null
          });
        }
      } catch (error) {
        results.push({
          name: 'إعدادات Facebook',
          status: 'error',
          message: 'فشل في جلب الإعدادات',
          details: error
        });
      }

      // فحص المحادثات
      console.log('🔍 فحص المحادثات...');
      try {
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('id, customer_name, facebook_page_id')
          .limit(10);

        if (error) throw error;

        results.push({
          name: 'المحادثات',
          status: 'success',
          message: `تم العثور على ${conversations?.length || 0} محادثة`,
          details: conversations?.map(c => ({
            id: c.id,
            customer: c.customer_name,
            page_id: c.facebook_page_id
          }))
        });

        // فحص المحادثات بدون facebook_page_id
        const conversationsWithoutPageId = conversations?.filter(c => !c.facebook_page_id) || [];
        if (conversationsWithoutPageId.length > 0) {
          results.push({
            name: 'محادثات بدون page_id',
            status: 'warning',
            message: `${conversationsWithoutPageId.length} محادثة بدون facebook_page_id`,
            details: conversationsWithoutPageId
          });
        }
      } catch (error) {
        results.push({
          name: 'المحادثات',
          status: 'error',
          message: 'فشل في جلب المحادثات',
          details: error
        });
      }

      // فحص الرسائل
      console.log('🔍 فحص الرسائل...');
      try {
        const { data: messages, error } = await supabase
          .from('messages')
          .select('id, conversation_id, sender_type')
          .limit(10);

        if (error) throw error;

        results.push({
          name: 'الرسائل',
          status: 'success',
          message: `تم العثور على ${messages?.length || 0} رسالة`,
          details: {
            total: messages?.length || 0,
            by_sender: {
              customer: messages?.filter(m => m.sender_type === 'customer').length || 0,
              admin: messages?.filter(m => m.sender_type === 'admin').length || 0,
              bot: messages?.filter(m => m.sender_type === 'bot').length || 0
            }
          }
        });
      } catch (error) {
        results.push({
          name: 'الرسائل',
          status: 'error',
          message: 'فشل في جلب الرسائل',
          details: error
        });
      }

    } catch (error) {
      console.error('خطأ عام في التشخيص:', error);
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">نجح</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">تحذير</Badge>;
      case 'error':
        return <Badge variant="destructive">خطأ</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            تشخيص النظام
          </CardTitle>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <RefreshCw className="w-4 h-4 ml-2" />
            )}
            {isRunning ? 'جاري الفحص...' : 'إعادة فحص'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(diagnostic.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{diagnostic.name}</h4>
                  {getStatusBadge(diagnostic.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{diagnostic.message}</p>
                {diagnostic.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      عرض التفاصيل
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(diagnostic.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
          
          {diagnostics.length === 0 && !isRunning && (
            <div className="text-center py-8 text-gray-500">
              لا توجد نتائج تشخيص متاحة
            </div>
          )}
          
          {isRunning && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-gray-600">جاري تشغيل التشخيص...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
