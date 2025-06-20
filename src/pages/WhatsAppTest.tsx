import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const WhatsAppTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('201144069077');
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    checkStatus();
    loadMessages();
    loadStats();
  }, []);

  const checkStatus = async () => {
    try {
      addLog('فحص حالة الاتصال...');
      const response = await fetch('/api/whatsapp-baileys/status');
      const data = await response.json();
      
      setIsConnected(data.isConnected);
      setQrCode(data.qrCode);
      
      addLog(`حالة الاتصال: ${data.isConnected ? 'متصل' : 'غير متصل'}`);
      if (data.qrCode) {
        addLog('QR Code متاح');
      }
    } catch (error) {
      addLog(`خطأ في فحص الحالة: ${error}`);
    }
  };

  const startWhatsApp = async () => {
    setIsLoading(true);
    try {
      addLog('بدء خدمة WhatsApp...');
      const response = await fetch('/api/whatsapp-baileys/start', {
        method: 'POST'
      });
      
      const data = await response.json();
      addLog(`استجابة البدء: ${data.message}`);
      
      if (response.ok) {
        // فحص دوري للحالة
        const interval = setInterval(async () => {
          await checkStatus();
          if (isConnected) {
            clearInterval(interval);
          }
        }, 2000);
        
        setTimeout(() => clearInterval(interval), 60000);
      }
    } catch (error) {
      addLog(`خطأ في بدء WhatsApp: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.trim() || !testPhone.trim()) {
      addLog('يرجى إدخال الرسالة ورقم الهاتف');
      return;
    }

    try {
      addLog(`إرسال رسالة إلى ${testPhone}: ${testMessage}`);
      const response = await fetch('/api/whatsapp-baileys/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: testPhone,
          message: testMessage
        })
      });

      const data = await response.json();
      addLog(`نتيجة الإرسال: ${data.message || data.error}`);
      
      if (response.ok) {
        setTestMessage('');
        setTimeout(() => {
          loadMessages();
          loadStats();
        }, 1000);
      }
    } catch (error) {
      addLog(`خطأ في إرسال الرسالة: ${error}`);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/messages');
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
        addLog(`تم تحميل ${data.messages?.length || 0} رسالة`);
      }
    } catch (error) {
      addLog(`خطأ في تحميل الرسائل: ${error}`);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/whatsapp-baileys/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats || {});
        addLog(`تم تحميل الإحصائيات`);
      }
    } catch (error) {
      addLog(`خطأ في تحميل الإحصائيات: ${error}`);
    }
  };

  const disconnect = async () => {
    try {
      addLog('قطع الاتصال...');
      const response = await fetch('/api/whatsapp-baileys/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsConnected(false);
        setQrCode(null);
        addLog('تم قطع الاتصال بنجاح');
      }
    } catch (error) {
      addLog(`خطأ في قطع الاتصال: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            اختبار WhatsApp Baileys
          </h1>
          
          {/* حالة الاتصال */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-4 ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="font-medium">
              {isConnected ? 'متصل بـ WhatsApp' : 'غير متصل'}
            </span>
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={startWhatsApp}
              disabled={isLoading || isConnected}
              className="bg-green-200 text-green-900 px-4 py-2 rounded-lg hover:bg-green-300 disabled:opacity-50 font-bold border-2 border-green-600"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> : null}
              بدء WhatsApp
            </button>
            
            <button
              onClick={checkStatus}
              className="bg-blue-200 text-blue-900 px-4 py-2 rounded-lg hover:bg-blue-300 font-bold border-2 border-blue-600"
            >
              فحص الحالة
            </button>
            
            <button
              onClick={loadMessages}
              className="bg-purple-200 text-purple-900 px-4 py-2 rounded-lg hover:bg-purple-300 font-bold border-2 border-purple-600"
            >
              تحديث الرسائل
            </button>
            
            {isConnected && (
              <button
                onClick={disconnect}
                className="bg-red-200 text-red-900 px-4 py-2 rounded-lg hover:bg-red-300 font-bold border-2 border-red-600"
              >
                قطع الاتصال
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code */}
          {qrCode && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">QR Code</h2>
              <div className="text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                  alt="WhatsApp QR Code"
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-gray-600">امسح هذا الكود بهاتفك</p>
              </div>
            </div>
          )}

          {/* إرسال رسالة تجريبية */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">إرسال رسالة تجريبية</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="201234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرسالة
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <button
                onClick={sendTestMessage}
                disabled={!isConnected}
                className="w-full bg-green-200 text-green-900 py-2 rounded-lg hover:bg-green-300 disabled:opacity-50 font-bold border-2 border-green-600 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                إرسال
              </button>
            </div>
          </div>

          {/* الإحصائيات */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">الإحصائيات</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>إجمالي الرسائل:</span>
                <span className="font-bold">{stats.totalMessages || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>رسائل اليوم:</span>
                <span className="font-bold">{stats.todayMessages || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>المحادثات النشطة:</span>
                <span className="font-bold">{stats.activeChats || 0}</span>
              </div>
            </div>
          </div>

          {/* سجل الأحداث */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">سجل الأحداث</h2>
            <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center">لا توجد أحداث</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono text-gray-700">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* الرسائل الأخيرة */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">الرسائل الأخيرة ({messages.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد رسائل</p>
            ) : (
              messages.slice(0, 10).map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    msg.message_type === 'incoming'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{msg.phone_number}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message_text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      msg.message_type === 'incoming' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {msg.message_type === 'incoming' ? 'واردة' : 'صادرة'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTest;
