// 📊 نظام تتبع حملات إعادة الاستهداف
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// 📊 إنشاء جدول حملات إعادة الاستهداف
export async function createCampaignTable() {
  console.log('📊 إنشاء جدول حملات إعادة الاستهداف...');

  const { error } = await supabase.rpc('create_campaign_table', {
    sql: `
      CREATE TABLE IF NOT EXISTS retargeting_campaigns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        target_audience JSONB,
        message_template TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        sent_count INTEGER DEFAULT 0,
        delivered_count INTEGER DEFAULT 0,
        read_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS campaign_messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        campaign_id UUID REFERENCES retargeting_campaigns(id) ON DELETE CASCADE,
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        customer_facebook_id VARCHAR(255) NOT NULL,
        message_content TEXT NOT NULL,
        facebook_message_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        sent_at TIMESTAMP WITH TIME ZONE,
        delivered_at TIMESTAMP WITH TIME ZONE,
        read_at TIMESTAMP WITH TIME ZONE,
        replied_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_id ON campaign_messages(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_campaign_messages_conversation_id ON campaign_messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_campaign_messages_customer_id ON campaign_messages(customer_facebook_id);
    `
  });

  if (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error);
    return false;
  }

  console.log('✅ تم إنشاء جداول حملات إعادة الاستهداف بنجاح');
  return true;
}

// 🎯 إنشاء حملة جديدة
export async function createCampaign(campaignData) {
  console.log('🎯 إنشاء حملة جديدة:', campaignData.name);

  const { data, error } = await supabase
    .from('retargeting_campaigns')
    .insert({
      name: campaignData.name,
      description: campaignData.description,
      target_audience: campaignData.targetAudience,
      message_template: campaignData.messageTemplate,
      status: 'draft',
      created_by: campaignData.createdBy || 'system'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ خطأ في إنشاء الحملة:', error);
    return null;
  }

  console.log('✅ تم إنشاء الحملة بنجاح:', data.id);
  return data;
}

// 📤 إرسال حملة إعادة استهداف
export async function sendCampaign(campaignId, targetCustomers) {
  console.log(`📤 إرسال حملة: ${campaignId} لـ ${targetCustomers.length} عميل`);

  try {
    // جلب بيانات الحملة
    const { data: campaign, error: campaignError } = await supabase
      .from('retargeting_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('❌ لم يتم العثور على الحملة');
      return false;
    }

    // تحديث حالة الحملة
    await supabase
      .from('retargeting_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    let successCount = 0;
    let errorCount = 0;

    // إرسال الرسائل
    for (const customer of targetCustomers) {
      try {
        const result = await sendCampaignMessage(campaign, customer);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ خطأ في إرسال رسالة للعميل ${customer.id}:`, error);
        errorCount++;
      }
    }

    // تحديث إحصائيات الحملة
    await supabase
      .from('retargeting_campaigns')
      .update({
        status: 'completed',
        sent_count: successCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    console.log(`✅ تم إرسال الحملة: ${successCount} نجح، ${errorCount} فشل`);
    return { success: true, sent: successCount, failed: errorCount };

  } catch (error) {
    console.error('❌ خطأ في إرسال الحملة:', error);
    
    // تحديث حالة الحملة للفشل
    await supabase
      .from('retargeting_campaigns')
      .update({ status: 'failed' })
      .eq('id', campaignId);

    return { success: false, error: error.message };
  }
}

// 📨 إرسال رسالة حملة لعميل واحد
async function sendCampaignMessage(campaign, customer) {
  try {
    // تخصيص الرسالة
    let personalizedMessage = campaign.message_template
      .replace('{customer_name}', customer.name || 'عزيزي العميل')
      .replace('{first_name}', customer.name?.split(' ')[0] || 'عزيزي');

    // جلب إعدادات Facebook للصفحة
    const { data: fbSettings, error: fbError } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('page_id', customer.facebook_page_id)
      .single();

    if (fbError || !fbSettings) {
      throw new Error('لا توجد إعدادات Facebook للصفحة');
    }

    // إرسال الرسالة عبر Facebook API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${fbSettings.access_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: customer.facebook_id },
          message: { text: personalizedMessage }
        })
      }
    );

    const result = await response.json();

    if (response.ok && !result.error) {
      // حفظ الرسالة في قاعدة البيانات
      await supabase
        .from('campaign_messages')
        .insert({
          campaign_id: campaign.id,
          conversation_id: customer.conversation_id,
          customer_facebook_id: customer.facebook_id,
          message_content: personalizedMessage,
          facebook_message_id: result.message_id,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      // حفظ في جدول الرسائل العادي أيضاً
      await supabase
        .from('messages')
        .insert({
          conversation_id: customer.conversation_id,
          content: personalizedMessage,
          sender_type: 'admin',
          is_read: true,
          is_auto_reply: false,
          is_campaign: true,
          campaign_id: campaign.id
        });

      console.log(`✅ تم إرسال رسالة الحملة للعميل ${customer.name}`);
      return { success: true, messageId: result.message_id };

    } else {
      throw new Error(result.error?.message || 'فشل في إرسال الرسالة');
    }

  } catch (error) {
    // حفظ الخطأ
    await supabase
      .from('campaign_messages')
      .insert({
        campaign_id: campaign.id,
        conversation_id: customer.conversation_id,
        customer_facebook_id: customer.facebook_id,
        message_content: campaign.message_template,
        status: 'failed',
        error_message: error.message
      });

    console.error(`❌ فشل إرسال رسالة الحملة للعميل ${customer.name}:`, error);
    return { success: false, error: error.message };
  }
}

// 📊 جلب إحصائيات الحملة
export async function getCampaignStats(campaignId) {
  const { data, error } = await supabase
    .from('campaign_messages')
    .select('status, sent_at, delivered_at, read_at, replied_at')
    .eq('campaign_id', campaignId);

  if (error) {
    console.error('❌ خطأ في جلب إحصائيات الحملة:', error);
    return null;
  }

  const stats = {
    total: data.length,
    sent: data.filter(m => m.status === 'sent').length,
    delivered: data.filter(m => m.delivered_at).length,
    read: data.filter(m => m.read_at).length,
    replied: data.filter(m => m.replied_at).length,
    failed: data.filter(m => m.status === 'failed').length
  };

  return stats;
}

// 🎯 جلب العملاء المستهدفين
export async function getTargetCustomers(criteria) {
  let query = supabase
    .from('conversations')
    .select(`
      id,
      customer_name,
      customer_facebook_id,
      facebook_page_id,
      last_message_at,
      created_at
    `);

  // تطبيق معايير الاستهداف
  if (criteria.pageId) {
    query = query.eq('facebook_page_id', criteria.pageId);
  }

  if (criteria.lastMessageBefore) {
    query = query.lt('last_message_at', criteria.lastMessageBefore);
  }

  if (criteria.lastMessageAfter) {
    query = query.gt('last_message_at', criteria.lastMessageAfter);
  }

  if (criteria.limit) {
    query = query.limit(criteria.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ خطأ في جلب العملاء المستهدفين:', error);
    return [];
  }

  return data.map(conv => ({
    id: conv.id,
    conversation_id: conv.id,
    name: conv.customer_name,
    facebook_id: conv.customer_facebook_id,
    facebook_page_id: conv.facebook_page_id,
    lastMessage: conv.last_message_at
  }));
}
