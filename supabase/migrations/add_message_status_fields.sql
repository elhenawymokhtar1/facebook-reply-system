-- إضافة حقول حالة الرسائل والمحادثات
-- Migration لإضافة نظام تصنيف الرسائل

-- إضافة حقل message_status لجدول messages إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'message_status'
    ) THEN
        ALTER TABLE messages 
        ADD COLUMN message_status TEXT DEFAULT 'pending' 
        CHECK (message_status IN ('pending', 'answered', 'unanswered', 'spam', 'archived'));
    END IF;
END $$;

-- إضافة حقل conversation_status لجدول conversations إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'conversation_status'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN conversation_status TEXT DEFAULT 'active' 
        CHECK (conversation_status IN ('active', 'pending', 'resolved', 'spam', 'archived'));
    END IF;
END $$;

-- إضافة حقل facebook_message_id لجدول messages إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'facebook_message_id'
    ) THEN
        ALTER TABLE messages 
        ADD COLUMN facebook_message_id TEXT;
    END IF;
END $$;

-- إضافة حقل is_read لجدول messages إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'is_read'
    ) THEN
        ALTER TABLE messages 
        ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;
END $$;

-- تحديث الرسائل الموجودة لتحديد حالتها بناءً على المنطق التالي:
-- 1. رسائل العملاء التي لم يتم الرد عليها = unanswered
-- 2. رسائل العملاء التي تم الرد عليها = answered  
-- 3. رسائل الإدارة والبوت = answered
UPDATE messages 
SET message_status = CASE 
    WHEN sender_type = 'customer' THEN 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM messages m2 
                WHERE m2.conversation_id = messages.conversation_id 
                AND m2.created_at > messages.created_at 
                AND m2.sender_type IN ('admin', 'bot')
            ) THEN 'answered'
            ELSE 'unanswered'
        END
    ELSE 'answered'
END
WHERE message_status = 'pending' OR message_status IS NULL;

-- تحديث حالة المحادثات بناءً على آخر رسالة
UPDATE conversations 
SET conversation_status = CASE 
    WHEN EXISTS (
        SELECT 1 FROM messages 
        WHERE messages.conversation_id = conversations.id 
        AND messages.sender_type = 'customer' 
        AND messages.message_status = 'unanswered'
    ) THEN 'pending'
    ELSE 'active'
END
WHERE conversation_status = 'active' OR conversation_status IS NULL;

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(message_status);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(conversation_status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender ON messages(conversation_id, sender_type, created_at);

-- إنشاء function لتحديث حالة المحادثة تلقائياً عند إضافة رسالة جديدة
CREATE OR REPLACE FUNCTION update_conversation_status()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا كانت الرسالة من العميل، تحديث حالة المحادثة إلى pending
    IF NEW.sender_type = 'customer' THEN
        UPDATE conversations 
        SET conversation_status = 'pending',
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        
        -- تحديث حالة الرسالة إلى unanswered
        NEW.message_status = 'unanswered';
    
    -- إذا كانت الرسالة من الإدارة أو البوت
    ELSIF NEW.sender_type IN ('admin', 'bot') THEN
        -- تحديث حالة المحادثة إلى active
        UPDATE conversations 
        SET conversation_status = 'active',
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        
        -- تحديث حالة الرسالة إلى answered
        NEW.message_status = 'answered';
        
        -- تحديث حالة رسائل العميل السابقة غير المجابة إلى answered
        UPDATE messages 
        SET message_status = 'answered'
        WHERE conversation_id = NEW.conversation_id 
        AND sender_type = 'customer' 
        AND message_status = 'unanswered';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتطبيق الـ function
DROP TRIGGER IF EXISTS trigger_update_conversation_status ON messages;
CREATE TRIGGER trigger_update_conversation_status
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_status();

-- إضافة تعليقات للتوضيح
COMMENT ON COLUMN messages.message_status IS 'حالة الرسالة: pending (في الانتظار), answered (تم الرد), unanswered (لم يتم الرد), spam (سبام), archived (مؤرشفة)';
COMMENT ON COLUMN conversations.conversation_status IS 'حالة المحادثة: active (نشطة), pending (في الانتظار), resolved (محلولة), spam (سبام), archived (مؤرشفة)';
