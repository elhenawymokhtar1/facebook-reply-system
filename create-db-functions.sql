-- إنشاء دالة لزيادة عداد الرسائل غير المقروءة
CREATE OR REPLACE FUNCTION increment_unread_count(conversation_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE conversations 
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لإعادة تعيين عداد الرسائل غير المقروءة
CREATE OR REPLACE FUNCTION reset_unread_count(conversation_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE conversations 
  SET unread_count = 0
  WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة للحصول على إحصائيات الرسائل
CREATE OR REPLACE FUNCTION get_message_stats()
RETURNS TABLE(
  total_conversations BIGINT,
  total_messages BIGINT,
  unread_conversations BIGINT,
  messages_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM conversations) as total_conversations,
    (SELECT COUNT(*) FROM messages) as total_messages,
    (SELECT COUNT(*) FROM conversations WHERE unread_count > 0) as unread_conversations,
    (SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE) as messages_today;
END;
$$ LANGUAGE plpgsql;
