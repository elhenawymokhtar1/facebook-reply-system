import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardContent, SimpleCardTitle, SimpleButton, SimpleInput } from './SimpleUI';

const SimpleConversationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // بيانات تجريبية للمحادثات
  const conversations = [
    {
      id: 1,
      senderName: 'أحمد محمد',
      lastMessage: 'عايز أشوف كوتشي أزرق مقاس 42',
      timestamp: '2024-01-15 14:30',
      status: 'جديد',
      unreadCount: 2
    },
    {
      id: 2,
      senderName: 'فاطمة علي',
      lastMessage: 'ممكن أشوف الألوان المتاحة؟',
      timestamp: '2024-01-15 14:25',
      status: 'تم الرد',
      unreadCount: 0
    },
    {
      id: 3,
      senderName: 'محمود حسن',
      lastMessage: 'شكراً لكم، الكوتشي وصل بحالة ممتازة',
      timestamp: '2024-01-15 14:20',
      status: 'مكتمل',
      unreadCount: 0
    },
    {
      id: 4,
      senderName: 'سارة أحمد',
      lastMessage: 'عندكم كوتشي أطفال أبيض؟',
      timestamp: '2024-01-15 14:15',
      status: 'جديد',
      unreadCount: 1
    },
    {
      id: 5,
      senderName: 'خالد محمود',
      lastMessage: 'أريد معرفة الأسعار',
      timestamp: '2024-01-15 14:10',
      status: 'قيد المراجعة',
      unreadCount: 3
    }
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.senderName.includes(searchTerm) || conv.lastMessage.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جديد': return 'bg-blue-100 text-blue-800';
      case 'تم الرد': return 'bg-green-100 text-green-800';
      case 'مكتمل': return 'bg-gray-100 text-gray-800';
      case 'قيد المراجعة': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <span className="text-white font-bold">FB</span>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">المحادثات</h1>
                <p className="text-sm text-gray-500">إدارة رسائل العملاء</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/">
                <SimpleButton variant="ghost">🏠 الرئيسية</SimpleButton>
              </Link>


            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                💬 المحادثات
              </h1>
              <p className="text-gray-600">
                إدارة ومتابعة رسائل العملاء
              </p>
            </div>
            <SimpleButton>
              ➕ محادثة جديدة
            </SimpleButton>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <SimpleInput
            placeholder="🔍 البحث في المحادثات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SimpleCard>
            <SimpleCardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {conversations.filter(c => c.status === 'جديد').length}
                </div>
                <div className="text-sm text-gray-600">محادثات جديدة</div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
          
          <SimpleCard>
            <SimpleCardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {conversations.filter(c => c.status === 'تم الرد').length}
                </div>
                <div className="text-sm text-gray-600">تم الرد عليها</div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
          
          <SimpleCard>
            <SimpleCardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {conversations.filter(c => c.status === 'قيد المراجعة').length}
                </div>
                <div className="text-sm text-gray-600">قيد المراجعة</div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
          
          <SimpleCard>
            <SimpleCardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {conversations.filter(c => c.status === 'مكتمل').length}
                </div>
                <div className="text-sm text-gray-600">مكتملة</div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Conversations List */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>📋 قائمة المحادثات ({filteredConversations.length})</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="space-y-4">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {conversation.senderName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{conversation.senderName}</h3>
                      <p className="text-gray-600 text-sm">{conversation.lastMessage}</p>
                      <p className="text-gray-400 text-xs">{conversation.timestamp}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {conversation.unreadCount}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                      {conversation.status}
                    </span>
                    <SimpleButton size="sm" variant="outline">
                      عرض
                    </SimpleButton>
                  </div>
                </div>
              ))}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500">
          <p>💡 يتم تحديث المحادثات تلقائياً كل 30 ثانية</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleConversationsPage;
