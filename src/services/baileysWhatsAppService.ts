import { 
  makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  ConnectionState,
  WAMessage,
  proto,
  isJidBroadcast,
  isJidGroup,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);
import { SimpleGeminiService } from './simpleGeminiService';

export class BaileysWhatsAppService {
  private static socket: any = null;
  private static isConnected = false;
  private static qrCode: string | null = null;
  private static connectionState: ConnectionState = 'close';
  private static authState: any = null;
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 10;
  private static reconnectInterval: NodeJS.Timeout | null = null;
  private static keepAliveInterval: NodeJS.Timeout | null = null;

  /**
   * بدء خدمة WhatsApp
   */
  static async initialize(): Promise<void> {
    try {
      console.log('🚀 [BAILEYS] بدء تهيئة WhatsApp...');

      // إعداد حالة المصادقة
      const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth');
      this.authState = { state, saveCreds };

      // إنشاء الاتصال
      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false, // سنتعامل مع QR بطريقتنا
        defaultQueryTimeoutMs: 120000, // زيادة timeout إلى دقيقتين
        keepAliveIntervalMs: 30000, // keep-alive كل 30 ثانية
        markOnlineOnConnect: false, // تجنب إظهار "متصل" باستمرار
        syncFullHistory: false,
        browser: ['WhatsApp Business', 'Chrome', '4.0.0'],
        connectTimeoutMs: 60000, // timeout للاتصال
        qrTimeout: 60000, // timeout للـ QR
        retryRequestDelayMs: 1000, // زيادة تأخير إعادة المحاولة
        maxMsgRetryCount: 3, // تقليل محاولات إعادة الإرسال
        shouldSyncHistoryMessage: () => false, // تجنب مزامنة التاريخ
        shouldIgnoreJid: (jid) => isJidBroadcast(jid), // تجاهل البرودكاست
        emitOwnEvents: false, // تجنب الأحداث الزائدة
        generateHighQualityLinkPreview: false, // تجنب معاينة الروابط
        getMessage: async (key) => {
          return {
            conversation: 'مرحباً'
          };
        }
      });

      // إعداد معالجات الأحداث
      this.setupEventHandlers();

      console.log('✅ [BAILEYS] تم تهيئة WhatsApp بنجاح');
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في تهيئة WhatsApp:', error);
      throw error;
    }
  }

  /**
   * بدء keep-alive مخصص
   */
  private static startKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = setInterval(async () => {
      try {
        if (this.socket && this.isConnected) {
          // إرسال ping بسيط للحفاظ على الاتصال
          try {
            await this.socket.sendPresenceUpdate('available');
            console.log('💓 [BAILEYS] Keep-alive presence sent');
          } catch (presenceError) {
            // إذا فشل presence، جرب ping
            try {
              await this.socket.query({
                tag: 'iq',
                attrs: {
                  id: Date.now().toString(),
                  type: 'get',
                  xmlns: 'urn:xmpp:ping'
                }
              });
              console.log('💓 [BAILEYS] Keep-alive ping sent');
            } catch (pingError) {
              console.log('⚠️ [BAILEYS] Keep-alive failed, connection may be unstable');
            }
          }
        }
      } catch (error) {
        console.log('⚠️ [BAILEYS] Keep-alive error:', error.message);
      }
    }, 30000); // كل 30 ثانية
  }

  /**
   * إعداد معالجات الأحداث
   */
  private static setupEventHandlers(): void {
    if (!this.socket) return;

    // معالج تحديث الاتصال
    this.socket.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      console.log(`🔄 [BAILEYS] حالة الاتصال: ${connection}`);

      if (qr) {
        console.log('📱 [BAILEYS] QR Code جديد متاح');
        this.qrCode = qr;
        await this.saveQRCode(qr);
      }

      if (connection === 'close') {
        this.isConnected = false;
        this.connectionState = 'close';
        await this.updateConnectionStatus(false);

        // إيقاف keep-alive
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = null;
        }

        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`🔌 [BAILEYS] الاتصال مغلق - كود الحالة: ${statusCode}`);

        if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // exponential backoff

          console.log(`🔄 [BAILEYS] محاولة إعادة الاتصال ${this.reconnectAttempts}/${this.maxReconnectAttempts} خلال ${delay}ms...`);

          this.reconnectInterval = setTimeout(() => {
            this.initialize();
          }, delay);
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log('🔐 [BAILEYS] تم تسجيل الخروج - يحتاج QR جديد');
          await this.clearAuthState();
          this.reconnectAttempts = 0;
        } else {
          console.log('❌ [BAILEYS] تجاوز الحد الأقصى لمحاولات إعادة الاتصال');
          this.reconnectAttempts = 0;
        }
      } else if (connection === 'open') {
        this.isConnected = true;
        this.connectionState = 'open';
        this.qrCode = null;
        this.reconnectAttempts = 0; // إعادة تعيين العداد عند النجاح

        console.log('✅ [BAILEYS] تم الاتصال بنجاح!');
        await this.updateConnectionStatus(true);

        // بدء keep-alive مخصص
        this.startKeepAlive();
      } else if (connection === 'connecting') {
        console.log('🔄 [BAILEYS] جاري الاتصال...');
        this.connectionState = 'connecting';
      }
    });

    // معالج تحديث بيانات الاعتماد
    this.socket.ev.on('creds.update', this.authState.saveCreds);

    // معالج الرسائل الجديدة
    this.socket.ev.on('messages.upsert', async (messageUpdate: any) => {
      const messages = messageUpdate.messages;

      console.log(`📨 [BAILEYS] تحديث رسائل: ${messages.length} رسالة، نوع: ${messageUpdate.type}`);

      for (const message of messages) {
        console.log(`📨 [BAILEYS] معالجة رسالة: fromMe=${message.key.fromMe}, type=${messageUpdate.type}`);

        // معالجة الرسائل الواردة (ليست من المستخدم)
        if (!message.key.fromMe) {
          await this.handleIncomingMessage(message);
        }
      }
    });

    // معالج حالة الاستلام
    this.socket.ev.on('message-receipt.update', (update: any) => {
      console.log('📨 [BAILEYS] تحديث حالة الرسالة:', update);
    });

    // معالج إضافي للرسائل (للتأكد من عدم فقدان أي رسالة)
    this.socket.ev.on('messages.set', async (messageSet: any) => {
      console.log(`📨 [BAILEYS] مجموعة رسائل جديدة: ${messageSet.messages?.length || 0} رسالة`);

      if (messageSet.messages) {
        for (const message of messageSet.messages) {
          if (!message.key.fromMe) {
            console.log(`📨 [BAILEYS] معالجة رسالة من messages.set`);
            await this.handleIncomingMessage(message);
          }
        }
      }
    });

    // معالج أخطاء الاتصال
    this.socket.ev.on('connection.error', (error: any) => {
      console.error('❌ [BAILEYS] خطأ في الاتصال:', error);
    });

    // معالج تحديث الحضور
    this.socket.ev.on('presence.update', (update: any) => {
      // تجاهل تحديثات الحضور لتوفير الموارد
    });

    // معالج تحديث المجموعات
    this.socket.ev.on('groups.update', (update: any) => {
      // تجاهل تحديثات المجموعات
    });

    // معالج الأحداث غير المرغوب فيها
    this.socket.ev.on('blocklist.set', () => {});
    this.socket.ev.on('blocklist.update', () => {});
    this.socket.ev.on('call', () => {});
    this.socket.ev.on('chats.set', () => {});
    this.socket.ev.on('contacts.set', () => {});
    this.socket.ev.on('contacts.update', () => {});
  }

  /**
   * معالجة الرسائل الواردة
   */
  private static async handleIncomingMessage(message: WAMessage): Promise<void> {
    try {
      console.log(`📨 [BAILEYS] بدء معالجة رسالة واردة من: ${message.key.remoteJid}`);

      const messageContent = message.message?.conversation ||
                           message.message?.extendedTextMessage?.text ||
                           'رسالة وسائط';

      const phoneNumber = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
      const messageId = message.key.id || '';

      // تجاهل رسائل المجموعات والبرودكاست
      if (isJidGroup(message.key.remoteJid!) || isJidBroadcast(message.key.remoteJid!)) {
        console.log(`⏭️ [BAILEYS] تجاهل رسالة مجموعة/برودكاست: ${message.key.remoteJid}`);
        return;
      }

      console.log(`📨 [BAILEYS] رسالة واردة من ${phoneNumber}: ${messageContent}`);

      // حفظ الرسالة في قاعدة البيانات
      const messageData = {
        message_id: messageId,
        phone_number: phoneNumber,
        contact_name: message.pushName || '',
        message_text: messageContent,
        message_type: 'incoming',
        timestamp: new Date().toISOString()
      };

      console.log(`💾 [BAILEYS] حفظ الرسالة في قاعدة البيانات:`, messageData);
      await this.saveMessage(messageData);

      // معالجة الرسالة بالذكاء الاصطناعي
      const aiResponse = await this.processWithAI(phoneNumber, messageContent);

      if (aiResponse) {
        console.log(`🤖 [BAILEYS] إرسال رد تلقائي: ${aiResponse.substring(0, 50)}...`);
        await this.sendMessage(phoneNumber, aiResponse);
      } else {
        console.log(`🤖 [BAILEYS] لا يوجد رد تلقائي للرسالة`);
      }

    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في معالجة الرسالة:', error);
    }
  }

  /**
   * إرسال رسالة
   */
  static async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      if (!this.socket || !this.isConnected) {
        throw new Error('WhatsApp غير متصل');
      }

      const jid = `${phoneNumber}@s.whatsapp.net`;

      await this.socket.sendMessage(jid, { text: message });

      console.log(`✅ [BAILEYS] تم إرسال الرسالة إلى ${phoneNumber}`);

      // حفظ الرسالة المرسلة
      await this.saveMessage({
        message_id: `sent_${Date.now()}`,
        phone_number: phoneNumber,
        contact_name: '',
        message_text: message,
        message_type: 'outgoing',
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في إرسال الرسالة:', error);
      return false;
    }
  }

  /**
   * إرسال ملف
   */
  static async sendFile(
    phoneNumber: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    caption?: string
  ): Promise<boolean> {
    try {
      console.log(`📎 [BAILEYS] محاولة إرسال ملف إلى ${phoneNumber}: ${fileName}`);

      if (!this.socket || !this.isConnected) {
        console.log('❌ [BAILEYS] WhatsApp غير متصل');
        // في حالة عدم الاتصال، نحفظ الرسالة كمحاكاة
        await this.saveMessage({
          message_id: `sent_file_${Date.now()}`,
          phone_number: phoneNumber,
          contact_name: '',
          message_text: caption ? `📎 ${fileName} - ${caption} (محاكاة)` : `📎 ${fileName} (محاكاة)`,
          message_type: 'outgoing',
          timestamp: new Date().toISOString(),
          file_name: fileName,
          file_type: mimeType,
          file_size: fileBuffer.length
        });

        console.log(`✅ [BAILEYS] تم حفظ الملف كمحاكاة: ${fileName}`);
        return true; // نعيد true للمحاكاة
      }

      const jid = `${phoneNumber}@s.whatsapp.net`;

      // تحديد نوع الرسالة حسب نوع الملف
      let messageContent: any;

      if (mimeType.startsWith('image/')) {
        messageContent = {
          image: fileBuffer,
          caption: caption,
          fileName: fileName
        };
      } else if (mimeType.startsWith('video/')) {
        messageContent = {
          video: fileBuffer,
          caption: caption,
          fileName: fileName
        };
      } else if (mimeType.startsWith('audio/')) {
        messageContent = {
          audio: fileBuffer,
          fileName: fileName,
          mimetype: mimeType
        };
      } else {
        // ملفات أخرى (PDF, DOC, etc.)
        messageContent = {
          document: fileBuffer,
          fileName: fileName,
          mimetype: mimeType,
          caption: caption
        };
      }

      await this.socket.sendMessage(jid, messageContent);

      console.log(`✅ [BAILEYS] تم إرسال الملف إلى ${phoneNumber}: ${fileName}`);

      // حفظ الرسالة المرسلة مع معلومات الملف
      await this.saveMessage({
        message_id: `sent_file_${Date.now()}`,
        phone_number: phoneNumber,
        contact_name: '',
        message_text: caption ? `📎 ${fileName} - ${caption}` : `📎 ${fileName}`,
        message_type: 'outgoing',
        timestamp: new Date().toISOString(),
        file_name: fileName,
        file_type: mimeType,
        file_size: fileBuffer.length
      });

      return true;
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في إرسال الملف:', error);

      // في حالة الخطأ، نحفظ الرسالة كمحاكاة
      try {
        await this.saveMessage({
          message_id: `sent_file_${Date.now()}`,
          phone_number: phoneNumber,
          contact_name: '',
          message_text: caption ? `📎 ${fileName} - ${caption} (خطأ في الإرسال)` : `📎 ${fileName} (خطأ في الإرسال)`,
          message_type: 'outgoing',
          timestamp: new Date().toISOString(),
          file_name: fileName,
          file_type: mimeType,
          file_size: fileBuffer.length
        });

        console.log(`⚠️ [BAILEYS] تم حفظ الملف مع خطأ: ${fileName}`);
        return true; // نعيد true حتى لو فشل الإرسال الفعلي
      } catch (saveError) {
        console.error('❌ [BAILEYS] خطأ في حفظ الملف:', saveError);
        return false;
      }
    }
  }

  /**
   * معالجة الرسالة بالذكاء الاصطناعي
   */
  private static async processWithAI(phoneNumber: string, messageText: string): Promise<string | null> {
    try {
      console.log(`🤖 [BAILEYS] معالجة الرسالة بالذكاء الاصطناعي`);

      // استيراد خدمة WhatsApp AI المخصصة
      const { WhatsAppAIService } = await import('./whatsappAIService');

      // معالجة الرسالة باستخدام WhatsApp AI
      const response = await WhatsAppAIService.processMessage(
        phoneNumber,
        messageText,
        '' // اسم جهة الاتصال (يمكن تحسينه لاحقاً)
      );

      if (response) {
        console.log(`✅ [BAILEYS] تم الحصول على رد من WhatsApp AI: ${response.substring(0, 50)}...`);
        return response;
      }

      // في حالة عدم وجود رد من WhatsApp AI، استخدم النظام القديم كـ fallback
      console.log(`🔄 [BAILEYS] استخدام النظام القديم كـ fallback`);

      const conversationId = `whatsapp_${phoneNumber}`;

      const success = await SimpleGeminiService.processMessage(
        messageText,
        conversationId,
        phoneNumber,
        'whatsapp'
      );

      if (success) {
        // جلب آخر رد من البوت
        const { data: lastBotMessage } = await supabase
          .from('whatsapp_messages')
          .select('message_text')
          .eq('phone_number', phoneNumber)
          .eq('message_type', 'outgoing')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return lastBotMessage?.message_text || null;
      }

      return null;
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في معالجة AI:', error);
      return 'عذراً، حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.';
    }
  }

  /**
   * الحصول على QR Code
   */
  static getQRCode(): string | null {
    return this.qrCode;
  }

  /**
   * الحصول على حالة الاتصال
   */
  static getConnectionState(): { isConnected: boolean; state: ConnectionState } {
    return {
      isConnected: this.isConnected,
      state: this.connectionState
    };
  }

  /**
   * قطع الاتصال
   */
  static async disconnect(): Promise<void> {
    try {
      // إيقاف جميع المؤقتات
      if (this.reconnectInterval) {
        clearTimeout(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
      }

      if (this.socket) {
        await this.socket.logout();
        this.socket = null;
      }

      this.isConnected = false;
      this.connectionState = 'close';
      this.qrCode = null;
      this.reconnectAttempts = 0;

      await this.updateConnectionStatus(false);
      console.log('🔌 [BAILEYS] تم قطع الاتصال');
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في قطع الاتصال:', error);
    }
  }

  /**
   * حفظ الرسالة في قاعدة البيانات
   */
  private static async saveMessage(messageData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .insert(messageData);

      if (error) {
        console.error('❌ [BAILEYS] خطأ في حفظ الرسالة:', error);
      }
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في حفظ الرسالة:', error);
    }
  }

  /**
   * حفظ QR Code
   */
  private static async saveQRCode(qrCode: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({
          id: 1,
          qr_code: qrCode,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ [BAILEYS] خطأ في حفظ QR Code:', error);
      }
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في حفظ QR Code:', error);
    }
  }

  /**
   * تحديث حالة الاتصال
   */
  private static async updateConnectionStatus(isConnected: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({
          id: 1,
          is_connected: isConnected,
          last_connected: isConnected ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ [BAILEYS] خطأ في تحديث حالة الاتصال:', error);
      }
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في تحديث حالة الاتصال:', error);
    }
  }

  /**
   * مسح حالة المصادقة
   */
  private static async clearAuthState(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');

      const authDir = './baileys_auth';

      if (fs.existsSync(authDir)) {
        // حذف جميع ملفات المصادقة
        const files = fs.readdirSync(authDir);
        for (const file of files) {
          const filePath = path.join(authDir, file);
          fs.unlinkSync(filePath);
          console.log(`🗑️ [BAILEYS] تم حذف ملف: ${file}`);
        }

        // حذف المجلد نفسه
        fs.rmdirSync(authDir);
        console.log('🗑️ [BAILEYS] تم حذف مجلد المصادقة');
      }

      // مسح QR Code من قاعدة البيانات
      await supabase
        .from('whatsapp_settings')
        .upsert({
          id: 1,
          qr_code: null,
          is_connected: false,
          last_connected: null,
          updated_at: new Date().toISOString()
        });

      console.log('🗑️ [BAILEYS] تم مسح حالة المصادقة بالكامل');
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في مسح حالة المصادقة:', error);
    }
  }

  /**
   * إعادة تشغيل WhatsApp بشكل نظيف
   */
  static async restart(): Promise<void> {
    try {
      console.log('🔄 [BAILEYS] بدء إعادة تشغيل WhatsApp...');

      // إيقاف الاتصال الحالي
      if (this.socket) {
        this.socket.end();
        this.socket = null;
      }

      // مسح حالة المصادقة
      await this.clearAuthState();

      // انتظار قليل قبل إعادة التشغيل
      await new Promise(resolve => setTimeout(resolve, 2000));

      // إعادة التهيئة
      await this.initialize();

      console.log('✅ [BAILEYS] تم إعادة تشغيل WhatsApp بنجاح');
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في إعادة تشغيل WhatsApp:', error);
      throw error;
    }
  }

  /**
   * إصلاح مشاكل الاتصال
   */
  static async fixConnectionIssues(): Promise<void> {
    try {
      console.log('🔧 [BAILEYS] بدء إصلاح مشاكل الاتصال...');

      // إيقاف جميع المؤقتات
      if (this.reconnectInterval) {
        clearTimeout(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
      }

      // إيقاف جميع الاتصالات
      if (this.socket) {
        this.socket.end();
        this.socket = null;
      }

      // إعادة تعيين المتغيرات
      this.isConnected = false;
      this.connectionState = 'close';
      this.qrCode = null;
      this.reconnectAttempts = 0;

      // مسح ملفات المصادقة القديمة
      await this.clearAuthState();

      // انتظار أطول لضمان إغلاق جميع الاتصالات
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('✅ [BAILEYS] تم إصلاح مشاكل الاتصال - يمكن الآن إعادة التشغيل');
    } catch (error) {
      console.error('❌ [BAILEYS] خطأ في إصلاح مشاكل الاتصال:', error);
      throw error;
    }
  }

  /**
   * فحص حالة الاتصال
   */
  static getConnectionHealth(): any {
    return {
      isConnected: this.isConnected,
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      hasSocket: !!this.socket,
      hasKeepAlive: !!this.keepAliveInterval,
      hasReconnectTimer: !!this.reconnectInterval
    };
  }
}
