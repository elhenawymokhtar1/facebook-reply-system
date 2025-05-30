// API endpoint لمعالجة الرسائل من Webhook Server
import { AutoReplyService } from '@/services/autoReplyService';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessMessageRequest {
  senderId: string;
  messageText: string;
  messageId?: string;
  pageId: string;
  timestamp: number;
  imageUrl?: string;
}

export interface ProcessMessageResponse {
  success: boolean;
  message: string;
  autoReplyWasSent?: boolean;
  conversationId?: string;
}

// معالج الرسائل الواردة من Webhook
export async function processIncomingMessage(
  request: ProcessMessageRequest
): Promise<ProcessMessageResponse> {
  const { senderId, messageText, messageId, pageId, timestamp, imageUrl } = request;

  try {
    console.log(`Processing message from ${senderId}: "${messageText}"`);

    // الحصول على اسم المرسل (يمكن تحسينه لاحقاً)
    const senderName = await getSenderName(senderId) || `User ${senderId}`;

    // إنشاء أو الحصول على المحادثة
    const conversationId = await AutoReplyService.getOrCreateConversation(
      senderId,
      senderName,
      pageId
    );

    if (!conversationId) {
      throw new Error('Failed to create or get conversation');
    }

    // حفظ الرسالة الواردة (تجاهل المكررة)
    try {
      await saveIncomingMessage(conversationId, messageText, messageId, timestamp, imageUrl);
    } catch (error: any) {
      if (error.code === '23505') {
        console.log('⚠️ Duplicate message ignored:', messageId);
        return {
          success: true,
          message: 'Duplicate message ignored',
          autoReplyWasSent: false,
          conversationId
        };
      }
      throw error;
    }

    // معالجة الرد الآلي
    const autoReplyWasSent = await AutoReplyService.processIncomingMessage(
      senderId,
      messageText,
      conversationId
    );

    // تحديث المحادثة
    await updateConversation(conversationId, messageText);

    return {
      success: true,
      message: 'Message processed successfully',
      autoReplyWasSent,
      conversationId
    };

  } catch (error) {
    console.error('Error processing incoming message:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// حفظ الرسالة الواردة في قاعدة البيانات
async function saveIncomingMessage(
  conversationId: string,
  messageText: string,
  messageId?: string,
  timestamp?: number,
  imageUrl?: string
): Promise<void> {
  try {
    // إذا كانت هناك صورة، أضفها للمحتوى
    let content = messageText;
    if (imageUrl) {
      content = messageText ? `${messageText}\n[صورة: ${imageUrl}]` : `[صورة: ${imageUrl}]`;
      console.log('📸 Saving message with image:', imageUrl);
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: content,
        sender_type: 'customer',
        facebook_message_id: messageId,
        is_read: false,
        is_auto_reply: false,
        created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
      });

    if (error) {
      console.error('Error saving incoming message:', error);
      throw error;
    }

    console.log('✅ Incoming message saved to database');
  } catch (error) {
    console.error('Error in saveIncomingMessage:', error);
    throw error;
  }
}

// تحديث المحادثة
async function updateConversation(conversationId: string, lastMessage: string): Promise<void> {
  try {
    // أولاً، احصل على العدد الحالي للرسائل غير المقروءة
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('unread_count')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      console.error('Error fetching conversation:', fetchError);
      throw fetchError;
    }

    const currentUnreadCount = conversation?.unread_count || 0;

    // تحديث المحادثة
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message: lastMessage,
        last_message_at: new Date().toISOString(),
        unread_count: currentUnreadCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      throw updateError;
    }

    console.log('✅ Conversation updated');
  } catch (error) {
    console.error('Error in updateConversation:', error);
    throw error;
  }
}

// الحصول على اسم المرسل (يمكن تطويره لاحقاً)
async function getSenderName(senderId: string): Promise<string | null> {
  try {
    // يمكن إضافة استدعاء Facebook API هنا للحصول على اسم المستخدم
    // const facebookService = new FacebookApiService(accessToken);
    // const userInfo = await facebookService.getUserInfo(senderId);
    // return userInfo.name;

    return null; // مؤقتاً
  } catch (error) {
    console.error('Error getting sender name:', error);
    return null;
  }
}

// تصدير دالة مساعدة للتحقق من صحة الطلب
export function validateMessageRequest(request: any): request is ProcessMessageRequest {
  return (
    typeof request.senderId === 'string' &&
    typeof request.messageText === 'string' &&
    typeof request.pageId === 'string' &&
    typeof request.timestamp === 'number'
  );
}
