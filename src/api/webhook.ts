// Facebook Webhook Handler
import { AutoReplyService } from '@/services/autoReplyService';

// Webhook verification token (يجب أن يكون نفس الموجود في Facebook App)
const WEBHOOK_VERIFY_TOKEN = 'facebook_webhook_verify_token_2024';

export interface WebhookRequest {
  body: any;
  query: {
    'hub.mode'?: string;
    'hub.verify_token'?: string;
    'hub.challenge'?: string;
  };
  method: string;
}

export interface WebhookResponse {
  status: number;
  body?: any;
  text?: string;
}

// معالج Webhook الرئيسي
export async function handleWebhook(req: WebhookRequest): Promise<WebhookResponse> {
  const { method, query, body } = req;

  // التحقق من صحة Webhook (Facebook Verification)
  if (method === 'GET') {
    return handleVerification(query);
  }

  // معالجة الرسائل الواردة
  if (method === 'POST') {
    return await handleIncomingMessage(body);
  }

  return {
    status: 405,
    text: 'Method Not Allowed'
  };
}

// التحقق من صحة Webhook
function handleVerification(query: any): WebhookResponse {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  // التحقق من أن Facebook يرسل طلب التحقق الصحيح
  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified successfully!');
    return {
      status: 200,
      text: challenge
    };
  }

  console.error('Webhook verification failed!', { mode, token });
  return {
    status: 403,
    text: 'Forbidden'
  };
}

// معالجة الرسائل الواردة من Facebook
async function handleIncomingMessage(body: any): Promise<WebhookResponse> {
  try {
    console.log('Received webhook:', JSON.stringify(body, null, 2));

    // التأكد من أن الطلب من Facebook
    if (body.object !== 'page') {
      return {
        status: 400,
        text: 'Invalid object type'
      };
    }

    // معالجة كل entry في الطلب
    for (const entry of body.entry || []) {
      const pageId = entry.id;
      const timeOfEvent = entry.time;

      // معالجة رسائل Messenger
      if (entry.messaging) {
        for (const messagingEvent of entry.messaging) {
          await processMessagingEvent(messagingEvent, pageId);
        }
      }

      // معالجة تعليقات المنشورات (اختياري)
      if (entry.changes) {
        for (const change of entry.changes) {
          await processPageChange(change, pageId);
        }
      }
    }

    return {
      status: 200,
      text: 'EVENT_RECEIVED'
    };

  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      status: 500,
      text: 'Internal Server Error'
    };
  }
}

// معالجة أحداث الرسائل
async function processMessagingEvent(messagingEvent: any, pageId: string) {
  const senderId = messagingEvent.sender?.id;
  const recipientId = messagingEvent.recipient?.id;
  const timestamp = messagingEvent.timestamp;

  // رسالة واردة من المستخدم
  if (messagingEvent.message && !messagingEvent.message.is_echo) {
    await handleUserMessage(messagingEvent, pageId);
  }

  // تأكيد التسليم
  if (messagingEvent.delivery) {
    console.log('Message delivered:', messagingEvent.delivery);
  }

  // تأكيد القراءة
  if (messagingEvent.read) {
    console.log('Message read:', messagingEvent.read);
  }

  // Postback (عند الضغط على أزرار)
  if (messagingEvent.postback) {
    await handlePostback(messagingEvent, pageId);
  }
}

// معالجة رسالة المستخدم
async function handleUserMessage(messagingEvent: any, pageId: string) {
  const senderId = messagingEvent.sender.id;
  const message = messagingEvent.message;
  const messageText = message.text;
  const messageId = message.mid;

  console.log(`Received message from ${senderId}: ${messageText}`);

  try {
    // الحصول على معلومات المرسل (اختياري - يحتاج permissions إضافية)
    const senderName = await getSenderName(senderId) || `User ${senderId}`;

    // إنشاء أو الحصول على المحادثة
    const conversationId = await AutoReplyService.getOrCreateConversation(
      senderId,
      senderName,
      pageId
    );

    if (conversationId && messageText) {
      // حفظ الرسالة الواردة في قاعدة البيانات
      await saveIncomingMessage(conversationId, messageText, messageId);

      // معالجة الرد الآلي
      const replyWasSent = await AutoReplyService.processIncomingMessage(
        senderId,
        messageText,
        conversationId
      );

      if (replyWasSent) {
        console.log(`Auto-reply sent to ${senderId}`);
      } else {
        console.log(`No matching auto-reply found for: ${messageText}`);
      }

      // تحديث المحادثة
      await updateConversation(conversationId, messageText);
    }

  } catch (error) {
    console.error('Error handling user message:', error);
  }
}

// معالجة Postback
async function handlePostback(messagingEvent: any, pageId: string) {
  const senderId = messagingEvent.sender.id;
  const postback = messagingEvent.postback;
  const payload = postback.payload;

  console.log(`Received postback from ${senderId}: ${payload}`);

  // يمكن إضافة منطق معالجة الأزرار هنا
  // مثال: إرسال رد مخصص حسب نوع الزر المضغوط
}

// معالجة تغييرات الصفحة (تعليقات، إعجابات، إلخ)
async function processPageChange(change: any, pageId: string) {
  const field = change.field;
  const value = change.value;

  console.log(`Page change detected: ${field}`, value);

  // يمكن إضافة منطق معالجة التعليقات هنا
  if (field === 'feed' && value.item === 'comment') {
    // معالجة تعليق جديد
    await handleNewComment(value, pageId);
  }
}

// معالجة تعليق جديد (اختياري)
async function handleNewComment(commentData: any, pageId: string) {
  const commentId = commentData.comment_id;
  const message = commentData.message;
  const senderId = commentData.from?.id;

  console.log(`New comment: ${message} from ${senderId}`);

  // يمكن إضافة رد آلي على التعليقات هنا
}

// الحصول على اسم المرسل من Facebook API
async function getSenderName(senderId: string): Promise<string | null> {
  try {
    // هذا يحتاج Facebook API call مع access token
    // يمكن تطبيقه لاحقاً عند الحاجة
    return null;
  } catch (error) {
    console.error('Error getting sender name:', error);
    return null;
  }
}

// حفظ الرسالة الواردة في قاعدة البيانات
async function saveIncomingMessage(conversationId: string, messageText: string, messageId?: string) {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: messageText,
        sender_type: 'customer',
        facebook_message_id: messageId,
        is_read: false,
        is_auto_reply: false
      });

    if (error) {
      console.error('Error saving incoming message:', error);
    }
  } catch (error) {
    console.error('Error in saveIncomingMessage:', error);
  }
}

// تحديث المحادثة
async function updateConversation(conversationId: string, lastMessage: string) {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('conversations')
      .update({
        last_message: lastMessage,
        last_message_at: new Date().toISOString(),
        unread_count: supabase.rpc('increment', { x: 1 }) // زيادة عدد الرسائل غير المقروءة
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation:', error);
    }
  } catch (error) {
    console.error('Error in updateConversation:', error);
  }
}

// تصدير الثوابت المطلوبة
export { WEBHOOK_VERIFY_TOKEN };
