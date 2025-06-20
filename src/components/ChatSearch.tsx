import React, { useState, useEffect } from 'react';
import { Search, X, Calendar, User, MessageSquare, Filter } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'message' | 'contact';
  contactName: string;
  contactPhone: string;
  messageText?: string;
  timestamp?: string;
  messageType?: 'text' | 'image' | 'audio' | 'file';
}

interface ChatSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: SearchResult) => void;
}

const ChatSearch: React.FC<ChatSearchProps> = ({ isOpen, onClose, onSelectResult }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'messages' | 'contacts'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // بيانات تجريبية للبحث
  const sampleData: SearchResult[] = [
    {
      id: '1',
      type: 'contact',
      contactName: 'أحمد محمد',
      contactPhone: '201234567890'
    },
    {
      id: '2',
      type: 'message',
      contactName: 'فاطمة علي',
      contactPhone: '201144069077',
      messageText: 'مرحباً، أريد الاستفسار عن المنتجات',
      timestamp: '2024-01-15 10:30',
      messageType: 'text'
    },
    {
      id: '3',
      type: 'message',
      contactName: 'محمود حسن',
      contactPhone: '201555666777',
      messageText: 'شكراً لك على الخدمة الممتازة',
      timestamp: '2024-01-14 15:45',
      messageType: 'text'
    },
    {
      id: '4',
      type: 'message',
      contactName: 'سارة أحمد',
      contactPhone: '201777888999',
      messageText: 'متى موعد التسليم؟',
      timestamp: '2024-01-13 09:20',
      messageType: 'text'
    },
    {
      id: '5',
      type: 'contact',
      contactName: 'خالد عبدالله',
      contactPhone: '201999000111'
    },
    {
      id: '6',
      type: 'message',
      contactName: 'نور محمد',
      contactPhone: '201333444555',
      messageText: 'هل يمكنني إلغاء الطلب؟',
      timestamp: '2024-01-12 14:10',
      messageType: 'text'
    }
  ];

  // تنفيذ البحث
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    // محاكاة تأخير البحث
    const searchTimeout = setTimeout(() => {
      const filteredResults = sampleData.filter(item => {
        // فلترة حسب نوع البحث
        if (searchType === 'messages' && item.type !== 'message') return false;
        if (searchType === 'contacts' && item.type !== 'contact') return false;

        // فلترة حسب التاريخ
        if (dateFilter !== 'all' && item.timestamp) {
          const itemDate = new Date(item.timestamp);
          const now = new Date();
          const diffTime = now.getTime() - itemDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          switch (dateFilter) {
            case 'today':
              if (diffDays > 1) return false;
              break;
            case 'week':
              if (diffDays > 7) return false;
              break;
            case 'month':
              if (diffDays > 30) return false;
              break;
          }
        }

        // البحث في النص
        const query = searchQuery.toLowerCase();
        return (
          item.contactName.toLowerCase().includes(query) ||
          item.contactPhone.includes(query) ||
          (item.messageText && item.messageText.toLowerCase().includes(query))
        );
      });

      setSearchResults(filteredResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, searchType, dateFilter]);

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'اليوم';
    if (diffDays === 2) return 'أمس';
    if (diffDays <= 7) return `منذ ${diffDays} أيام`;
    
    return date.toLocaleDateString('ar-EG');
  };

  const getMessageTypeIcon = (type?: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'audio':
        return '🎵';
      case 'file':
        return '📎';
      default:
        return '💬';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        {/* رأس نافذة البحث */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Search className="w-5 h-5" />
              البحث في المحادثات
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* شريط البحث */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث في الرسائل والمحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
              autoFocus
            />
          </div>

          {/* فلاتر البحث */}
          <div className="flex flex-wrap gap-4">
            {/* نوع البحث */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">الكل</option>
                <option value="messages">الرسائل فقط</option>
                <option value="contacts">جهات الاتصال فقط</option>
              </select>
            </div>

            {/* فلتر التاريخ */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">كل الأوقات</option>
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
              </select>
            </div>
          </div>
        </div>

        {/* نتائج البحث */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="mr-3 text-gray-600">جاري البحث...</span>
            </div>
          ) : searchQuery.trim() === '' ? (
            <div className="text-center text-gray-500 mt-8">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">ابدأ بكتابة كلمة للبحث</p>
              <p className="text-sm mt-2">يمكنك البحث في أسماء جهات الاتصال، أرقام الهواتف، أو محتوى الرسائل</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">لا توجد نتائج</p>
              <p className="text-sm mt-2">جرب كلمات مختلفة أو غير الفلاتر</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                تم العثور على {searchResults.length} نتيجة
              </p>
              
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => onSelectResult(result)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* أيقونة النوع */}
                    <div className="flex-shrink-0">
                      {result.type === 'contact' ? (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                          {getMessageTypeIcon(result.messageType)}
                        </div>
                      )}
                    </div>

                    {/* محتوى النتيجة */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900">
                          {highlightText(result.contactName, searchQuery)}
                        </h3>
                        {result.timestamp && (
                          <span className="text-xs text-gray-500">
                            {formatDate(result.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        {highlightText(result.contactPhone, searchQuery)}
                      </p>
                      
                      {result.messageText && (
                        <p className="text-sm text-gray-700 truncate">
                          {highlightText(result.messageText, searchQuery)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          result.type === 'contact' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {result.type === 'contact' ? 'جهة اتصال' : 'رسالة'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* تذييل نافذة البحث */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>💡 نصائح: استخدم كلمات مفتاحية قصيرة للحصول على نتائج أفضل</span>
            </div>
            <div className="flex items-center gap-2">
              <span>اضغط</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd>
              <span>للإغلاق</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSearch;
