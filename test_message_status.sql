-- إدراج بيانات تجريبية لاختبار نظام تصنيف الرسائل

-- إدراج محادثات تجريبية
INSERT INTO conversations (id, customer_facebook_id, customer_name, page_id, last_message, conversation_status, created_at, updated_at) VALUES
('test-conv-1', 'customer-001', 'أحمد محمد', '240244019177739', 'مرحبا، أريد الاستفسار عن المنتجات', 'pending', NOW(), NOW()),
('test-conv-2', 'customer-002', 'فاطمة علي', '240244019177739', 'شكرا لكم على الخدمة الممتازة', 'active', NOW(), NOW()),
('test-conv-3', 'customer-003', 'محمد أحمد', '240244019177739', 'هل يمكنني إرجاع المنتج؟', 'resolved', NOW(), NOW()),
('test-conv-4', 'customer-004', 'سارة خالد', '240244019177739', 'رسالة سبام للاختبار', 'spam', NOW(), NOW())
ON CONFLICT (customer_facebook_id, page_id) DO UPDATE SET
  last_message = EXCLUDED.last_message,
  conversation_status = EXCLUDED.conversation_status,
  updated_at = NOW();

-- إدراج رسائل تجريبية
INSERT INTO messages (id, conversation_id, page_id, sender_type, content, message_status, created_at) VALUES
-- محادثة 1 - في الانتظار
('test-msg-1', 'test-conv-1', '240244019177739', 'customer', 'مرحبا، أريد الاستفسار عن المنتجات', 'unanswered', NOW() - INTERVAL '2 hours'),
('test-msg-2', 'test-conv-1', '240244019177739', 'customer', 'هل يمكنني معرفة الأسعار؟', 'unanswered', NOW() - INTERVAL '1 hour'),

-- محادثة 2 - نشطة
('test-msg-3', 'test-conv-2', '240244019177739', 'customer', 'مرحبا', 'answered', NOW() - INTERVAL '3 hours'),
('test-msg-4', 'test-conv-2', '240244019177739', 'admin', 'أهلا وسهلا، كيف يمكنني مساعدتك؟', 'answered', NOW() - INTERVAL '2 hours 30 minutes'),
('test-msg-5', 'test-conv-2', '240244019177739', 'customer', 'شكرا لكم على الخدمة الممتازة', 'answered', NOW() - INTERVAL '30 minutes'),
('test-msg-6', 'test-conv-2', '240244019177739', 'admin', 'شكرا لك، نحن سعداء بخدمتك', 'answered', NOW() - INTERVAL '15 minutes'),

-- محادثة 3 - محلولة
('test-msg-7', 'test-conv-3', '240244019177739', 'customer', 'هل يمكنني إرجاع المنتج؟', 'answered', NOW() - INTERVAL '1 day'),
('test-msg-8', 'test-conv-3', '240244019177739', 'admin', 'بالطبع، يمكنك إرجاع المنتج خلال 14 يوم', 'answered', NOW() - INTERVAL '23 hours'),
('test-msg-9', 'test-conv-3', '240244019177739', 'customer', 'شكرا لكم', 'answered', NOW() - INTERVAL '22 hours'),

-- محادثة 4 - سبام
('test-msg-10', 'test-conv-4', '240244019177739', 'customer', 'رسالة سبام للاختبار', 'spam', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  message_status = EXCLUDED.message_status;

-- تحديث عدد الرسائل غير المقروءة
UPDATE conversations SET unread_count = (
  SELECT COUNT(*) FROM messages 
  WHERE messages.conversation_id = conversations.id 
  AND messages.sender_type = 'customer' 
  AND messages.message_status = 'unanswered'
);
