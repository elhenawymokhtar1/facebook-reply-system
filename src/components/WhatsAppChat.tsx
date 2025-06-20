import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Search,
  Paperclip,
  Smile,
  Mic,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Check,
  CheckCheck
} from 'lucide-react';
import FileUpload from './FileUpload';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
  status?: 'sent' | 'delivered' | 'read';
  messageType?: 'text' | 'image' | 'audio' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface WhatsAppChatProps {
  isConnected: boolean;
  onSendMessage: (phoneNumber: string, message: string) => void;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({ isConnected, onSendMessage }) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحميل جهات الاتصال الحقيقية
  useEffect(() => {
    loadContacts();

    // تحديث دوري كل 30 ثانية
    const interval = setInterval(loadContacts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadContacts = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/whatsapp-baileys/messages');
      const data = await response.json();

      if (data.success && data.messages) {
        // تجميع الرسائل حسب رقم الهاتف
        const contactsMap = new Map<string, Contact>();

        data.messages.forEach((msg: any) => {
          const phoneNumber = msg.phone_number;
          const existing = contactsMap.get(phoneNumber);

          if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessageTime || '')) {
            contactsMap.set(phoneNumber, {
              id: phoneNumber,
              name: msg.contact_name || `مستخدم ${phoneNumber.slice(-4)}`,
              phone: phoneNumber,
              lastMessage: msg.message_text,
              lastMessageTime: new Date(msg.timestamp).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              unreadCount: msg.message_type === 'incoming' ? 1 : 0,
              isOnline: Math.random() > 0.5 // محاكاة حالة الاتصال
            });
          }
        });

        setContacts(Array.from(contactsMap.values()));
      }
    } catch (error) {
      console.error('خطأ في تحميل جهات الاتصال:', error);
    }
  };

  // تحميل رسائل المحادثة المحددة
  useEffect(() => {
    if (selectedContact) {
      loadConversationMessages(selectedContact.phone);
    }
  }, [selectedContact]);

  const loadConversationMessages = async (phoneNumber: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/whatsapp-baileys/conversation/${phoneNumber}`);
      const data = await response.json();

      if (data.success && data.messages) {
        const formattedMessages: Message[] = data.messages.map((msg: any) => {
          // تحديد نوع الرسالة من النص
          let messageType: 'text' | 'image' | 'audio' | 'file' = 'text';
          let fileUrl: string | undefined;
          let fileName: string | undefined;

          // إذا كانت الرسالة تحتوي على ملف
          if (msg.message_text && msg.message_text.includes('📎')) {
            // استخراج اسم الملف من النص
            const fileMatch = msg.message_text.match(/📎\s*(.+?)(?:\s*-|$|\s*\()/);
            if (fileMatch) {
              fileName = fileMatch[1].trim();

              // تحديد نوع الملف من الامتداد
              const lowerFileName = fileName.toLowerCase();
              if (lowerFileName.includes('.jpg') || lowerFileName.includes('.jpeg') ||
                  lowerFileName.includes('.png') || lowerFileName.includes('.gif') ||
                  lowerFileName.includes('.webp')) {
                messageType = 'image';
                fileUrl = `http://localhost:3002/api/whatsapp-baileys/files/${fileName}`;
              } else if (lowerFileName.includes('.mp3') || lowerFileName.includes('.wav') ||
                         lowerFileName.includes('.m4a') || lowerFileName.includes('.ogg')) {
                messageType = 'audio';
                fileUrl = `http://localhost:3002/api/whatsapp-baileys/files/${fileName}`;
              } else {
                messageType = 'file';
                fileUrl = `http://localhost:3002/api/whatsapp-baileys/files/${fileName}`;
              }
            }
          }

          return {
            id: msg.message_id || msg.id,
            text: msg.message_text,
            timestamp: new Date(msg.timestamp).toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: msg.message_type === 'incoming' ? 'incoming' : 'outgoing',
            status: msg.message_type === 'outgoing' ? 'read' : undefined,
            messageType,
            fileUrl,
            fileName
          };
        });

        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('خطأ في تحميل رسائل المحادثة:', error);
    }
  };

  // التمرير التلقائي للأسفل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // تحديث دوري للرسائل الجديدة
  useEffect(() => {
    if (!selectedContact) return;

    const interval = setInterval(() => {
      loadConversationMessages(selectedContact.phone);
    }, 5000); // تحديث كل 5 ثوانٍ

    return () => clearInterval(interval);
  }, [selectedContact]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact || isSending) return;

    setIsSending(true);
    const messageText = message;
    setMessage(''); // مسح الحقل فوراً

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      type: 'outgoing',
      status: 'sent'
    };

    // إضافة الرسالة فوراً للواجهة
    setMessages(prev => [...prev, newMessage]);

    try {
      // إرسال الرسالة
      await onSendMessage(selectedContact.phone, messageText);

      // تحديث الرسائل بعد الإرسال
      setTimeout(() => {
        loadConversationMessages(selectedContact.phone);
        loadContacts(); // تحديث قائمة جهات الاتصال
      }, 1000);
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      // إزالة الرسالة في حالة الفشل
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
      setMessage(messageText); // إعادة النص للحقل
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (file: File, caption?: string) => {
    if (file && selectedContact) {
      console.log('File selected:', file.name, caption);

      try {
        // إنشاء FormData لرفع الملف
        const formData = new FormData();
        formData.append('file', file);
        formData.append('phoneNumber', selectedContact.phone);
        if (caption) {
          formData.append('caption', caption);
        }

        // إضافة رسالة مؤقتة للواجهة
        const tempMessage: Message = {
          id: Date.now().toString(),
          text: caption || `📎 ${file.name}`,
          timestamp: new Date().toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: 'outgoing',
          status: 'sent',
          messageType: file.type.startsWith('image/') ? 'image' : 'file',
          fileUrl: URL.createObjectURL(file),
          fileName: file.name
        };

        setMessages(prev => [...prev, tempMessage]);

        // رفع الملف إلى الخادم
        console.log('📎 [CHAT] إرسال ملف إلى:', '/api/whatsapp-baileys/send-file');

        const response = await fetch('http://localhost:3002/api/whatsapp-baileys/send-file', {
          method: 'POST',
          body: formData
        });

        console.log('📎 [CHAT] استجابة الخادم:', response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ [CHAT] تم رفع الملف بنجاح:', result);

          // تحديث حالة الرسالة مع URL الملف الصحيح
          setMessages(prev =>
            prev.map(msg =>
              msg.id === tempMessage.id
                ? {
                    ...msg,
                    status: 'delivered',
                    fileUrl: result.fileUrl ? `http://localhost:3002${result.fileUrl}` : msg.fileUrl
                  }
                : msg
            )
          );

          // تحديث الرسائل بعد الرفع
          setTimeout(() => {
            loadConversationMessages(selectedContact.phone);
          }, 1000);
        } else {
          const errorText = await response.text();
          console.error('❌ [CHAT] فشل في رفع الملف:', errorText);

          // إزالة الرسالة المؤقتة في حالة الفشل
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
          alert('فشل في إرسال الملف');
        }
      } catch (error) {
        console.error('خطأ في رفع الملف:', error);
        alert('حدث خطأ في إرسال الملف');
      }
    }
  };

  const handleVoiceMessage = (audioBlob: Blob, duration: number) => {
    if (selectedContact) {
      console.log('Voice message:', duration, 'seconds');

      // إضافة رسالة صوتية للمحادثة
      const newMessage: Message = {
        id: Date.now().toString(),
        text: `🎵 رسالة صوتية (${Math.floor(duration)}s)`,
        timestamp: new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: 'outgoing',
        status: 'sent',
        messageType: 'audio',
        fileUrl: URL.createObjectURL(audioBlob)
      };

      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  const emojis = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'];

  const formatTime = (timestamp: string) => {
    return timestamp;
  };

  const getMessageStatus = (status?: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-white rounded-lg overflow-hidden shadow-sm">
      {/* قائمة جانبية للمحادثات */}
      <div className="w-80 md:w-80 sm:w-full bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* رأس القائمة الجانبية */}
        <div className="p-4 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">المحادثات</h2>

          {/* شريط البحث */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
        </div>

        {/* قائمة المحادثات */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">لا توجد محادثات بعد</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${
                  selectedContact?.id === contact.id ? 'bg-white border-r-4 border-green-500 shadow-sm' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* صورة المستخدم */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {contact.name.charAt(0)}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* معلومات المحادثة */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-medium text-gray-900 truncate text-sm">{contact.name}</h3>
                      <span className="text-xs text-gray-500">{contact.lastMessageTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-600 truncate">{contact.lastMessage}</p>
                      {contact.unreadCount && contact.unreadCount > 0 && (
                        <span className="bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* منطقة المحادثة */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* رأس المحادثة */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedContact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{selectedContact.name}</h3>
                  <p className="text-xs text-gray-500">{selectedContact.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* منطقة الرسائل */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">ابدأ محادثة جديدة</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm ${
                        msg.type === 'outgoing'
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                    {/* عرض الصور */}
                    {msg.messageType === 'image' && msg.fileUrl && (
                      <div className="mb-2">
                        <img
                          src={msg.fileUrl}
                          alt="صورة"
                          className="max-w-full h-auto rounded-lg cursor-pointer"
                          onClick={() => window.open(msg.fileUrl, '_blank')}
                        />
                      </div>
                    )}

                    {/* عرض الملفات الصوتية */}
                    {msg.messageType === 'audio' && msg.fileUrl && (
                      <div className="mb-2">
                        <audio controls className="w-full">
                          <source src={msg.fileUrl} type="audio/mpeg" />
                          متصفحك لا يدعم تشغيل الملفات الصوتية
                        </audio>
                      </div>
                    )}

                    {/* عرض الملفات الأخرى */}
                    {msg.messageType === 'file' && msg.fileName && (
                      <div className="mb-2 flex items-center gap-2 p-2 bg-gray-100 rounded">
                        <div className="text-2xl">📎</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{msg.fileName}</p>
                          {msg.fileUrl && (
                            <a
                              href={msg.fileUrl}
                              download={msg.fileName}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              تحميل
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* نص الرسالة */}
                    {msg.text && (
                      <p className="text-sm">{msg.text}</p>
                    )}

                      <div className={`flex items-center justify-end mt-1 gap-1 ${
                        msg.type === 'outgoing' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">{formatTime(msg.timestamp)}</span>
                        {msg.type === 'outgoing' && getMessageStatus(msg.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* منطقة كتابة الرسالة */}
            <div className="bg-white border-t border-gray-200 p-3 relative">
              <div className="flex items-end gap-2">
                {/* زر الملفات */}
                <button
                  onClick={() => setShowFileUpload(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="إرسال ملف"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* حقل النص */}
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="اكتب رسالة..."
                    rows={1}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
                  />

                  {/* زر الإيموجي */}
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                    title="إيموجي"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                {/* زر الإرسال أو التسجيل */}
                {message.trim() ? (
                  <button
                    onClick={handleSendMessage}
                    disabled={!isConnected || isSending}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                    title="إرسال"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowVoiceRecorder(true)}
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="رسالة صوتية"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* محدد الإيموجي */}
              <EmojiPicker
                isOpen={showEmojiPicker}
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          </>
        ) : (
          /* شاشة عدم اختيار محادثة */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">WhatsApp Business</h3>
              <p className="text-sm text-gray-600">اختر محادثة لبدء المراسلة</p>
            </div>
          </div>
        )}
      </div>

      {/* النوافذ المنبثقة */}
      <FileUpload
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onSendFile={handleFileUpload}
      />

      <VoiceRecorder
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onSendVoice={handleVoiceMessage}
      />
    </div>
  );
};

export default WhatsAppChat;
