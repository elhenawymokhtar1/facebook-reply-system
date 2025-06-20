import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MessageSquare, RefreshCw, Phone } from "lucide-react";

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface WhatsAppConversationsListProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  isConnected: boolean;
}

const WhatsAppConversationsList = ({ 
  selectedConversation, 
  onSelectConversation, 
  isConnected 
}: WhatsAppConversationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('all');

  // تحميل جهات الاتصال
  useEffect(() => {
    if (isConnected) {
      loadContacts(true); // تحميل أولي مع loader

      // تحديث دوري كل 10 ثوانٍ بدون loader
      const interval = setInterval(() => loadContacts(false), 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const loadContacts = async (showLoader = true) => {
    if (!isConnected) return;

    if (showLoader) setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3002/api/whatsapp-baileys/contacts');
      const data = await response.json();

      if (data.success && data.contacts) {
        const formattedContacts: WhatsAppContact[] = data.contacts.map((contact: any) => ({
          id: contact.phone,
          name: contact.name || contact.phone,
          phone: contact.phone,
          lastMessage: contact.lastMessage || 'لا توجد رسائل',
          lastMessageTime: contact.lastMessageTime || '',
          unreadCount: contact.unreadCount || 0,
          isOnline: contact.isOnline || false
        }));

        // تحديث جهات الاتصال فقط إذا كان هناك تغيير
        setContacts(prevContacts => {
          if (JSON.stringify(prevContacts) !== JSON.stringify(formattedContacts)) {
            return formattedContacts;
          }
          return prevContacts;
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل جهات الاتصال:', error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  // تصفية المحادثات
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'unread' && contact.unreadCount && contact.unreadCount > 0);
    
    return matchesSearch && matchesStatus;
  });

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return date.toLocaleDateString('ar-EG', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return timeString;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Phone className="w-3 h-3 text-white" />
            </div>
            محادثات الواتساب
          </CardTitle>
          <Button
            onClick={() => loadContacts(true)}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={!isConnected || isLoading}
          >
            <RefreshCw className={`w-3 h-3 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* شريط البحث */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="البحث في المحادثات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
            disabled={!isConnected}
          />
        </div>

        {/* فلاتر الحالة */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="text-xs"
          >
            الكل ({contacts.length})
          </Button>
          <Button
            variant={statusFilter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('unread')}
            className="text-xs"
          >
            غير مقروءة ({contacts.filter(c => c.unreadCount && c.unreadCount > 0).length})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-scroll p-0" style={{maxHeight: 'calc(100vh - 300px)'}}>
        {!isConnected ? (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-red-500" />
              </div>
              <p className="font-medium">الواتساب غير متصل</p>
              <p className="text-sm mt-2">يرجى الاتصال بالواتساب أولاً</p>
              <a 
                href="/whatsapp" 
                className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm underline"
              >
                إعداد الاتصال
              </a>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="mr-2">تحميل المحادثات...</span>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد محادثات</p>
              <p className="text-sm mt-2">ستظهر المحادثات هنا عند وصول رسائل جديدة</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onSelectConversation(contact.phone)}
                className={`p-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50 ${
                  selectedConversation === contact.phone ? 'bg-green-50 border-r-4 border-r-green-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  {/* صورة المستخدم */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* معلومات المحادثة */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {contact.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {contact.unreadCount && contact.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {contact.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(contact.lastMessageTime || '')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {contact.phone}
                    </p>
                    
                    {contact.lastMessage && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {contact.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppConversationsList;
