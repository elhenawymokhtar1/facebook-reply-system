import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

// جلب المحادثات للشركة
router.get('/conversations', async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'معرف الشركة مطلوب' });
    }

    console.log(`🔍 جلب المحادثات للشركة: ${company_id}`);

    // جلب صفحات الفيسبوك المرتبطة بالشركة
    const { data: pages, error: pagesError } = await supabase
      .from('facebook_pages')
      .select('page_id, page_name, page_picture_url')
      .eq('company_id', company_id);

    if (pagesError) {
      console.error('خطأ في جلب صفحات الفيسبوك:', pagesError);
      return res.status(500).json({ error: 'خطأ في جلب صفحات الفيسبوك' });
    }

    if (!pages || pages.length === 0) {
      console.log('❌ لا توجد صفحات فيسبوك مرتبطة بهذه الشركة');
      return res.json([]);
    }

    const pageIds = pages.map(page => page.page_id);
    console.log(`📄 تم العثور على ${pageIds.length} صفحة فيسبوك`);

    // جلب المحادثات للصفحات المرتبطة بالشركة
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        facebook_page_id,
        customer_name,
        customer_facebook_id,
        last_message,
        last_message_at,
        is_online,
        unread_count,
        conversation_status,
        page_id,
        created_at,
        updated_at
      `)
      .in('facebook_page_id', pageIds)
      .order('last_message_at', { ascending: false });

    if (conversationsError) {
      console.error('خطأ في جلب المحادثات:', conversationsError);
      return res.status(500).json({ error: 'خطأ في جلب المحادثات' });
    }

    // إضافة معلومات الصفحة لكل محادثة
    const conversationsWithPageInfo = (conversations || []).map(conversation => {
      const page = pages.find(p => p.page_id === conversation.facebook_page_id);
      return {
        ...conversation,
        page_name: page?.page_name || 'صفحة غير معروفة',
        page_picture_url: page?.page_picture_url || null
      };
    });

    console.log(`✅ تم جلب ${conversationsWithPageInfo.length} محادثة للشركة ${company_id}`);
    res.json(conversationsWithPageInfo);

  } catch (error) {
    console.error('خطأ في API المحادثات:', error);
    res.status(500).json({ error: 'خطأ داخلي في الخادم' });
  }
});

// جلب رسائل محادثة معينة
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'معرف الشركة مطلوب' });
    }

    console.log(`📨 جلب رسائل المحادثة: ${conversationId} للشركة: ${company_id}`);

    // التحقق من أن المحادثة تنتمي للشركة
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        facebook_page_id,
        facebook_pages!inner(company_id)
      `)
      .eq('id', conversationId)
      .eq('facebook_pages.company_id', company_id)
      .single();

    if (convError || !conversation) {
      console.error('المحادثة غير موجودة أو لا تنتمي للشركة:', convError);
      return res.status(404).json({ error: 'المحادثة غير موجودة' });
    }

    // جلب الرسائل
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        sender_name,
        message_text,
        message_type,
        is_from_page,
        created_at,
        updated_at
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('خطأ في جلب الرسائل:', messagesError);
      return res.status(500).json({ error: 'خطأ في جلب الرسائل' });
    }

    console.log(`✅ تم جلب ${messages?.length || 0} رسالة للمحادثة ${conversationId}`);
    res.json(messages || []);

  } catch (error) {
    console.error('خطأ في API الرسائل:', error);
    res.status(500).json({ error: 'خطأ داخلي في الخادم' });
  }
});

// إرسال رسالة جديدة
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message_text, company_id } = req.body;

    if (!message_text || !company_id) {
      return res.status(400).json({ error: 'نص الرسالة ومعرف الشركة مطلوبان' });
    }

    console.log(`📤 إرسال رسالة جديدة للمحادثة: ${conversationId}`);

    // التحقق من أن المحادثة تنتمي للشركة
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        facebook_page_id,
        customer_facebook_id,
        facebook_pages!inner(company_id, page_access_token)
      `)
      .eq('id', conversationId)
      .eq('facebook_pages.company_id', company_id)
      .single();

    if (convError || !conversation) {
      console.error('المحادثة غير موجودة أو لا تنتمي للشركة:', convError);
      return res.status(404).json({ error: 'المحادثة غير موجودة' });
    }

    // إدراج الرسالة في قاعدة البيانات
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: conversation.facebook_page_id,
        sender_name: 'الصفحة',
        message_text,
        message_type: 'text',
        is_from_page: true
      })
      .select()
      .single();

    if (messageError) {
      console.error('خطأ في إدراج الرسالة:', messageError);
      return res.status(500).json({ error: 'خطأ في إرسال الرسالة' });
    }

    // تحديث آخر رسالة في المحادثة
    await supabase
      .from('conversations')
      .update({
        last_message: message_text,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    console.log(`✅ تم إرسال الرسالة بنجاح للمحادثة ${conversationId}`);
    res.json(newMessage);

  } catch (error) {
    console.error('خطأ في إرسال الرسالة:', error);
    res.status(500).json({ error: 'خطأ داخلي في الخادم' });
  }
});

export default router;
