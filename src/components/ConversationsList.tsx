
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, User, Clock, MessageSquare, Loader2, Trash2, CheckCircle, AlertCircle, Archive } from "lucide-react";
import { useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConversationsListProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
}

const ConversationsList = ({ selectedConversation, onSelectConversation }: ConversationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'replied'>('all');
  const { conversations, isLoading, error, refetch } = useConversations();

  // إضافة logs للكومبوننت
  console.log('🎯 [ConversationsList] Component state:', {
    conversationsCount: conversations.length,
    isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    searchTerm,
    selectedConversation
  });

  console.log('📋 [ConversationsList] Conversations data:', conversations.slice(0, 3));

  // حذف المحادثة
  const deleteConversation = async (conversationId: string) => {
    try {
      setDeletingConversation(conversationId);

      // حذف الرسائل أولاً
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        throw messagesError;
      }

      // حذف الطلبات المرتبطة (إن وجدت)
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('conversation_id', conversationId);

      if (ordersError) {
        console.warn('Error deleting related orders:', ordersError);
      }

      // حذف المحادثة
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (conversationError) {
        throw conversationError;
      }

      toast.success('تم حذف المحادثة بنجاح');

      // إذا كانت المحادثة المحذوفة هي المحددة، قم بإلغاء التحديد
      if (selectedConversation === conversationId) {
        onSelectConversation('');
      }

      // إعادة تحميل المحادثات
      refetch();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('فشل في حذف المحادثة');
    } finally {
      setDeletingConversation(null);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!conv) return false;

    const customerName = conv.customer_name || '';
    const lastMessage = conv.last_message || '';

    // فلترة البحث
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lastMessage.toLowerCase().includes(searchTerm.toLowerCase());

    // فلترة الحالة بناءً على الرسائل
    let matchesStatus = true;
    if (statusFilter === 'unread') {
      // غير مقروء = يوجد رسائل من العميل لم يتم الرد عليها
      matchesStatus = conv.unread_count > 0;
    } else if (statusFilter === 'replied') {
      // مرسل = لا توجد رسائل غير مقروءة (تم الرد على كل شيء)
      matchesStatus = conv.unread_count === 0;
    }

    return matchesSearch && matchesStatus;
  });

  console.log('🔍 [ConversationsList] Filtered conversations:', {
    originalCount: conversations.length,
    filteredCount: filteredConversations.length,
    searchTerm,
    unreadCount: conversations.filter(c => c.unread_count > 0).length,
    repliedCount: conversations.filter(c => c.unread_count === 0).length
  });

  // تشخيص إضافي للمحادثات
  console.log('📊 [ConversationsList] Conversations analysis:',
    conversations.map(c => ({
      id: c.id,
      customer_name: c.customer_name,
      unread_count: c.unread_count,
      last_message: c.last_message?.substring(0, 30) + '...'
    }))
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  if (error) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p>خطأ في تحميل المحادثات</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg">المحادثات</CardTitle>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            🔄 تحديث
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="البحث في المحادثات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* فلاتر الرسائل البسيطة */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="text-xs"
          >
            <MessageSquare className="w-3 h-3 ml-1" />
            الكل ({conversations.length})
          </Button>

          <Button
            variant={statusFilter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('unread')}
            className="text-xs"
          >
            <AlertCircle className="w-3 h-3 ml-1 text-red-600" />
            غير مقروء ({conversations.filter(c => c.unread_count > 0).length})
          </Button>

          <Button
            variant={statusFilter === 'replied' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('replied')}
            className="text-xs"
          >
            <CheckCircle className="w-3 h-3 ml-1 text-green-600" />
            مرسل ({conversations.filter(c => c.unread_count === 0).length})
          </Button>
        </div>

        {/* معلومات التشخيص وإحصائيات الصفحات */}
        <div className="mt-2 space-y-2">
          <div className="text-xs text-gray-500">
            📊 المحادثات: {conversations.length} | 🔍 المفلترة: {filteredConversations.length} |
            {isLoading ? ' 🔄 جاري التحميل...' : ' ✅ تم التحميل'}
            {error && ' ❌ خطأ'}
          </div>

          {/* إحصائيات الصفحات */}
          {conversations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(() => {
                const pageStats = conversations.reduce((acc, conv) => {
                  const pageName = conv.page_name ||
                    (conv.facebook_page_id === '260345600493273' ? 'Swan shop' :
                     conv.facebook_page_id === '240244019177739' ? 'سولا 127' :
                     'صفحة غير معروفة');
                  acc[pageName] = (acc[pageName] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                return Object.entries(pageStats).map(([pageName, count]) => (
                  <span key={pageName} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    📄 {pageName}: {count}
                  </span>
                ));
              })()}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-scroll p-0" style={{maxHeight: 'calc(100vh - 300px)'}}>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="mr-2">تحميل المحادثات...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد محادثات</p>
              <p className="text-sm mt-2">ستظهر المحادثات هنا عند وصول رسائل جديدة</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {/* عرض المحادثات الحقيقية */}
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="flex items-center space-x-3 space-x-reverse flex-1 cursor-pointer"
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      {conversation.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {conversation.customer_name.startsWith('User ')
                          ? `عميل ${conversation.customer_facebook_id.slice(-6)}`
                          : conversation.customer_name}
                      </h4>
                      <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(conversation.last_message_at)}</span>
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-100 px-2 py-1 rounded-full text-blue-600">
                          📄 {conversation.page_name ||
                              (conversation.facebook_page_id === '260345600493273' ? 'Swan shop' :
                               conversation.facebook_page_id === '240244019177739' ? 'سولا 127' :
                               'صفحة غير معروفة')}
                        </span>

                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    {/* عداد الرسائل غير المقروءة */}
                    {conversation.unread_count > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}

                    {/* زر الحذف */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingConversation === conversation.id}
                        >
                          {deletingConversation === conversation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف المحادثة</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف محادثة "{conversation.customer_name.startsWith('User ')
                            ? `عميل ${conversation.customer_facebook_id.slice(-6)}`
                            : conversation.customer_name}"؟
                            <br />
                            سيتم حذف جميع الرسائل والطلبات المرتبطة بهذه المحادثة نهائياً.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteConversation(conversation.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div
                  className="cursor-pointer"
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.last_message || "لا توجد رسائل"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversationsList;
