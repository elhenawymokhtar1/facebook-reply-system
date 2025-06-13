// API endpoint لمعالجة الرسائل من Webhook Server - النظام البسيط الجديد
import { SimpleGeminiService } from '../services/simpleGeminiService';
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ProcessMessageRequest {
  senderId: string;
  messageText: string;
  messageId?: string;
  pageId: string;
  timestamp: number;
  imageUrl?: string;
  senderType?: 'customer' | 'page';
  isEcho?: boolean;
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
  const { senderId, messageText, messageId, pageId, timestamp, imageUrl, senderType = 'customer', isEcho = false } = request;

  try {
    const messageTypeLabel = senderType === 'page' ? 'page admin' : 'customer';
    console.log(`📨 Processing message from ${messageTypeLabel} ${senderId}: "${messageText}"`);
    console.log(`📋 Message details:`, { senderId, messageId, pageId, senderType, isEcho, timestamp });

    // الحصول على المحادثة (بسيط وموحد)
    console.log('📥 Getting/creating conversation...');
    const senderName = await getSenderName(senderId, pageId) || `User ${senderId}`;
    const conversationId = await getOrCreateConversation(senderId, senderName, pageId);

    if (!conversationId) {
      throw new Error('Failed to create or get conversation');
    }

    console.log(`💾 Saving message to conversation: ${conversationId}`);

    // حفظ الرسالة الواردة (تجاهل المكررة)
    try {
      await saveIncomingMessage(conversationId, messageText, messageId, timestamp, imageUrl, senderType, pageId);
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

    // معالجة الرد الآلي الذكي (فقط للرسائل من العملاء)
    let autoReplyWasSent = false;
    if (senderType === 'customer' && !isEcho) {
      console.log('🚀 Starting smart auto reply processing...');
      autoReplyWasSent = await SimpleGeminiService.processMessage(
        messageText,
        conversationId,
        senderId,
        pageId
      );
      console.log('🤖 Smart auto reply result:', autoReplyWasSent);
    } else {
      console.log('📤 Message from page admin - no auto reply needed');
    }

    // تحديث المحادثة
    await updateConversation(conversationId, messageText, senderType);

    console.log(`✅ Message processed successfully for conversation: ${conversationId}`);

    return {
      success: true,
      message: 'Message processed successfully',
      autoReplyWasSent,
      conversationId
    };

  } catch (error) {
    console.error('❌ Error processing incoming message:', error);
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
  imageUrl?: string,
  senderType: 'customer' | 'page' = 'customer',
  pageId?: string
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
        sender_type: senderType === 'page' ? 'admin' : senderType, // تحويل 'page' إلى 'admin'
        facebook_message_id: messageId,
        is_read: senderType === 'page', // رسائل الصفحة تعتبر مقروءة تلقائياً
        is_auto_reply: false,
        image_url: imageUrl || '',
        created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
      });

    if (error) {
      console.error('Error saving incoming message:', error);
      throw error;
    }

    const messageTypeLabel = senderType === 'page' ? 'page admin' : 'customer';
    console.log(`✅ ${messageTypeLabel} message saved to database`);
  } catch (error) {
    console.error('Error in saveIncomingMessage:', error);
    throw error;
  }
}

// تحديث المحادثة
async function updateConversation(conversationId: string, lastMessage: string, senderType: 'customer' | 'page' = 'customer'): Promise<void> {
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

    // زيادة عدد الرسائل غير المقروءة فقط للرسائل من العملاء
    const newUnreadCount = senderType === 'customer' ? currentUnreadCount + 1 : currentUnreadCount;

    // تحديث المحادثة
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message: lastMessage,
        last_message_at: new Date().toISOString(),
        unread_count: newUnreadCount,
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

// الحصول على اسم المرسل من Facebook API وتحديث قاعدة البيانات
async function getSenderName(senderId: string, pageId: string): Promise<string | null> {
  try {
    const { FacebookApiService } = await import('../services/facebookApi');
    const pageSettings = await FacebookApiService.getPageSettings(pageId);

    if (pageSettings && pageSettings.access_token) {
      const facebookService = new FacebookApiService(pageSettings.access_token);
      const userInfo = await facebookService.getUserInfo(senderId, pageSettings.access_token);

      if (userInfo && userInfo.name) {
        console.log(`✅ Got real user name: ${userInfo.name} for ID: ${senderId}`);

        // تحديث الاسم في قاعدة البيانات فوراً إذا كان مختلف
        await updateUserNameInDatabase(senderId, userInfo.name);

        return userInfo.name;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting sender name:', error);
    return null;
  }
}

// تحديث اسم المستخدم في قاعدة البيانات
async function updateUserNameInDatabase(customerFacebookId: string, realName: string): Promise<void> {
  try {
    // البحث عن المحادثة الموجودة
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, customer_name')
      .eq('customer_facebook_id', customerFacebookId)
      .single();

    if (fetchError) {
      console.log(`⚠️ No existing conversation found for ${customerFacebookId}`);
      return;
    }

    // تحديث الاسم إذا كان مختلف
    if (conversation.customer_name !== realName) {
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          customer_name: realName,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      if (updateError) {
        console.error(`❌ Error updating user name for ${customerFacebookId}:`, updateError);
      } else {
        console.log(`🔄 Updated user name: ${conversation.customer_name} → ${realName}`);
      }
    }
  } catch (error) {
    console.error('Error updating user name in database:', error);
  }
}

// إنشاء محادثة جديدة إذا لم تكن موجودة (بسيط)
async function getOrCreateConversation(
  customerFacebookId: string,
  customerName: string,
  pageId: string
): Promise<string | null> {
  try {
    // البحث عن محادثة موجودة
    const { data: existingConversation, error: searchError } = await supabase
      .from('conversations')
      .select('id, customer_name')
      .eq('customer_facebook_id', customerFacebookId)
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for conversation:', searchError);
      return null;
    }

    if (existingConversation) {
      return existingConversation.id;
    }

    // إنشاء محادثة جديدة
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        facebook_page_id: pageId,
        customer_facebook_id: customerFacebookId,
        customer_name: customerName,
        last_message_at: new Date().toISOString(),
        is_online: true,
        unread_count: 0
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return null;
    }

    return newConversation.id;
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
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
