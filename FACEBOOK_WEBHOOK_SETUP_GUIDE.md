# 📱 دليل إعداد Facebook Webhook لاستقبال الرسائل

## 🎯 **المشكلة:**
الرسائل المرسلة من صفحة Facebook للعملاء لا تظهر في التطبيق لأنه لا يوجد **Webhook** مُعد لاستقبالها.

## ✅ **الحل الكامل:**

### 📋 **الملفات المُنشأة:**
1. `netlify/functions/facebook-webhook.js` - Webhook function
2. `netlify.toml` - إعدادات Netlify
3. `setup-facebook-webhook.js` - سكريپت الإعداد
4. `simulate-page-messages.js` - محاكاة الرسائل (مؤقت)

---

## 🚀 **خطوات الإعداد:**

### **المرحلة 1: رفع التطبيق على Netlify**

1. **إنشاء حساب Netlify:**
   - اذهب إلى https://netlify.com
   - سجل دخول بحساب GitHub

2. **رفع التطبيق:**
   ```bash
   # في مجلد المشروع
   npm run build
   
   # رفع مجلد dist إلى Netlify
   # أو ربط GitHub repository مباشرة
   ```

3. **الحصول على رابط التطبيق:**
   - مثال: `https://your-app-name.netlify.app`

---

### **المرحلة 2: إعداد Facebook App**

1. **اذهب إلى Facebook Developers:**
   - https://developers.facebook.com/apps
   - اختر تطبيقك الموجود

2. **إعداد Messenger Webhook:**
   - اذهب إلى **Messenger** > **Settings**
   - في قسم **Webhooks**، اضغط **"Add Callback URL"**

3. **إدخال بيانات Webhook:**
   ```
   Callback URL: https://your-app-name.netlify.app/api/webhook/facebook
   Verify Token: facebook_webhook_verify_token_2024
   ```

4. **اختيار Subscription Fields:**
   - ✅ `messages`
   - ✅ `messaging_postbacks`
   - ✅ `messaging_optins`
   - ✅ `message_deliveries`
   - ✅ `message_reads`

5. **اضغط "Verify and Save"**

---

### **المرحلة 3: ربط الصفحات بالـ Webhook**

1. **تشغيل سكريپت الإعداد:**
   ```bash
   node setup-facebook-webhook.js
   ```

2. **أو إعداد يدوي لكل صفحة:**
   ```bash
   curl -X POST "https://graph.facebook.com/v18.0/PAGE_ID/subscribed_apps" \
     -d "access_token=PAGE_ACCESS_TOKEN" \
     -d "subscribed_fields=messages,messaging_postbacks"
   ```

---

## 🔧 **كيف يعمل النظام:**

### **1. استقبال الرسائل من العملاء:**
```javascript
// العميل يرسل رسالة → Facebook → Webhook → قاعدة البيانات
{
  "sender": {"id": "CUSTOMER_ID"},
  "message": {"text": "مرحبا"}
}
```

### **2. استقبال الرسائل المرسلة من الصفحة (Echo):**
```javascript
// الصفحة ترسل رسالة → Facebook → Webhook → قاعدة البيانات
{
  "sender": {"id": "PAGE_ID"},
  "message": {"text": "مرحبا", "is_echo": true}
}
```

### **3. الرد الآلي:**
- عند وصول رسالة من عميل
- يتم تشغيل `AutoReplyService.processIncomingMessage()`
- يرسل رد آلي أو Gemini AI

---

## 🧪 **اختبار النظام:**

### **1. اختبار محلي:**
```bash
node test-webhook-locally.js
```

### **2. اختبار مع Facebook:**
1. أرسل رسالة من صفحة Facebook لعميل
2. تحقق من ظهورها في التطبيق
3. أرسل رسالة من العميل للصفحة
4. تحقق من الرد الآلي

---

## 🔍 **استكشاف الأخطاء:**

### **مشكلة: Webhook لا يستجيب**
```bash
# فحص logs في Netlify
netlify functions:log facebook-webhook
```

### **مشكلة: Facebook لا يرسل البيانات**
1. تحقق من صحة Verify Token
2. تأكد من أن الـ URL صحيح
3. فحص Subscription Fields

### **مشكلة: الرسائل لا تُحفظ**
1. فحص Supabase connection
2. تحقق من صحة بنية البيانات
3. مراجعة console logs

---

## 📊 **مراقبة النظام:**

### **Logs مفيدة:**
```javascript
console.log('🔔 Facebook Webhook called');
console.log('📨 Incoming message:', message);
console.log('✅ Message saved:', messageId);
```

### **إحصائيات:**
- عدد الرسائل المستقبلة
- معدل نجاح الحفظ
- أخطاء الـ Webhook

---

## 🎉 **النتيجة النهائية:**

بعد إتمام الإعداد:
- ✅ **جميع الرسائل الواردة** من العملاء تظهر فوراً
- ✅ **جميع الرسائل المرسلة** من الصفحة تظهر فوراً  
- ✅ **الرد الآلي** يعمل تلقائياً
- ✅ **Real-time updates** في التطبيق
- ✅ **مزامنة كاملة** مع Facebook Messenger

---

## 🔗 **روابط مفيدة:**

- [Facebook Messenger Platform](https://developers.facebook.com/docs/messenger-platform)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Supabase Real-time](https://supabase.com/docs/guides/realtime)

---

## 📞 **الدعم:**

إذا واجهت مشاكل:
1. تحقق من console logs
2. فحص Netlify function logs  
3. مراجعة Facebook App settings
4. اختبار Webhook URL يدوياً
