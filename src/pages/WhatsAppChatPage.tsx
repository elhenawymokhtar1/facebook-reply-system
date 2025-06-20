import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Settings, 
  ArrowLeft,
  Wifi,
  WifiOff,
  Search,
  MoreVertical
} from 'lucide-react';
import WhatsAppChat from '../components/WhatsAppChat';
import ChatSearch from '../components/ChatSearch';

const WhatsAppChatPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  useEffect(() => {
    checkConnectionStatus();
    
    // فحص دوري لحالة الاتصال
    const interval = setInterval(checkConnectionStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/whatsapp-baileys/status');
      const data = await response.json();
      setIsConnected(data.isConnected);
      setConnectionStatus(data.isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('خطأ في فحص حالة الاتصال:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }
  };

  const handleSendMessage = async (phoneNumber: string, message: string) => {
    try {
      const response = await fetch('http://localhost:3002/api/whatsapp-baileys/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          message: message
        })
      });

      if (response.ok) {
        console.log('تم إرسال الرسالة بنجاح');
      } else {
        console.error('فشل في إرسال الرسالة');
        alert('فشل في إرسال الرسالة');
      }
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      alert('حدث خطأ في إرسال الرسالة');
    }
  };

  const handleSearchResult = (result: any) => {
    console.log('نتيجة البحث:', result);
    setShowSearch(false);
    // يمكن إضافة منطق التنقل للمحادثة هنا
  };

  // معالج اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            setShowSearch(true);
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (connectionStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري فحص حالة الاتصال...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* شريط علوي */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/whatsapp"
                className="p-2 hover:bg-gray-100 rounded-full"
                title="العودة للإعدادات"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </a>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    WhatsApp غير متصل
                  </h1>
                  <p className="text-sm text-red-600">
                    يجب ربط حساب WhatsApp أولاً
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-red-50 text-red-800 border-2 border-red-200">
              <WifiOff className="w-4 h-4" />
              غير متصل
            </div>
          </div>
        </div>

        {/* محتوى الصفحة */}
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center max-w-md">
            <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <WifiOff className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              WhatsApp غير متصل
            </h2>
            <p className="text-gray-600 mb-6">
              لاستخدام الدردشة، يجب ربط حساب WhatsApp أولاً من صفحة الإعدادات
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/whatsapp"
                className="bg-green-200 text-green-900 px-6 py-3 rounded-lg hover:bg-green-300 flex items-center gap-2 font-bold border-2 border-green-600 shadow-md"
              >
                <Settings className="w-4 h-4" />
                الذهاب للإعدادات
              </a>
              <button
                onClick={checkConnectionStatus}
                className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 flex items-center gap-2 font-bold border-2 border-gray-600 shadow-md"
              >
                <Wifi className="w-4 h-4" />
                إعادة فحص الاتصال
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط علوي مبسط */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* الجانب الأيسر */}
          <div className="flex items-center gap-3">
            <a
              href="/whatsapp"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">العودة</span>
            </a>
          </div>

          {/* العنوان الوسط */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">WhatsApp Business</h1>
              <div className={`flex items-center gap-1 text-xs ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>متصل</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>غير متصل</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* الجانب الأيمن */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="البحث"
            >
              <Search className="w-5 h-5" />
            </button>
            <a
              href="/whatsapp"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="الإعدادات"
            >
              <Settings className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* منطقة الدردشة الرئيسية */}
      <div className="h-[calc(100vh-70px)]">
        <WhatsAppChat
          isConnected={isConnected}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* نافذة البحث */}
      <ChatSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectResult={handleSearchResult}
      />
    </div>
  );
};

export default WhatsAppChatPage;
