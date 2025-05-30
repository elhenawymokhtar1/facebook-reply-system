# 📚 توثيق النظام الشامل - نظام إدارة الرسائل والألوان

## 🎯 نظرة عامة على النظام

### **الهدف الرئيسي:**
نظام ذكي لإدارة رسائل Facebook Messenger مع إرسال صور المنتجات تلقائياً بناءً على الألوان المطلوبة.

### **المكونات الأساسية:**
- **🤖 Gemini AI** - للرد الذكي على الرسائل
- **🎨 نظام الألوان** - لإدارة الألوان والصور
- **📱 Facebook API** - للتواصل مع Messenger
- **💾 قاعدة البيانات** - لحفظ المحادثات والإعدادات
- **🖥️ واجهة الإدارة** - لإدارة النظام

---

## 🏗️ هيكل النظام

### **📁 المجلدات الرئيسية:**

#### **`src/api/`** - خدمات الـ API
- `server.ts` - الخادم الرئيسي
- `colors.ts` - API إدارة الألوان
- `process-message.ts` - معالجة الرسائل
- `webhook.ts` - استقبال رسائل Facebook

#### **`src/services/`** - الخدمات الأساسية
- `geminiAi.ts` - خدمة Gemini AI
- `facebookApi.ts` - خدمة Facebook API
- `colorService.ts` - خدمة إدارة الألوان
- `productImageService.ts` - خدمة إدارة الصور

#### **`src/pages/`** - صفحات الواجهة
- `Index.tsx` - الصفحة الرئيسية
- `ProductImages.tsx` - إدارة الألوان والصور
- `Conversations.tsx` - إدارة المحادثات
- `Settings.tsx` - الإعدادات

#### **`src/components/`** - المكونات المشتركة
- `Navigation.tsx` - شريط التنقل
- `GeminiSettings.tsx` - إعدادات Gemini
- `ui/` - مكونات واجهة المستخدم

---

## 🎨 نظام الألوان (النظام الأساسي)

### **📍 الملفات المهمة:**
- `src/api/colors.ts` - API إدارة الألوان
- `src/services/geminiAi.ts` - كشف الألوان وإرسال الصور
- `colors-data.json` - ملف حفظ الألوان (يُنشأ تلقائياً)

### **🔧 كيف يعمل النظام:**

#### **1. تخزين الألوان:**
```javascript
// في colors.ts
const defaultColors = [
  {
    id: '1',
    color_key: 'white',
    arabic_name: 'أبيض',
    english_name: 'White',
    image_url: 'https://files.easy-orders.net/...',
    keywords: ['أبيض', 'ابيض', 'white'],
    is_active: true
  }
];
```

#### **2. كشف الألوان:**
```javascript
// في geminiAi.ts - detectAndSendImage()
// 1. البحث في رد Gemini أولاً
if (geminiResponse.includes(colorName)) {
  detectedColor = colorName;
}

// 2. البحث في رسالة المستخدم ثانياً
if (userMessage.includes(colorName)) {
  detectedColor = colorName;
}

// 3. استخدام السياق إذا لم يوجد لون واضح
if (userMessage.includes('صورة') && !detectedColor) {
  detectedColor = 'آخر لون مذكور';
}
```

#### **3. إرسال الصور:**
```javascript
// إرسال الصورة عبر Facebook API
await facebookService.sendImage(accessToken, senderId, imageUrl);
```

### **📋 العمليات المتاحة:**

#### **GET `/api/colors`** - جلب جميع الألوان
#### **POST `/api/colors`** - إضافة لون جديد
#### **DELETE `/api/colors/:id`** - حذف لون
#### **POST `/api/colors/detect`** - كشف لون من نص

---

## 🤖 نظام Gemini AI

### **📍 الملف الرئيسي:** `src/services/geminiAi.ts`

### **🔧 الوظائف الأساسية:**

#### **1. معالجة الرسائل الواردة:**
```javascript
static async processIncomingMessage(userMessage, conversationId, senderId)
```

#### **2. توليد الردود:**
```javascript
static async generateResponse(prompt, conversationId)
```

#### **3. كشف وإرسال الصور:**
```javascript
static async detectAndSendImage(geminiResponse, userMessage, senderId, accessToken)
```

### **🎯 منطق العمل:**
1. **استقبال الرسالة** من Facebook
2. **توليد رد ذكي** باستخدام Gemini
3. **كشف الألوان** في الرد أو الرسالة
4. **إرسال الصورة** إذا وُجد لون
5. **حفظ المحادثة** في قاعدة البيانات

---

## 📱 نظام Facebook API

### **📍 الملف الرئيسي:** `src/services/facebookApi.ts`

### **🔧 الوظائف الأساسية:**

#### **1. إرسال الرسائل النصية:**
```javascript
async sendMessage(accessToken, recipientId, messageText)
```

#### **2. إرسال الصور:**
```javascript
async sendImage(accessToken, recipientId, imageUrl)
```

#### **3. استقبال الرسائل:**
```javascript
// في webhook.ts
app.post('/webhook', (req, res) => {
  // معالجة الرسائل الواردة
});
```

### **🔗 التكامل:**
- **Webhook URL:** `https://your-domain.com/webhook`
- **Verify Token:** محفوظ في قاعدة البيانات
- **Page Access Token:** محفوظ في قاعدة البيانات

---

## 💾 قاعدة البيانات (Supabase)

### **📊 الجداول الرئيسية:**

#### **`conversations`** - المحادثات
- `id` - معرف المحادثة
- `sender_id` - معرف المرسل
- `page_id` - معرف الصفحة
- `created_at` - تاريخ الإنشاء

#### **`messages`** - الرسائل
- `id` - معرف الرسالة
- `conversation_id` - معرف المحادثة
- `message_text` - نص الرسالة
- `sender_type` - نوع المرسل (user/bot)
- `created_at` - تاريخ الإرسال

#### **`gemini_settings`** - إعدادات Gemini
- `api_key` - مفتاح API
- `model` - نموذج Gemini
- `is_enabled` - حالة التفعيل
- `temperature` - درجة الإبداع

#### **`facebook_settings`** - إعدادات Facebook
- `page_access_token` - رمز الوصول
- `verify_token` - رمز التحقق
- `page_id` - معرف الصفحة

---

## 🖥️ واجهة الإدارة

### **📍 الصفحات الرئيسية:**

#### **`/`** - الصفحة الرئيسية
- إحصائيات سريعة
- الرسائل الحديثة
- إجراءات سريعة

#### **`/product-images`** - إدارة الألوان
- عرض الألوان المتاحة
- إضافة ألوان جديدة
- حذف الألوان
- اختبار النظام

#### **`/conversations`** - إدارة المحادثات
- عرض جميع المحادثات
- تفاصيل كل محادثة
- الرسائل المتبادلة

#### **`/settings`** - الإعدادات
- إعدادات Gemini AI
- إعدادات Facebook
- إعدادات عامة

---

## 🔧 التشغيل والصيانة

### **🚀 تشغيل النظام:**
```bash
# تشغيل الواجهة
npm run dev

# تشغيل API
npm run api
```

### **📋 المتطلبات:**
- Node.js 18+
- قاعدة بيانات Supabase
- مفتاح Gemini AI
- صفحة Facebook مع Webhook

### **🔍 مراقبة النظام:**
- **اللوج:** يظهر في terminal عند تشغيل `npm run api`
- **قاعدة البيانات:** مراقبة عبر Supabase Dashboard
- **الأخطاء:** تُسجل في console وقاعدة البيانات

### **🛠️ الصيانة الدورية:**
1. **مراجعة اللوج** للأخطاء
2. **تنظيف قاعدة البيانات** من الرسائل القديمة
3. **تحديث الألوان** حسب المنتجات الجديدة
4. **مراجعة إعدادات Gemini** للتحسين

---

## 📝 ملاحظات مهمة

### **⚠️ نقاط الانتباه:**
- **ملف `colors-data.json`** يُنشأ تلقائياً ولا يجب حذفه
- **مفاتيح API** محفوظة في قاعدة البيانات وليس في الكود
- **الصور** يجب أن تكون متاحة عبر HTTPS
- **Webhook** يجب أن يكون متاح 24/7

### **🔒 الأمان:**
- جميع المفاتيح محفوظة في قاعدة البيانات
- التحقق من صحة Webhook
- تشفير الاتصالات عبر HTTPS

### **📈 التطوير المستقبلي:**
- إضافة المزيد من الألوان
- تحسين خوارزمية كشف الألوان
- إضافة إحصائيات متقدمة
- دعم منتجات أخرى غير الأحذية

---

## 🔧 دليل التطوير التقنية

### **🏗️ معمارية النظام:**

#### **Frontend (React + TypeScript):**
- **Framework:** Vite + React 18
- **UI Library:** shadcn/ui + Tailwind CSS
- **State Management:** React Hooks
- **Routing:** React Router
- **HTTP Client:** Fetch API

#### **Backend (Node.js + TypeScript):**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Process Manager:** tsx (development)

#### **Database:**
- **Provider:** Supabase (PostgreSQL)
- **ORM:** Supabase Client
- **Real-time:** Supabase Realtime

#### **External APIs:**
- **AI:** Google Gemini 1.5 Flash
- **Social:** Facebook Graph API
- **Storage:** External file hosting

### **📊 تدفق البيانات:**

```
Facebook Messenger → Webhook → Process Message → Gemini AI → Color Detection → Image Sending → Database Storage
```

#### **1. استقبال الرسالة:**
```javascript
// webhook.ts
POST /webhook → validateWebhook() → processMessage()
```

#### **2. معالجة الرسالة:**
```javascript
// process-message.ts
processMessage() → saveToDatabase() → callGeminiAI()
```

#### **3. الرد الذكي:**
```javascript
// geminiAi.ts
generateResponse() → detectAndSendImage() → sendToFacebook()
```

### **🎨 نظام كشف الألوان - التفاصيل التقنية:**

#### **خوارزمية الكشف:**
```javascript
// 1. Priority Order
1. Gemini Response Text Analysis
2. User Message Text Analysis
3. Context Memory (Last Mentioned Color)

// 2. Matching Logic
- Exact name match: "أحمر" → red
- Keyword match: "احمر" → red
- Context match: "صورة" + last_color → last_color
```

#### **معالجة الصور:**
```javascript
// Image Sending Flow
1. URL Attachment (Primary)
2. File Upload (Fallback)
3. Error Handling & Logging
```

### **🔄 دورة حياة الرسالة:**

#### **المرحلة 1: الاستقبال**
```
Facebook → Webhook → Validation → Database Save
```

#### **المرحلة 2: المعالجة**
```
Message → Gemini AI → Response Generation → Color Detection
```

#### **المرحلة 3: الرد**
```
Text Response → Image Detection → Image Sending → Conversation Update
```

### **📝 هيكل البيانات:**

#### **Color Object:**
```typescript
interface Color {
  id: string;
  color_key: string;
  arabic_name: string;
  english_name: string;
  image_url: string;
  keywords: string[];
  is_active: boolean;
}
```

#### **Message Object:**
```typescript
interface Message {
  id: string;
  conversation_id: string;
  message_text: string;
  sender_type: 'user' | 'bot';
  message_id: string;
  timestamp: number;
  created_at: string;
}
```

#### **Conversation Object:**
```typescript
interface Conversation {
  id: string;
  sender_id: string;
  page_id: string;
  last_message_at: string;
  created_at: string;
}
```

### **🚨 معالجة الأخطاء:**

#### **مستويات الأخطاء:**
1. **INFO** - معلومات عامة
2. **WARN** - تحذيرات غير حرجة
3. **ERROR** - أخطاء تحتاج تدخل

#### **أماكن اللوج:**
```javascript
// Console Logging
console.log('🔍 Info message');
console.warn('⚠️ Warning message');
console.error('❌ Error message');

// Database Logging (للأخطاء الحرجة)
await logErrorToDatabase(error, context);
```

### **🔧 إعداد البيئة:**

#### **متغيرات البيئة المطلوبة:**
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Development
NODE_ENV=development
PORT=3002
```

#### **إعداد قاعدة البيانات:**
```sql
-- إنشاء الجداول الأساسية
CREATE TABLE conversations (...);
CREATE TABLE messages (...);
CREATE TABLE gemini_settings (...);
CREATE TABLE facebook_settings (...);
```

### **🧪 الاختبار:**

#### **اختبار النظام:**
1. **Unit Tests** - اختبار الدوال المنفردة
2. **Integration Tests** - اختبار التكامل
3. **Manual Testing** - اختبار يدوي عبر Facebook

#### **أدوات الاختبار:**
- **Postman** - لاختبار APIs
- **Facebook Graph API Explorer** - لاختبار Facebook
- **Supabase Dashboard** - لمراقبة قاعدة البيانات

### **📦 النشر:**

#### **متطلبات الإنتاج:**
- **Server** - VPS أو Cloud Server
- **Domain** - نطاق مع SSL
- **Database** - Supabase Production
- **Monitoring** - أدوات مراقبة

#### **خطوات النشر:**
1. **Build Frontend:** `npm run build`
2. **Deploy Backend:** Upload to server
3. **Configure Webhook:** Set Facebook webhook URL
4. **Test System:** Verify all components work

### **🔍 مراقبة الأداء:**

#### **مؤشرات الأداء:**
- **Response Time** - زمن الاستجابة
- **Success Rate** - معدل النجاح
- **Error Rate** - معدل الأخطاء
- **Color Detection Accuracy** - دقة كشف الألوان

#### **أدوات المراقبة:**
- **Server Logs** - سجلات الخادم
- **Database Metrics** - مؤشرات قاعدة البيانات
- **API Analytics** - تحليلات API
