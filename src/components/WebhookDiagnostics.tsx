import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Globe, 
  MessageSquare,
  Clock,
  Activity
} from 'lucide-react';

interface WebhookStatus {
  isRunning: boolean;
  port: number;
  uptime: number;
  lastCheck: string;
  ngrokStatus: 'connected' | 'disconnected' | 'error';
  ngrokUrl?: string;
  messagesReceived: number;
  messagesIgnored?: number;
  lastMessageTime?: string;
  errors: string[];
}

export default function WebhookDiagnostics() {
  const [status, setStatus] = useState<WebhookStatus>({
    isRunning: false,
    port: 3001,
    uptime: 0,
    lastCheck: '',
    ngrokStatus: 'disconnected',
    messagesReceived: 0,
    errors: []
  });
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // فحص حالة الـ Webhook
  const checkWebhookStatus = async () => {
    setIsChecking(true);
    try {
      // فحص الـ Webhook المحلي
      const webhookResponse = await fetch('http://localhost:3001/health');
      const webhookData = await webhookResponse.json();

      // فحص ngrok
      let ngrokStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
      let ngrokUrl = '';
      
      try {
        const ngrokResponse = await fetch('http://localhost:4040/api/tunnels');
        const ngrokData = await ngrokResponse.json();
        
        if (ngrokData.tunnels && ngrokData.tunnels.length > 0) {
          const tunnel = ngrokData.tunnels.find((t: any) => 
            t.config?.addr === 'http://localhost:3001'
          );
          
          if (tunnel) {
            ngrokStatus = 'connected';
            ngrokUrl = tunnel.public_url;
          }
        }
      } catch (ngrokError) {
        ngrokStatus = 'error';
      }

      setStatus({
        isRunning: webhookResponse.ok,
        port: 3001,
        uptime: webhookData.uptime || 0,
        lastCheck: new Date().toLocaleTimeString('ar-EG'),
        ngrokStatus,
        ngrokUrl,
        messagesReceived: webhookData.messagesReceived || 0,
        messagesIgnored: webhookData.messagesIgnored || 0,
        lastMessageTime: webhookData.lastMessageTime,
        errors: webhookData.errors || []
      });

    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        lastCheck: new Date().toLocaleTimeString('ar-EG'),
        ngrokStatus: 'error',
        errors: [...prev.errors, `فشل الاتصال: ${error}`]
      }));
    }
    setIsChecking(false);
  };

  // تحديث تلقائي كل 30 ثانية
  useEffect(() => {
    checkWebhookStatus();
    
    if (autoRefresh) {
      const interval = setInterval(checkWebhookStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // اختبار الـ Webhook
  const testWebhook = async () => {
    try {
      const testMessage = {
        object: 'page',
        entry: [{
          id: '260345600493273',
          messaging: [{
            sender: { id: 'test_user' },
            recipient: { id: '260345600493273' },
            timestamp: Date.now(),
            message: {
              mid: `test_${Date.now()}`,
              text: `🧪 رسالة اختبار - ${new Date().toLocaleTimeString('ar-EG')}`
            }
          }]
        }]
      };

      const response = await fetch('http://localhost:3001/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });

      if (response.ok) {
        alert('✅ تم إرسال رسالة الاختبار بنجاح!');
        checkWebhookStatus();
      } else {
        alert('❌ فشل في إرسال رسالة الاختبار');
      }
    } catch (error) {
      alert(`❌ خطأ في الاختبار: ${error}`);
    }
  };

  const getStatusIcon = (isRunning: boolean) => {
    if (isRunning) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getNgrokStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}س ${minutes}د ${secs}ث`;
  };

  return (
    <div className="space-y-6">
      {/* العنوان والتحكم */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          تشخيص الـ Webhook
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'إيقاف التحديث التلقائي' : 'تفعيل التحديث التلقائي'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={checkWebhookStatus}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* حالة الـ Webhook */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* حالة الخادم */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="h-4 w-4" />
              حالة الخادم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(status.isRunning)}
                  <span className="font-medium">
                    {status.isRunning ? 'شغال' : 'متوقف'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">المنفذ: {status.port}</p>
                {status.isRunning && (
                  <p className="text-sm text-gray-500">
                    وقت التشغيل: {formatUptime(status.uptime)}
                  </p>
                )}
              </div>
              <Badge variant={status.isRunning ? 'default' : 'destructive'}>
                {status.isRunning ? 'نشط' : 'معطل'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* حالة ngrok */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              حالة ngrok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getNgrokStatusIcon(status.ngrokStatus)}
                  <span className="font-medium">
                    {status.ngrokStatus === 'connected' ? 'متصل' : 
                     status.ngrokStatus === 'error' ? 'خطأ' : 'غير متصل'}
                  </span>
                </div>
                {status.ngrokUrl && (
                  <p className="text-xs text-blue-600 break-all">
                    {status.ngrokUrl}
                  </p>
                )}
              </div>
              <Badge 
                variant={
                  status.ngrokStatus === 'connected' ? 'default' : 
                  status.ngrokStatus === 'error' ? 'destructive' : 'secondary'
                }
              >
                {status.ngrokStatus === 'connected' ? 'متصل' : 
                 status.ngrokStatus === 'error' ? 'خطأ' : 'منقطع'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* إحصائيات الرسائل */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              الرسائل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">المستقبلة:</span>
                <span className="font-medium text-green-600">{status.messagesReceived}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">المتجاهلة:</span>
                <span className="font-medium text-orange-600">{status.messagesIgnored || 0}</span>
              </div>
              {status.lastMessageTime && (
                <div className="flex justify-between">
                  <span className="text-sm">آخر رسالة:</span>
                  <span className="text-xs text-gray-500">
                    {status.lastMessageTime}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* معلومات إضافية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* آخر فحص */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              آخر فحص
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{status.lastCheck || 'لم يتم الفحص بعد'}</p>
            <p className="text-sm text-gray-500">
              {autoRefresh ? 'التحديث التلقائي مفعل (كل 30 ثانية)' : 'التحديث التلقائي معطل'}
            </p>
          </CardContent>
        </Card>

        {/* أزرار الاختبار */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">اختبار النظام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={testWebhook} 
              className="w-full"
              disabled={!status.isRunning}
            >
              إرسال رسالة اختبار
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('http://localhost:3001/health', '_blank')}
              className="w-full"
            >
              فتح صفحة الحالة
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* الأخطاء */}
      {status.errors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-600">الأخطاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.errors.slice(-5).map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* إرشادات الإصلاح */}
      {!status.isRunning && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>الـ Webhook غير شغال!</strong>
            <br />
            لتشغيله: <code>npm run webhook</code>
            <br />
            لتشغيل ngrok: <code>ngrok http 3001</code>
          </AlertDescription>
        </Alert>
      )}

      {status.isRunning && status.ngrokStatus !== 'connected' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>ngrok غير متصل!</strong>
            <br />
            لتشغيل ngrok: <code>ngrok http 3001</code>
            <br />
            تأكد من تثبيت ngrok وإضافة auth token
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
