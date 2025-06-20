import React, { useState, useEffect } from 'react';
import { MessageCircle, Wifi, WifiOff, Send, RefreshCw, Phone, Users, BarChart3 } from 'lucide-react';

const WhatsAppBaileys: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    todayMessages: 0,
    activeChats: 0
  });

  useEffect(() => {
    checkConnectionStatus();
    loadMessages();
    loadStats();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/status');
      const data = await response.json();
      setIsConnected(data.isConnected);
      if (data.qrCode) {
        setQrCode(data.qrCode);
      }
    } catch (error) {
      console.error('خطأ في فحص حالة الاتصال:', error);
    }
  };

  const startWhatsApp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp-baileys/start', {
        method: 'POST'
      });
      
      if (response.ok) {
        // بدء فحص QR Code كل ثانيتين
        const interval = setInterval(async () => {
          const statusResponse = await fetch('/api/whatsapp-baileys/status');
          const statusData = await statusResponse.json();
          
          if (statusData.qrCode) {
            setQrCode(statusData.qrCode);
          }
          
          if (statusData.isConnected) {
            setIsConnected(true);
            setQrCode(null);
            clearInterval(interval);
          }
        }, 2000);

        // إيقاف الفحص بعد 5 دقائق
        setTimeout(() => clearInterval(interval), 300000);
      }
    } catch (error) {
      console.error('خطأ في بدء WhatsApp:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !phoneNumber.trim()) {
      alert('يرجى إدخال رقم الهاتف والرسالة');
      return;
    }

    try {
      const response = await fetch('/api/whatsapp-baileys/send-message', {
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
        setMessage('');
        setPhoneNumber('');
        loadMessages();
        alert('تم إرسال الرسالة بنجاح!');
      } else {
        alert('فشل في إرسال الرسالة');
      }
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      alert('حدث خطأ في إرسال الرسالة');
    }
  };

  const disconnect = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsConnected(false);
        setQrCode(null);
        alert('تم قطع الاتصال');
      }
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/messages');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('خطأ في تحميل الرسائل:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/stats');
      const data = await response.json();
      setStats(data.stats || stats);
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ar-EG');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-green-600 rounded-full">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              WhatsApp Business - Baileys
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            نظام إدارة WhatsApp المتطور باستخدام تقنية Baileys
          </p>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الرسائل</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">رسائل اليوم</p>
                <p className="text-2xl font-bold text-gray-800">{stats.todayMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المحادثات النشطة</p>
                <p className="text-2xl font-bold text-gray-800">{stats.activeChats}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* حالة الاتصال */}
          <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${isConnected ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="w-6 h-6 text-green-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-red-600" />
                )}
                حالة الاتصال
              </h2>
              <div className={`px-4 py-2 rounded-full text-lg font-bold shadow-md ${
                isConnected
                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                  : 'bg-red-100 text-red-800 border-2 border-red-300'
              }`}>
                {isConnected ? '🟢 متصل' : '🔴 غير متصل'}
              </div>
            </div>

            {!isConnected ? (
              <div className="text-center">
                {!qrCode ? (
                  <div>
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <p className="text-blue-800 font-medium text-lg text-center">
                        📱 لربط حساب WhatsApp، اضغط على الزر أدناه
                      </p>
                      <p className="text-blue-600 text-sm text-center mt-2">
                        سيتم إنشاء QR Code لمسحه بهاتفك
                      </p>
                    </div>
                    <button
                      onClick={startWhatsApp}
                      disabled={isLoading}
                      className="w-full bg-green-200 text-green-900 py-5 px-8 rounded-xl hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl shadow-xl border-4 border-green-600 transform hover:scale-105 transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <RefreshCw className="w-6 h-6 animate-spin" />
                          <span className="text-lg">جاري التحميل...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <Phone className="w-6 h-6" />
                          <span className="text-xl">🚀 بدء WhatsApp</span>
                        </div>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-4">
                      امسح هذا الكود بكاميرا WhatsApp في هاتفك
                    </p>
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                          alt="WhatsApp QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      افتح WhatsApp → الإعدادات → الأجهزة المرتبطة → ربط جهاز
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-green-600 mb-4">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-lg font-medium">تم ربط WhatsApp بنجاح!</p>
                  <p className="text-sm text-gray-600">يمكنك الآن إرسال واستقبال الرسائل</p>
                </div>
                <button
                  onClick={disconnect}
                  className="bg-red-200 text-red-900 px-8 py-3 rounded-lg hover:bg-red-300 font-bold text-lg shadow-lg border-2 border-red-600"
                >
                  🔌 قطع الاتصال
                </button>
              </div>
            )}
          </div>

          {/* إرسال رسالة */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              إرسال رسالة
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="مثال: 201234567890"
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرسالة
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  rows={4}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-medium"
                />
              </div>
              
              <button
                onClick={sendMessage}
                disabled={!isConnected}
                className="w-full bg-green-200 text-green-900 py-4 rounded-lg hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg border-2 border-green-600"
              >
                📤 إرسال الرسالة
              </button>
            </div>
          </div>
        </div>

        {/* الرسائل الأخيرة */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              الرسائل الأخيرة
            </h2>
            <button
              onClick={loadMessages}
              className="bg-blue-200 text-blue-900 px-4 py-2 rounded-lg hover:bg-blue-300 flex items-center gap-2 font-bold shadow-md border-2 border-blue-600"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد رسائل حتى الآن</p>
                <p className="text-sm">ستظهر الرسائل هنا عند بدء استخدام WhatsApp</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    msg.message_type === 'incoming'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {msg.phone_number}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        msg.message_type === 'incoming' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {msg.message_type === 'incoming' ? 'واردة' : 'صادرة'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{msg.message_text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* معلومات */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            ℹ️ معلومات النظام
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
            <ul className="space-y-2">
              <li>• نظام WhatsApp متطور باستخدام Baileys</li>
              <li>• اتصال مباشر بدون متصفح</li>
              <li>• دعم الرسائل النصية والوسائط</li>
            </ul>
            <ul className="space-y-2">
              <li>• ردود تلقائية ذكية بالذكاء الاصطناعي</li>
              <li>• إحصائيات مفصلة للرسائل</li>
              <li>• حفظ تلقائي لجميع المحادثات</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBaileys;
