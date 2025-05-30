# 🔧 دليل الصيانة والاستكشاف

## 🚨 المشاكل الشائعة والحلول

### 1. 🖼️ الصور لا تُرسل في Facebook

#### الأعراض:
- العميل يطلب صورة لكن لا يستقبلها
- في الـ logs: "Image sent successfully" لكن الصورة لا تظهر

#### الأسباب المحتملة:
- رابط الصورة غير صحيح أو منتهي الصلاحية
- Facebook لا يستطيع الوصول للرابط
- مشاكل في Facebook API

#### الحلول:
```bash
# 1. تحقق من الـ logs
# ابحث عن هذه الرسائل في console:
"🔄 Attempting to send image as URL attachment"
"📤 Facebook API response: 200"
"✅ Image sent successfully as URL attachment"

# 2. إذا فشل URL attachment، النظام يجرب file upload:
"⚠️ URL attachment failed, trying file upload..."
"✅ Image sent successfully as file upload"

# 3. تحقق من صحة روابط الصور
curl -I https://files.easy-orders.net/[image-id].jpg
```

#### الإصلاح:
- النظام يحتوي على fallback تلقائي
- إذا استمرت المشكلة، تحقق من إعدادات Facebook App permissions

### 2. 📦 الطلبات لا تُنشأ تلقائياً

#### الأعراض:
- العميل يرسل بياناته كاملة لكن لا يظهر طلب في إدارة الطلبات
- في الـ logs: "Customer data incomplete"

#### الأسباب المحتملة:
- مشكلة في استخراج البيانات من النص العربي
- الأرقام العربية لا تُحول للإنجليزية
- أنماط النصوص غير متوقعة

#### التشخيص:
```bash
# ابحث عن هذه الرسائل في logs:
"🔍 Extracted customer info: {name: false, phone: false, ...}"
"Missing: {name: true, phone: false, address: false, size: true, color: false}"
```

#### الحلول:
```javascript
// إذا كان المقاس لا يُستخرج من الأرقام العربية:
// تحقق من دالة extractCustomerInfo في orderService.ts
// النظام يدعم: ٣٨ → 38

// إذا كان الاسم لا يُستخرج:
// تحقق من أنماط النصوص في نفس الدالة
// النظام يدعم: "انا شيرين" أو "اسمي شيرين"
```

### 3. 🔗 Facebook Webhook لا يعمل

#### الأعراض:
- الرسائل لا تصل للنظام
- Facebook يظهر خطأ في webhook verification

#### التشخيص:
```bash
# تحقق من Vercel logs:
vercel logs

# اختبر الـ webhook يدوياً:
curl "https://fbautoar.vercel.app/api/process-message?hub.mode=subscribe&hub.verify_token=facebook_verify_token_123&hub.challenge=test123"
# يجب أن يرد: test123
```

#### الحلول:
1. **تحقق من Verify Token:**
   - في Facebook: `facebook_verify_token_123`
   - في الكود: نفس القيمة

2. **تحقق من URL:**
   - `https://fbautoar.vercel.app/api/process-message`
   - يجب أن يكون HTTPS

3. **تحقق من Subscription Fields:**
   - messages ✅
   - messaging_postbacks ✅

### 4. 🤖 Gemini AI لا يرد

#### الأعراض:
- النظام يستقبل الرسائل لكن لا يرد
- خطأ في API key أو quota

#### التشخيص:
```bash
# ابحث عن هذه الأخطاء في logs:
"❌ Error calling Gemini API"
"API key not valid"
"Quota exceeded"
```

#### الحلول:
1. **تحقق من API Key:**
   - اذهب إلى Google AI Studio
   - تأكد من صحة المفتاح
   - تحقق من الـ quota المتبقي

2. **تحقق من Model:**
   - النموذج الحالي: `gemini-1.5-flash`
   - تأكد من توفره

### 5. 💾 مشاكل قاعدة البيانات

#### الأعراض:
- خطأ في حفظ الرسائل أو الطلبات
- "Database connection failed"

#### التشخيص:
```bash
# تحقق من Supabase status:
# اذهب إلى Supabase Dashboard
# تحقق من Project health

# تحقق من الـ environment variables:
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

#### الحلول:
1. **تحقق من الاتصال:**
   - Supabase project status
   - API keys صحيحة
   - RLS policies مضبوطة

2. **تحقق من الجداول:**
   - جميع الجداول موجودة
   - الـ schema صحيح

## 🔍 أدوات التشخيص

### 1. مراقبة الـ Logs

#### Vercel Logs:
```bash
# في terminal:
vercel logs --follow

# أو في Vercel Dashboard:
# اذهب إلى Functions → View Function Logs
```

#### Local Development:
```bash
# تشغيل مع logs مفصلة:
npm run api

# ستظهر logs مثل:
# 🔍 Webhook verification request
# 📨 Received message processing request
# ✅ Order created successfully
```

### 2. اختبار المكونات

#### اختبار Webhook:
```bash
curl -X POST https://fbautoar.vercel.app/api/process-message \
  -H "Content-Type: application/json" \
  -d '{"object":"page","entry":[{"messaging":[{"message":{"text":"test"}}]}]}'
```

#### اختبار Gemini AI:
```javascript
// في browser console:
fetch('/api/test-gemini', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'مرحبا'})
})
```

### 3. مراقبة الأداء

#### مؤشرات مهمة:
- **Response Time**: < 5 ثواني
- **Success Rate**: > 95%
- **Error Rate**: < 5%

#### أدوات المراقبة:
- Vercel Analytics
- Supabase Metrics
- Facebook App Insights

## 📅 الصيانة الدورية

### يومياً:
- [ ] تحقق من Vercel logs للأخطاء
- [ ] راجع عدد الرسائل المعالجة
- [ ] تأكد من عمل الـ webhook

### أسبوعياً:
- [ ] راجع Supabase storage usage
- [ ] تحقق من Gemini API quota
- [ ] نظف الـ logs القديمة

### شهرياً:
- [ ] حدث dependencies
- [ ] راجع security updates
- [ ] نسخ احتياطي لقاعدة البيانات
- [ ] راجع الأداء العام

## 🆘 جهات الاتصال للطوارئ

### خدمات خارجية:
- **Vercel Status**: https://vercel-status.com
- **Supabase Status**: https://status.supabase.com
- **Facebook API Status**: https://developers.facebook.com/status

### للدعم التقني:
- راجع ملف DOCUMENTATION.md
- افتح issue في GitHub
- تحقق من community forums
