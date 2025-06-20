import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Phone,
  Settings,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const WhatsAppConnection: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // إحصائيات
  const [stats, setStats] = useState({
    totalMessages: 0,
    todayMessages: 0,
    activeChats: 0,
    responseTime: '2.5 دقيقة'
  });

  // إعدادات
  const [settings, setSettings] = useState({
    autoReply: true,
    welcomeMessage: 'مرحباً بك! كيف يمكنني مساعدتك؟',
    businessHours: '9:00 - 18:00'
  });

  useEffect(() => {
    checkConnectionStatus();
    loadStats();
    loadSettings();

    // مراقبة دورية لحالة الاتصال كل 5 ثوانٍ
    const interval = setInterval(() => {
      checkConnectionStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/status');
      const data = await response.json();
      setIsConnected(data.isConnected);
      setConnectionStatus(data.state || 'disconnected');
      if (data.qrCode) {
        setQrCode(data.qrCode);
      }
    } catch (error) {
      console.error('خطأ في فحص حالة الاتصال:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/settings');
      const data = await response.json();
      if (data.success) {
        setSettings({
          autoReply: data.settings.auto_reply_enabled,
          welcomeMessage: data.settings.welcome_message,
          businessHours: data.settings.business_hours || '9:00 - 18:00'
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
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
            loadStats(); // تحديث الإحصائيات
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

  const disconnect = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsConnected(false);
        setQrCode(null);
        setConnectionStatus('disconnected');
        alert('تم قطع الاتصال');
      }
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auto_reply_enabled: settings.autoReply,
          welcome_message: settings.welcomeMessage,
          business_hours: settings.businessHours
        })
      });

      if (response.ok) {
        alert('تم حفظ الإعدادات بنجاح');
      }
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
    }
  };

  const getStatusColor = () => {
    if (isConnected) return 'text-green-600';
    if (connectionStatus === 'connecting') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (isConnected) return <CheckCircle className="w-5 h-5" />;
    if (connectionStatus === 'connecting') return <RefreshCw className="w-5 h-5 animate-spin" />;
    return <XCircle className="w-5 h-5" />;
  };

  return (
    <div className="h-full bg-gray-100 overflow-y-auto">
      {/* شريط علوي */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  إدارة WhatsApp Business
                </h1>
                <p className="text-sm text-gray-600">
                  الربط والإعدادات والإحصائيات
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* حالة الاتصال */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 ${
              isConnected
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {getStatusIcon()}
              {isConnected ? 'متصل' : 'غير متصل'}
            </div>

            {/* زر الدردشة */}
            {isConnected && (
              <a
                href="/whatsapp-conversations"
                className="bg-green-200 text-green-900 px-6 py-2 rounded-lg hover:bg-green-300 flex items-center gap-2 font-bold border-2 border-green-600 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                فتح المحادثات
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المحادثات النشطة</p>
                <p className="text-2xl font-bold text-gray-800">{stats.activeChats}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">رسائل اليوم</p>
                <p className="text-2xl font-bold text-gray-800">{stats.todayMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">متوسط الاستجابة</p>
                <p className="text-lg font-bold text-gray-800">{stats.responseTime}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* قسم الربط */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              ربط WhatsApp
            </h2>

            {!isConnected ? (
              <div className="text-center">
                {!qrCode ? (
                  <div>
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-12 h-12 text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      ربط حساب WhatsApp
                    </h3>
                    <p className="text-gray-600 mb-6">
                      لبدء استخدام النظام، يجب ربط حساب WhatsApp الخاص بك
                    </p>
                    <button
                      onClick={startWhatsApp}
                      disabled={isLoading}
                      className="bg-green-200 text-green-900 px-8 py-3 rounded-lg hover:bg-green-300 disabled:opacity-50 font-bold border-2 border-green-600 shadow-lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          جاري التحميل...
                        </div>
                      ) : (
                        'بدء الربط'
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      امسح QR Code بهاتفك
                    </h3>
                    <div className="bg-gray-50 p-6 rounded-lg mb-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                        alt="WhatsApp QR Code"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>1. افتح WhatsApp في هاتفك</p>
                      <p>2. اذهب إلى الإعدادات → الأجهزة المرتبطة</p>
                      <p>3. اضغط على "ربط جهاز"</p>
                      <p>4. امسح الكود أعلاه</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  تم الربط بنجاح!
                </h3>
                <p className="text-gray-600 mb-6">
                  حساب WhatsApp متصل ويعمل بشكل طبيعي
                </p>
                <div className="flex gap-3 justify-center">
                  <a
                    href="/whatsapp-conversations"
                    className="bg-green-200 text-green-900 px-6 py-2 rounded-lg hover:bg-green-300 flex items-center gap-2 font-bold border-2 border-green-600 shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" />
                    فتح المحادثات
                  </a>
                  <button
                    onClick={disconnect}
                    className="bg-red-200 text-red-900 px-6 py-2 rounded-lg hover:bg-red-300 font-bold border-2 border-red-600 shadow-md"
                  >
                    قطع الاتصال
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* قسم الإعدادات */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              الإعدادات
            </h2>

            <div className="space-y-6">
              {/* الرد التلقائي */}
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.autoReply}
                    onChange={(e) => setSettings({...settings, autoReply: e.target.checked})}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="font-medium text-gray-700">تفعيل الرد التلقائي</span>
                </label>
              </div>

              {/* رسالة الترحيب */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رسالة الترحيب
                </label>
                <textarea
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings({...settings, welcomeMessage: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* ساعات العمل */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ساعات العمل
                </label>
                <input
                  type="text"
                  value={settings.businessHours}
                  onChange={(e) => setSettings({...settings, businessHours: e.target.value})}
                  placeholder="9:00 - 18:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                onClick={saveSettings}
                className="w-full bg-blue-200 text-blue-900 py-2 rounded-lg hover:bg-blue-300 font-bold border-2 border-blue-600 shadow-md"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConnection;
