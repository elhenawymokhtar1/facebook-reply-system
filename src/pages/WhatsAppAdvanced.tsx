import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Wifi, 
  WifiOff, 
  Search, 
  Settings,
  BarChart3,
  Users,
  Phone,
  Video
} from 'lucide-react';
import WhatsAppChat from '../components/WhatsAppChat';
import ChatSearch from '../components/ChatSearch';
import FileUpload from '../components/FileUpload';
import EmojiPicker from '../components/EmojiPicker';
import VoiceRecorder from '../components/VoiceRecorder';

const WhatsAppAdvanced: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'analytics' | 'settings'>('chat');
  
  // حالات النوافذ المنبثقة
  const [showSearch, setShowSearch] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  // إحصائيات
  const [stats, setStats] = useState({
    totalMessages: 0,
    todayMessages: 0,
    activeChats: 0,
    responseTime: '2.5 دقيقة'
  });

  useEffect(() => {
    checkConnectionStatus();
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

  const loadStats = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/stats');
      const data = await response.json();
      setStats(data.stats || stats);
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
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

  const handleSendMessage = async (phoneNumber: string, message: string) => {
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
        console.log('تم إرسال الرسالة بنجاح');
        loadStats(); // تحديث الإحصائيات
      } else {
        console.error('فشل في إرسال الرسالة');
      }
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
    }
  };

  const handleSendFile = async (file: File, caption?: string) => {
    console.log('إرسال ملف:', file.name, caption);
    // يمكن إضافة منطق رفع الملف هنا
  };

  const handleSendVoice = async (audioBlob: Blob, duration: number) => {
    console.log('إرسال رسالة صوتية:', duration, 'ثانية');
    // يمكن إضافة منطق رفع الملف الصوتي هنا
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
          case 'u':
            e.preventDefault();
            setShowFileUpload(true);
            break;
          case 'r':
            e.preventDefault();
            setShowVoiceRecorder(true);
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowFileUpload(false);
        setShowEmojiPicker(false);
        setShowVoiceRecorder(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
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
                  WhatsApp Business Pro
                </h1>
                <p className="text-sm text-gray-600">
                  نظام إدارة محادثات متقدم
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* حالة الاتصال */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  متصل
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  غير متصل
                </>
              )}
            </div>

            {/* أزرار التنقل */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('chat')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentView === 'chat'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                المحادثات
              </button>
              
              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentView === 'analytics'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                الإحصائيات
              </button>
              
              <button
                onClick={() => setCurrentView('settings')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentView === 'settings'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                الإعدادات
              </button>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                title="بحث (Ctrl+F)"
              >
                <Search className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowFileUpload(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                title="إرسال ملف (Ctrl+U)"
              >
                <Phone className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowVoiceRecorder(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                title="رسالة صوتية (Ctrl+R)"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1">
        {currentView === 'chat' && (
          <div className="h-[calc(100vh-80px)]">
            {isConnected ? (
              <WhatsAppChat
                isConnected={isConnected}
                onSendMessage={handleSendMessage}
              />
            ) : (
              /* شاشة الربط */
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center max-w-md">
                  {!qrCode ? (
                    <div>
                      <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageCircle className="w-16 h-16 text-green-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        مرحباً بك في WhatsApp Business Pro
                      </h2>
                      <p className="text-gray-600 mb-6">
                        لبدء استخدام النظام، يجب ربط حساب WhatsApp الخاص بك
                      </p>
                      <button
                        onClick={startWhatsApp}
                        disabled={isLoading}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                      >
                        {isLoading ? 'جاري التحميل...' : 'ربط WhatsApp'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-4">
                        امسح QR Code
                      </h2>
                      <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                          alt="WhatsApp QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        افتح WhatsApp → الإعدادات → الأجهزة المرتبطة → ربط جهاز
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'analytics' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">الإحصائيات والتحليلات</h2>
            
            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
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

              <div className="bg-white rounded-lg shadow p-6">
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

              <div className="bg-white rounded-lg shadow p-6">
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

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Phone className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">متوسط الاستجابة</p>
                    <p className="text-lg font-bold text-gray-800">{stats.responseTime}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                قريباً: رسوم بيانية تفاعلية
              </h3>
              <p className="text-gray-600">
                ستتوفر قريباً رسوم بيانية مفصلة لتحليل أداء المحادثات والمبيعات
              </p>
            </div>
          </div>
        )}

        {currentView === 'settings' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">الإعدادات</h2>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                إعدادات الاتصال
              </h3>
              
              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">متصل بـ WhatsApp</p>
                      <p className="text-sm text-green-600">النظام يعمل بشكل طبيعي</p>
                    </div>
                    <button
                      onClick={disconnect}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      قطع الاتصال
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-800">غير متصل</p>
                      <p className="text-sm text-red-600">يجب ربط حساب WhatsApp</p>
                    </div>
                    <button
                      onClick={startWhatsApp}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      ربط الحساب
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* النوافذ المنبثقة */}
      <ChatSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectResult={handleSearchResult}
      />

      <FileUpload
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onSendFile={handleSendFile}
      />

      <VoiceRecorder
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onSendVoice={handleSendVoice}
      />
    </div>
  );
};

export default WhatsAppAdvanced;
