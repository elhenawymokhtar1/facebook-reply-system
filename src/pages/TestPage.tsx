import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Users, 
  Database, 
  Wifi, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  AlertTriangle,
  Eye,
  Send
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: any;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'customer' | 'agent';
  created_at: string;
  conversation_id: string;
}

interface Conversation {
  id: string;
  customer_name: string;
  facebook_user_id: string;
  last_message_at: string;
  page_name?: string;
}

const TestPage: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const runTest = async (testName: string, testFn: () => Promise<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.name === testName 
        ? { ...test, status: 'loading' as const, message: 'جاري الاختبار...' }
        : test
    ));

    try {
      const result = await testFn();
      setTests(prev => prev.map(test => 
        test.name === testName ? result : test
      ));
    } catch (error) {
      setTests(prev => prev.map(test => 
        test.name === testName 
          ? { 
              name: testName, 
              status: 'error' as const, 
              message: `خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}` 
            }
          : test
      ));
    }
  };

  const testApiConnection = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/conversations?limit=1');
      if (response.ok) {
        return {
          name: 'اتصال API',
          status: 'success',
          message: 'الاتصال بـ API يعمل بنجاح',
          details: { status: response.status, url: '/api/conversations' }
        };
      } else {
        return {
          name: 'اتصال API',
          status: 'error',
          message: `فشل الاتصال: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        name: 'اتصال API',
        status: 'error',
        message: `خطأ في الشبكة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  };

  const testConversations = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/conversations?limit=10');
      if (response.ok) {
        const data = await response.json();
        setConversations(data || []);
        return {
          name: 'جلب المحادثات',
          status: 'success',
          message: `تم جلب ${data?.length || 0} محادثة`,
          details: data
        };
      } else {
        const errorText = await response.text();
        return {
          name: 'جلب المحادثات',
          status: 'error',
          message: `فشل جلب المحادثات: ${response.status}`,
          details: { error: errorText }
        };
      }
    } catch (error) {
      return {
        name: 'جلب المحادثات',
        status: 'error',
        message: `خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  };

  const testMessages = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/messages/recent?limit=10');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        return {
          name: 'جلب الرسائل',
          status: 'success',
          message: `تم جلب ${data.messages?.length || 0} رسالة`,
          details: data
        };
      } else {
        const errorText = await response.text();
        return {
          name: 'جلب الرسائل',
          status: 'error',
          message: `فشل جلب الرسائل: ${response.status}`,
          details: { error: errorText }
        };
      }
    } catch (error) {
      return {
        name: 'جلب الرسائل',
        status: 'error',
        message: `خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  };

  const testSpecificConversation = async (conversationId: string): Promise<TestResult> => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        return {
          name: `رسائل المحادثة ${conversationId.slice(0, 8)}`,
          status: 'success',
          message: `تم جلب ${data.messages?.length || 0} رسالة للمحادثة`,
          details: data
        };
      } else {
        const errorText = await response.text();
        return {
          name: `رسائل المحادثة ${conversationId.slice(0, 8)}`,
          status: 'error',
          message: `فشل جلب رسائل المحادثة: ${response.status}`,
          details: { error: errorText }
        };
      }
    } catch (error) {
      return {
        name: `رسائل المحادثة ${conversationId.slice(0, 8)}`,
        status: 'error',
        message: `خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  };

  const testDatabase = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/process-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      if (response.ok) {
        return {
          name: 'قاعدة البيانات',
          status: 'success',
          message: 'قاعدة البيانات متصلة ومتاحة'
        };
      } else {
        return {
          name: 'قاعدة البيانات',
          status: 'warning',
          message: `استجابة غير متوقعة: ${response.status}`
        };
      }
    } catch (error) {
      return {
        name: 'قاعدة البيانات',
        status: 'error',
        message: `خطأ في الاتصال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Initialize tests
    const initialTests: TestResult[] = [
      { name: 'اتصال API', status: 'loading', message: 'جاري الاختبار...' },
      { name: 'جلب المحادثات', status: 'loading', message: 'جاري الاختبار...' },
      { name: 'جلب الرسائل', status: 'loading', message: 'جاري الاختبار...' },
      { name: 'قاعدة البيانات', status: 'loading', message: 'جاري الاختبار...' }
    ];
    
    setTests(initialTests);

    // Run tests sequentially
    await runTest('اتصال API', testApiConnection);
    await runTest('جلب المحادثات', testConversations);
    await runTest('جلب الرسائل', testMessages);
    await runTest('قاعدة البيانات', testDatabase);
    
    setIsRunning(false);
  };

  const testConversationMessages = async (conversationId: string) => {
    const testName = `رسائل المحادثة ${conversationId.slice(0, 8)}`;
    setTests(prev => [...prev, { name: testName, status: 'loading', message: 'جاري الاختبار...' }]);
    await runTest(testName, () => testSpecificConversation(conversationId));
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'loading':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">نجح</Badge>;
      case 'error':
        return <Badge variant="destructive">فشل</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">تحذير</Badge>;
      case 'loading':
        return <Badge variant="outline">جاري التحميل</Badge>;
      default:
        return null;
    }
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔍 صفحة اختبار النظام</h1>
        <p className="text-gray-600">اختبار شامل لجميع مكونات النظام</p>
      </div>

      <div className="mb-6">
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              جاري تشغيل الاختبارات...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              إعادة تشغيل جميع الاختبارات
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">نتائج الاختبارات</h2>
          {tests.map((test, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="text-sm">{test.name}</span>
                  </div>
                  {getStatusBadge(test.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{test.message}</p>

                {test.details && (
                  <>
                    <Separator className="my-3" />
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium mb-2">
                        عرض التفاصيل
                      </summary>
                      <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Data */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">البيانات المباشرة</h2>

          {/* Conversations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                المحادثات ({conversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <p className="text-gray-500 text-sm">لا توجد محادثات</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{conv.customer_name}</p>
                        <p className="text-xs text-gray-500">{conv.page_name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(conv.last_message_at).toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConversationMessages(conv.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                الرسائل الأخيرة ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm">لا توجد رسائل</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {messages.map((msg) => (
                    <div key={msg.id} className="p-2 border rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={msg.sender_type === 'customer' ? 'default' : 'secondary'}>
                          {msg.sender_type === 'customer' ? 'عميل' : 'وكيل'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.created_at).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            معلومات النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Frontend URL:</strong> {window.location.origin}
            </div>
            <div>
              <strong>API Base:</strong> /api
            </div>
            <div>
              <strong>المحادثات المحملة:</strong> {conversations.length}
            </div>
            <div>
              <strong>الرسائل المحملة:</strong> {messages.length}
            </div>
            <div>
              <strong>الوقت الحالي:</strong> {new Date().toLocaleString('ar-EG')}
            </div>
            <div>
              <strong>حالة الاختبارات:</strong> {tests.filter(t => t.status === 'success').length}/{tests.length} نجح
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPage;
