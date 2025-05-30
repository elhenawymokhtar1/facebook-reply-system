# 🔗 دليل إعداد Facebook Webhook

## 📋 المتطلبات

1. **Node.js** (الإصدار 16 أو أحدث)
2. **ngrok** للوصول العام (اختياري للتطوير)
3. **Facebook Developer App** مع صلاحيات Messenger

## 🚀 خطوات التشغيل

### 1. تشغيل خادم Webhook

```bash
# تشغيل خادم Webhook فقط
npm run webhook

# أو تشغيل خادم Webhook مع التطوير
npm run webhook:dev

# أو تشغيل كل شيء معاً (التطبيق + Webhook)
npm run start:all
```

### 2. التحقق من عمل الخادم

افتح المتصفح على: `http://localhost:3001`

يجب أن ترى:
```json
{
  "name": "Facebook Webhook Server",
  "version": "1.0.0",
  "status": "Running",
  "endpoints": {
    "webhook_verify": "GET /webhook",
    "webhook_receive": "POST /webhook",
    "health": "GET /health"
  }
}
```

### 3. إعداد ngrok (للتطوير)

```bash
# تثبيت ngrok
npm install -g ngrok

# تشغيل ngrok
ngrok http 3001
```

ستحصل على URL مثل: `https://abc123.ngrok.io`

### 4. إعداد Facebook Developer Console

1. **اذهب إلى:** [Facebook Developers](https://developers.facebook.com/)
2. **اختر تطبيقك** أو أنشئ تطبيق جديد
3. **أضف منتج Messenger**
4. **في إعدادات Webhooks:**

   - **Callback URL:** `https://your-ngrok-url.ngrok.io/webhook`
   - **Verify Token:** `facebook_webhook_verify_token_2024`
   - **Subscription Fields:** 
     - ✅ `messages`
     - ✅ `messaging_postbacks`
     - ✅ `feed` (للتعليقات - اختياري)

5. **اضغط "Verify and Save"**

### 5. ربط الصفحة بالتطبيق

1. **في قسم "Access Tokens"**
2. **اختر صفحتك**
3. **انسخ Page Access Token**
4. **في تطبيقنا:**
   - اذهب للإعدادات
   - ألصق الـ Token
   - اضغط "اختبار الاتصال"
   - اختر الصفحة واضغط "ربط الصفحة"

## 🧪 اختبار Webhook

### 1. اختبار التحقق

```bash
curl -X GET "http://localhost:3001/webhook?hub.verify_token=facebook_webhook_verify_token_2024&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe"
```

يجب أن ترى: `CHALLENGE_ACCEPTED`

### 2. اختبار استقبال الرسائل

أرسل رسالة لصفحة الفيسبوك وراقب logs الخادم.

### 3. اختبار الردود الآلية

أرسل رسائل تحتوي على الكلمات المفتاحية:
- "مرحبا"
- "الأسعار"
- "التوصيل"
- "شكرا"

## 🔧 إعدادات متقدمة

### متغيرات البيئة

أنشئ ملف `.env` في مجلد `server/`:

```env
# Facebook App Secret (من Developer Console)
FACEBOOK_APP_SECRET=your_app_secret_here

# منفذ خادم Webhook
WEBHOOK_PORT=3001

# بيئة التشغيل
NODE_ENV=development
```

### تخصيص Verify Token

في ملف `server/webhook-server.js`:

```javascript
const VERIFY_TOKEN = 'your_custom_verify_token_here';
```

## 🐛 استكشاف الأخطاء

### خطأ "Invalid signature"

- تأكد من إعداد `FACEBOOK_APP_SECRET` بشكل صحيح
- تحقق من أن App Secret في Facebook Developer Console صحيح

### خطأ "Webhook verification failed"

- تأكد من أن Verify Token متطابق في:
  - `server/webhook-server.js`
  - Facebook Developer Console

### لا تصل الرسائل

1. **تحقق من اشتراك الصفحة:**
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/PAGE_ID/subscribed_apps?access_token=PAGE_ACCESS_TOKEN"
   ```

2. **تحقق من صلاحيات التطبيق:**
   - `pages_messaging`
   - `pages_read_engagement`

3. **تحقق من logs الخادم**

### رسائل الخطأ الشائعة

| الخطأ | السبب | الحل |
|-------|--------|------|
| `ECONNREFUSED` | الخادم غير مُشغل | `npm run webhook` |
| `Invalid signature` | App Secret خاطئ | تحقق من `.env` |
| `Forbidden` | Verify Token خاطئ | تحقق من التطابق |
| `Not Found` | URL خاطئ | تحقق من ngrok URL |

## 📊 مراقبة الأداء

### Logs الخادم

```bash
# عرض logs مباشرة
npm run webhook:dev

# حفظ logs في ملف
npm run webhook 2>&1 | tee webhook.log
```

### Health Check

```bash
curl http://localhost:3001/health
```

## 🔒 الأمان

### للإنتاج

1. **استخدم HTTPS دائماً**
2. **أضف rate limiting**
3. **تحقق من IP المصدر**
4. **استخدم environment variables للأسرار**

### مثال إعداد Nginx

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location /webhook {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📞 الدعم

إذا واجهت مشاكل:

1. **تحقق من logs الخادم**
2. **راجع Facebook Developer Console**
3. **تأكد من صحة الإعدادات**
4. **اختبر الاتصال خطوة بخطوة**

---

**تم إعداد Webhook بنجاح! 🎉**
