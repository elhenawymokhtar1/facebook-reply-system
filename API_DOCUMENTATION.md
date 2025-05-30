# 📡 توثيق APIs - نظام إدارة الرسائل والألوان

## 🎯 نظرة عامة

### **Base URL:** `http://localhost:3002`
### **Content-Type:** `application/json`
### **Authentication:** لا يوجد (للتطوير المحلي)

---

## 🎨 Colors API - إدارة الألوان

### **📍 Base Path:** `/api/colors`

#### **GET `/api/colors`** - جلب جميع الألوان
```javascript
// Request
GET /api/colors

// Response
[
  {
    "id": "1",
    "color_key": "white",
    "arabic_name": "أبيض",
    "english_name": "White",
    "image_url": "https://files.easy-orders.net/1744641208557436357.jpg",
    "keywords": ["أبيض", "ابيض", "white"],
    "is_active": true
  }
]
```

#### **POST `/api/colors`** - إضافة لون جديد
```javascript
// Request
POST /api/colors
{
  "colorKey": "green",
  "arabicName": "أخضر",
  "englishName": "Green",
  "imageUrl": "https://files.easy-orders.net/image.jpg",
  "keywords": ["أخضر", "اخضر", "green"]
}

// Response
{
  "id": "9",
  "color_key": "green",
  "arabic_name": "أخضر",
  "english_name": "Green",
  "image_url": "https://files.easy-orders.net/image.jpg",
  "keywords": ["أخضر", "اخضر", "green"],
  "is_active": true
}
```

#### **DELETE `/api/colors/:id`** - حذف لون
```javascript
// Request
DELETE /api/colors/1

// Response
{
  "message": "Color deleted",
  "deletedColor": {
    "id": "1",
    "arabic_name": "أبيض",
    // ... باقي البيانات
  }
}
```

#### **POST `/api/colors/detect`** - كشف لون من نص
```javascript
// Request
POST /api/colors/detect
{
  "text": "عايز اشوف الأحمر"
}

// Response - Success
{
  "detected": true,
  "color": {
    "id": "2",
    "arabic_name": "أحمر",
    "image_url": "https://files.easy-orders.net/1744720320703143217.jpg",
    // ... باقي البيانات
  }
}

// Response - Not Found
{
  "detected": false,
  "color": null
}
```

---

## 📨 Message Processing API - معالجة الرسائل

### **📍 Base Path:** `/api/process-message`

#### **POST `/api/process-message`** - معالجة رسالة واردة
```javascript
// Request
POST /api/process-message
{
  "senderId": "23913714651591287",
  "messageText": "عايز اشوف الأحمر",
  "messageId": "m_unique_message_id",
  "pageId": "240244019177739",
  "timestamp": 1748583713213
}

// Response - Success
{
  "success": true,
  "message": "Message processed successfully",
  "autoReplyWasSent": true,
  "conversationId": "566646e4-90f9-4df6-8ac6-98535d3816b8"
}

// Response - Error
{
  "success": false,
  "message": "Error processing message",
  "error": "Detailed error message"
}
```

---

## 🔗 Webhook API - استقبال رسائل Facebook

### **📍 Base Path:** `/webhook`

#### **GET `/webhook`** - التحقق من Webhook
```javascript
// Request (من Facebook)
GET /webhook?hub.mode=subscribe&hub.challenge=CHALLENGE_TOKEN&hub.verify_token=YOUR_VERIFY_TOKEN

// Response
CHALLENGE_TOKEN (إذا كان verify_token صحيح)
```

#### **POST `/webhook`** - استقبال الرسائل
```javascript
// Request (من Facebook)
POST /webhook
{
  "object": "page",
  "entry": [
    {
      "id": "240244019177739",
      "time": 1748583713213,
      "messaging": [
        {
          "sender": {
            "id": "23913714651591287"
          },
          "recipient": {
            "id": "240244019177739"
          },
          "timestamp": 1748583713213,
          "message": {
            "mid": "m_unique_message_id",
            "text": "عايز اشوف الأحمر"
          }
        }
      ]
    }
  ]
}

// Response
{
  "status": "EVENT_RECEIVED"
}
```

---

## 🤖 Gemini AI Integration - تكامل الذكاء الاصطناعي

### **الوظائف الداخلية (ليست APIs عامة):**

#### **`GeminiAiService.processIncomingMessage()`**
```javascript
// Usage
const result = await GeminiAiService.processIncomingMessage(
  userMessage,
  conversationId,
  senderId
);

// Parameters
- userMessage: string - نص الرسالة
- conversationId: string - معرف المحادثة
- senderId: string - معرف المرسل

// Returns
boolean - true إذا تم الرد بنجاح
```

#### **`GeminiAiService.generateResponse()`**
```javascript
// Usage
const response = await GeminiAiService.generateResponse(
  prompt,
  conversationId
);

// Parameters
- prompt: string - النص المرسل لـ Gemini
- conversationId: string - معرف المحادثة

// Returns
{
  success: boolean,
  response: string,
  error?: string
}
```

#### **`GeminiAiService.detectAndSendImage()`**
```javascript
// Usage
const imageSent = await GeminiAiService.detectAndSendImage(
  geminiResponse,
  userMessage,
  senderId,
  accessToken
);

// Parameters
- geminiResponse: string - رد Gemini
- userMessage: string - رسالة المستخدم
- senderId: string - معرف المرسل
- accessToken: string - رمز الوصول لـ Facebook

// Returns
boolean - true إذا تم إرسال صورة
```

---

## 📱 Facebook API Integration - تكامل فيسبوك

### **الوظائف الداخلية:**

#### **`FacebookApiService.sendMessage()`**
```javascript
// Usage
await facebookService.sendMessage(
  accessToken,
  recipientId,
  messageText
);

// Parameters
- accessToken: string - رمز الوصول
- recipientId: string - معرف المستقبل
- messageText: string - نص الرسالة
```

#### **`FacebookApiService.sendImage()`**
```javascript
// Usage
await facebookService.sendImage(
  accessToken,
  recipientId,
  imageUrl
);

// Parameters
- accessToken: string - رمز الوصول
- recipientId: string - معرف المستقبل
- imageUrl: string - رابط الصورة

// Flow
1. محاولة إرسال كـ URL attachment
2. إذا فشل، تحميل الصورة وإرسالها كملف
3. معالجة الأخطاء وتسجيلها
```

---

## 🚨 معالجة الأخطاء

### **رموز الأخطاء الشائعة:**

#### **400 - Bad Request**
```javascript
{
  "error": "Invalid request parameters",
  "details": "Missing required field: messageText"
}
```

#### **404 - Not Found**
```javascript
{
  "error": "Color not found",
  "colorId": "invalid_id"
}
```

#### **500 - Internal Server Error**
```javascript
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

### **أخطاء Facebook API:**
```javascript
// Upload Attachment Failure
{
  "error": {
    "message": "(#100) Upload attachment failure.",
    "type": "OAuthException",
    "code": 100,
    "error_subcode": 2018047
  }
}
```

---

## 📊 أمثلة تطبيقية

### **سيناريو كامل - إرسال صورة لون:**

#### **1. استقبال الرسالة:**
```javascript
POST /webhook
{
  "object": "page",
  "entry": [{
    "messaging": [{
      "sender": {"id": "USER_ID"},
      "message": {"text": "عايز اشوف الأحمر"}
    }]
  }]
}
```

#### **2. معالجة الرسالة:**
```javascript
POST /api/process-message
{
  "senderId": "USER_ID",
  "messageText": "عايز اشوف الأحمر",
  "messageId": "MSG_ID",
  "pageId": "PAGE_ID",
  "timestamp": 1748583713213
}
```

#### **3. كشف اللون:**
```javascript
POST /api/colors/detect
{
  "text": "عايز اشوف الأحمر"
}

// Response
{
  "detected": true,
  "color": {
    "arabic_name": "أحمر",
    "image_url": "https://files.easy-orders.net/red.jpg"
  }
}
```

#### **4. إرسال الصورة:**
```javascript
// Internal Facebook API Call
POST https://graph.facebook.com/v18.0/me/messages
{
  "recipient": {"id": "USER_ID"},
  "message": {
    "attachment": {
      "type": "image",
      "payload": {"url": "https://files.easy-orders.net/red.jpg"}
    }
  }
}
```

---

## 🔧 نصائح للتطوير

### **اختبار APIs:**
```bash
# اختبار جلب الألوان
curl http://localhost:3002/api/colors

# اختبار كشف لون
curl -X POST http://localhost:3002/api/colors/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "أحمر"}'

# اختبار معالجة رسالة
curl -X POST http://localhost:3002/api/process-message \
  -H "Content-Type: application/json" \
  -d '{"senderId": "test", "messageText": "test", "messageId": "test", "pageId": "test", "timestamp": 123}'
```

### **مراقبة الأداء:**
- **Response Time:** < 2 ثانية للرد العادي
- **Image Upload:** < 5 ثواني للصور
- **Database Queries:** < 500ms للاستعلامات

### **أفضل الممارسات:**
- **Validation:** تحقق من صحة البيانات الواردة
- **Error Handling:** معالجة شاملة للأخطاء
- **Logging:** تسجيل مفصل للعمليات
- **Rate Limiting:** تحديد معدل الطلبات (للإنتاج)
