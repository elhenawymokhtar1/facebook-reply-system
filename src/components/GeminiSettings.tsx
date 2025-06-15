import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGeminiSettings } from "@/hooks/useGeminiAi";
import { Loader2, Bot, TestTube, Save, AlertCircle, RefreshCw, Package, User, Zap, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SmartProductsClientAPI } from "@/utils/smart-products-client";
import { toast } from "sonner";

export const GeminiSettings: React.FC = () => {
  const { settings, isLoading, saveSettings, testConnection, isSaving, isTesting } = useGeminiSettings();

  const [formData, setFormData] = useState({
    api_key: '',
    model: 'gemini-1.5-flash',
    prompt_template: '',
    personality_prompt: '',
    products_prompt: '',
    is_enabled: false,
    max_tokens: 1000,
    temperature: 0.7
  });



  useEffect(() => {
    if (settings) {
      setFormData({
        api_key: settings.api_key || '',
        model: settings.model || 'gemini-1.5-flash',
        prompt_template: settings.prompt_template || '',
        personality_prompt: settings.personality_prompt || '',
        products_prompt: settings.products_prompt || '',
        is_enabled: settings.is_enabled || false,
        max_tokens: settings.max_tokens || 1000,
        temperature: settings.temperature || 0.7
      });
    }
  }, [settings]);

  const handleSave = () => {
    saveSettings.mutate(formData);
  };

  const handleTest = () => {
    if (!formData.api_key) {
      alert('يرجى إدخال API Key أولاً');
      return;
    }
    testConnection.mutate(formData.api_key);
  };

  // دالة تحديث البرومت بالنظام الذكي الجديد مع الصور الصحيحة
  const updatePromptWithSmartAPI = () => {
    // بيانات ثابتة ومؤكدة للألوان والصور
    const productsInfo = `📦 المنتجات والألوان المتوفرة حالياً في متجر سوان شوب:

🎨 الألوان المتوفرة مع الصور:
1. أبيض (White)
   🖼️ صورة: https://files.easy-orders.net/1744641208557436357.jpg
   🔍 كلمات البحث: ابيض، أبيض، white

2. أحمر (Red)
   🖼️ صورة: https://files.easy-orders.net/1744720320703143217.jpg
   🔍 كلمات البحث: احمر، أحمر، red

3. أسود (Black)
   🖼️ صورة: https://files.easy-orders.net/1723117580290608498.jpg
   🔍 كلمات البحث: اسود، أسود، black

4. أزرق (Blue)
   🖼️ صورة: https://files.easy-orders.net/1723117554054321721.jpg
   🔍 كلمات البحث: ازرق، أزرق، blue

5. بيج (Beige)
   🖼️ صورة: https://files.easy-orders.net/1739181695020677812.jpg
   🔍 كلمات البحث: بيج، beige

6. جملي (Camel)
   🖼️ صورة: https://files.easy-orders.net/1739181874715440699.jpg
   🔍 كلمات البحث: جملي، camel

🛍️ المنتجات المتوفرة:

1. **حذاء رياضي نايك** ⭐ (المنتج الافتراضي)
   - الفئة: أحذية
   - العلامة التجارية: Nike
   - الوصف: حذاء رياضي عصري ومريح
   - المتغيرات المتوفرة:
     • اللون: أبيض
       💰 السعر: 150 ج
       📦 المخزون: 10 قطع
       📏 المقاس: 42
       🖼️ صورة: https://files.easy-orders.net/1744641208557436357.jpg

     • اللون: أحمر
       💰 السعر: 160 ج
       📦 المخزون: 8 قطع
       📏 المقاس: 42
       🖼️ صورة: https://files.easy-orders.net/1744720320703143217.jpg

     • اللون: أسود
       💰 السعر: 155 ج
       📦 المخزون: 12 قطع
       📏 المقاس: 42
       🖼️ صورة: https://files.easy-orders.net/1723117580290608498.jpg

2. **شنطة يد أنيقة**
   - الفئة: شنط
   - العلامة التجارية: Luxury
   - الوصف: شنطة يد جلدية فاخرة
   - المتغيرات المتوفرة:
     • اللون: أحمر
       💰 السعر: 220 ج
       📦 المخزون: 5 قطع
       📏 المقاس: واحد
       🖼️ صورة: https://files.easy-orders.net/1744720320703143217.jpg

     • اللون: أسود
       💰 السعر: 200 ج
       📦 المخزون: 7 قطع
       📏 المقاس: واحد
       🖼️ صورة: https://files.easy-orders.net/1723117580290608498.jpg

3. **تيشيرت قطني**
   - الفئة: ملابس
   - العلامة التجارية: Cotton
   - الوصف: تيشيرت قطني مريح
   - المتغيرات المتوفرة:
     • اللون: أحمر
       💰 السعر: 85 ج
       📦 المخزون: 15 قطعة
       📏 المقاس: L
       🖼️ صورة: https://files.easy-orders.net/1744720320703143217.jpg

     • اللون: أبيض
       💰 السعر: 80 ج
       📦 المخزون: 20 قطعة
       📏 المقاس: L
       🖼️ صورة: https://files.easy-orders.net/1744641208557436357.jpg

`;

    const smartPrompt = `أنت مساعد ذكي لمتجر "سوان شوب" للأحذية النسائية العصرية.

🚫 مهم جداً:
- لا تكتب أي كود برمجي أو تستخدم رموز مثل \`\`\` أو const أو function
- لا تضع روابط الصور في الرسائل النصية (الصور ستُرسل تلقائياً)
- اكتب وصف المنتج فقط بدون رابط

\${productsInfo}

🎯 قواعد الرد على العملاء:

1. **عندما يسأل "إيه المنتجات اللي عندك؟" أو "إيه المنتجات المتوفرة؟":**
   اعرض قائمة المنتجات من البيانات أعلاه:
   "يا قمر، المنتجات المتوفرة في سوان شوب هي:
   1. حذاء رياضي نايك ⭐ (المنتج الافتراضي)
   2. شنطة يد أنيقة 🎒
   3. تيشيرت قطني 👕
   أي منتج يهمك يا حبيبتي؟ 😊"

2. **عندما يسأل عن المنتجات:**
   اعرض قائمة المنتجات المتوفرة:
   "يا قمر، المنتجات المتوفرة في سوان شوب هي:
   👟 حذاء رياضي - 150 ج
   👞 حذاء كلاسيكي - 180 ج
   🥿 حذاء كاجوال - 160 ج
   أي منتج يعجبك يا حبيبتي؟ 😍"

3. **عندما يطلب صورة لون معين (مثل "عايز أشوف الأحمر" أو "ابعت صورة الأبيض"):**
   اعرض وصف المنتج بدون رابط (الصورة ستُرسل تلقائياً):

   للأحمر: "تفضلي يا قمر، هذا الحذاء الأحمر: ❤️
   ⭐ حذاء رياضي نايك - أحمر
   💰 السعر: 160 ج
   📦 المخزون: 8 قطع متوفرة
   📏 المقاس: 42
   يعجبك يا حبيبتي؟ 💕"

   للأبيض: "تفضلي يا قمر، هذا الحذاء الأبيض: 🤍
   ⭐ حذاء رياضي نايك - أبيض
   💰 السعر: 150 ج
   📦 المخزون: 10 قطع متوفرة
   📏 المقاس: 42
   يعجبك يا حبيبتي؟ 💕"

   للأسود: "تفضلي يا قمر، هذا الحذاء الأسود: 🖤
   ⭐ حذاء رياضي نايك - أسود
   💰 السعر: 155 ج
   📦 المخزون: 12 قطعة متوفرة
   📏 المقاس: 42
   يعجبك يا حبيبتي؟ 💕"

   للأزرق: "تفضلي يا قمر، هذا الحذاء الأزرق: 💙
   ⭐ حذاء رياضي نايك - أزرق
   💰 السعر: 165 ج
   📦 المخزون: 6 قطع متوفرة
   📏 المقاس: 42
   يعجبك يا حبيبتي؟ 💕"

   للبيج: "تفضلي يا قمر، هذا الحذاء البيج: 🤎
   ⭐ حذاء رياضي نايك - بيج
   💰 السعر: 170 ج
   📦 المخزون: 4 قطع متوفرة
   📏 المقاس: 42
   يعجبك يا حبيبتي؟ 💕"

4. **عندما يطلب صورة منتج محدد (مثل "ابعت صورة الشنطة الحمراء"):**
   اعرض صورة ذلك المنتج المحدد:
   "تفضلي حبيبتي، هذه صورة الشنطة الحمراء: 🎒
   https://files.easy-orders.net/1744720320703143217.jpg
   🏷️ شنطة يد أنيقة - حمراء
   💰 السعر: 220 ج
   📦 المخزون: 5 قطع متوفرة
   📏 المقاس: واحد
   إيه رأيك فيها؟ 😊"

5. **عندما يسأل عن منتج محدد:**
   ابحث في قائمة المنتجات أعلاه واعرض جميع الألوان المتوفرة لهذا المنتج مع الأسعار والمخزون

🎨 أسلوب الكلام:
- استخدم "يا قمر" و "حبيبتي"
- ضع رموز تعبيرية مناسبة
- كن ودود ومهذب
- اعرض المعلومات بشكل منظم

✅ أمثلة على الردود الصحيحة:

عميل: "إيه المنتجات اللي عندك؟"
أنت: "يا قمر، المنتجات المتوفرة في سوان شوب هي:
1. حذاء رياضي نايك ⭐ (المنتج الافتراضي)
2. شنطة يد أنيقة 🎒
3. تيشيرت قطني 👕
أي منتج يهمك يا حبيبتي؟ 😊"

عميل: "والألوان؟"
أنت: "يا قمر، الألوان المتوفرة للحذاء الرياضي في سوان شوب هي:
🤍 أبيض - 150 ج
❤️ أحمر - 160 ج
🖤 أسود - 155 ج
💙 أزرق - 165 ج
🤎 بيج - 170 ج
أي لون يعجبك يا حبيبتي؟ 😍"

عميل: "إيه الألوان المتوفرة من الكوتشي؟"
أنت: "يا قمر، الألوان المتوفرة للحذاء الرياضي في سوان شوب هي:
🤍 أبيض - 150 ج
❤️ أحمر - 160 ج
🖤 أسود - 155 ج
💙 أزرق - 165 ج
🤎 بيج - 170 ج
أي لون يعجبك يا حبيبتي؟ 😍"

عميل: "عايز أشوف الأحمر"
أنت: "تفضلي يا قمر، هذا الحذاء الأحمر: ❤️
⭐ حذاء رياضي نايك - أحمر
💰 السعر: 160 ج
📦 المخزون: 8 قطع متوفرة
📏 المقاس: 42
يعجبك يا حبيبتي؟ 💕"

عميل: "ابعت صورة الأبيض"
أنت: "تفضلي يا قمر، هذا الحذاء الأبيض: 🤍
⭐ حذاء رياضي نايك - أبيض
💰 السعر: 150 ج
📦 المخزون: 10 قطع متوفرة
📏 المقاس: 42
يعجبك يا حبيبتي؟ 💕"

عميل: "عايز أشوف الأسود"
أنت: "تفضلي يا قمر، هذا الحذاء الأسود: 🖤
⭐ حذاء رياضي نايك - أسود
💰 السعر: 155 ج
📦 المخزون: 12 قطعة متوفرة
📏 المقاس: 42
يعجبك يا حبيبتي؟ 💕"

⚠️ مهم: استخدم فقط المعلومات الموجودة في البيانات أعلاه! لا تخترع معلومات!`;

    setFormData(prev => ({ ...prev, prompt_template: smartPrompt }));
    toast.success("تم تحديث البرومت بالنظام الذكي الجديد!");
  };

  // دالة تحديث البرومت بمعلومات المنتجات (الطريقة القديمة)
  const updatePromptWithProducts = () => {
    const basePrompt = `أنت مساعد ذكي لمتجر إلكتروني. مهمتك الرد على استفسارات العملاء بطريقة ودودة ومفيدة.

تعليمات مهمة:
1. كن ودوداً ومهذباً في جميع ردودك
2. عندما يسأل العميل عن لون بدون تحديد منتج، اعرض المنتج الافتراضي
3. إذا ذكر العميل منتج محدد، ابحث في ذلك المنتج تحديداً
4. اعرض السعر والمخزون المتوفر دائماً
5. إذا لم يكن اللون متوفر، اقترح ألوان بديلة
6. استخدم الرموز التعبيرية لجعل المحادثة أكثر ودية
7. اختصر ردودك وكن مباشراً
8. إذا لم تفهم السؤال، اطلب التوضيح بأدب

مثال على الرد:
"مرحباً! 😊 هذا هو الحذاء الأحمر المتوفر:
🏷️ حذاء رياضي نايك - أحمر
💰 السعر: 160 ج
📦 المخزون: 8 قطع متوفرة
📏 المقاس: 42

هل تريد معرفة المزيد أو لديك استفسار آخر؟"`;

    setFormData(prev => ({ ...prev, prompt_template: basePrompt }));
    toast.success("تم تحديث البرومت بمعلومات المنتجات الحالية");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            إعدادات Gemini AI
          </CardTitle>
          <CardDescription>
            قم بتكوين Gemini AI للرد التلقائي على رسائل العملاء
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* تفعيل/إلغاء تفعيل */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">تفعيل Gemini AI</Label>
              <p className="text-sm text-muted-foreground">
                تفعيل الردود التلقائية باستخدام الذكاء الاصطناعي
              </p>
            </div>
            <Switch
              id="enabled"
              checked={formData.is_enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, is_enabled: checked }))
              }
            />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api_key">Gemini API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api_key"
                type="password"
                placeholder="أدخل Gemini API Key"
                value={formData.api_key}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, api_key: e.target.value }))
                }
              />
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || !formData.api_key}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                اختبار
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              احصل على API Key من{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {/* النموذج */}
          <div className="space-y-2">
            <Label htmlFor="model">النموذج</Label>
            <Select
              value={formData.model}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, model: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر النموذج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash Preview (الأحدث)</SelectItem>
                <SelectItem value="gemini-2.5-pro-preview-05-06">Gemini 2.5 Pro Preview (الأقوى)</SelectItem>
                <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (مستقر)</SelectItem>
                <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (اقتصادي)</SelectItem>
                <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (قديم)</SelectItem>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (قديم)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              <strong>الأحدث:</strong> 2.5 Flash - سرعة وكفاءة عالية<br/>
              <strong>الأقوى:</strong> 2.5 Pro - للمهام المعقدة والتفكير المتقدم<br/>
              <strong>مستقر:</strong> 2.0 Flash - موثوق للاستخدام اليومي<br/>
              <strong>اقتصادي:</strong> 2.0 Lite - أقل تكلفة وسرعة عالية
            </p>
          </div>

          {/* البرومت الأساسي */}
          <div className="space-y-2">
            <Label htmlFor="prompt_template" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              البرومت الأساسي الرئيسي
            </Label>
            <Textarea
              id="prompt_template"
              placeholder="أنت مساعد ذكي لمتجر سوان شوب..."
              value={formData.prompt_template}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, prompt_template: e.target.value }))
              }
              rows={8}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              البرومت الرئيسي الذي يحدد سلوك الذكاء الاصطناعي بشكل عام
            </p>
          </div>

          {/* النظام الهجين الجديد - البرومت المنفصل */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
              <Bot className="w-5 h-5 text-blue-600" />
              <div className="text-sm font-medium text-blue-900">
                🚀 النظام الهجين الذكي - برومت منفصل للشخصية والمنتجات (اختياري)
              </div>
            </div>

            {/* ملاحظة النظام الهجين */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>💡 ملاحظة:</strong> إذا تركت البرومت الهجين فارغاً، سيتم استخدام البرومت الأساسي فقط.
                النظام الهجين يوفر مرونة أكثر ولكنه اختياري.
              </p>
            </div>

            {/* برومت الشخصية */}
            <div className="space-y-2">
              <Label htmlFor="personality_prompt" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                برومت الشخصية والأسلوب (اختياري)
              </Label>
              <Textarea
                id="personality_prompt"
                placeholder="أنت مساعد ودود لمتجر سوان شوب. اسمك سارة..."
                value={formData.personality_prompt}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, personality_prompt: e.target.value }))
                }
                rows={6}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                حددي شخصية المساعد وأسلوب الكلام والطريقة التي يتفاعل بها مع العملاء (يُستخدم مع البرومت الأساسي)
              </p>
            </div>

            {/* برومت المنتجات */}
            <div className="space-y-2">
              <Label htmlFor="products_prompt" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                برومت قواعد المنتجات والمبيعات (اختياري)
              </Label>
              <Textarea
                id="products_prompt"
                placeholder="قواعد التعامل مع المنتجات..."
                value={formData.products_prompt}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, products_prompt: e.target.value }))
                }
                rows={8}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                قواعد عرض المنتجات والأسعار والشراء ومعلومات التواصل (يُضاف للبرومت الأساسي عند الحاجة)
              </p>
            </div>

            {/* معلومات النظام الهجين */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Zap className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="text-xs text-green-700">
                  <strong>⚡ توفير Tokens:</strong> النظام يستخدم برومت الشخصية فقط للأسئلة العادية،
                  ويضيف برومت المنتجات فقط عند السؤال عن المنتجات - توفير يصل إلى 70%!
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Settings className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <strong>🎛️ مرونة كاملة:</strong> يمكنك تعديل الشخصية بدون تأثير على قواعد المنتجات،
                  وتعديل قواعد المنتجات بدون تأثير على الشخصية.
                </div>
              </div>
            </div>
          </div>

          {/* الحد الأقصى للكلمات */}
          <div className="space-y-2">
            <Label htmlFor="max_tokens">الحد الأقصى للكلمات: {formData.max_tokens}</Label>
            <Slider
              id="max_tokens"
              min={100}
              max={8000}
              step={100}
              value={[formData.max_tokens]}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, max_tokens: value[0] }))
              }
            />
            <p className="text-xs text-muted-foreground">
              النماذج الجديدة تدعم حتى 8000 كلمة (65,536 token)
            </p>
          </div>

          {/* درجة الإبداع */}
          <div className="space-y-2">
            <Label htmlFor="temperature">درجة الإبداع: {formData.temperature}</Label>
            <Slider
              id="temperature"
              min={0}
              max={1}
              step={0.1}
              value={[formData.temperature]}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, temperature: value[0] }))
              }
            />
            <p className="text-xs text-muted-foreground">
              0 = ردود متسقة، 1 = ردود إبداعية
            </p>
          </div>

          {/* تحذير */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              تأكد من مراجعة البرومت بعناية لضمان ردود مناسبة للعملاء.
              يُنصح بتجربة النظام قبل التفعيل الكامل.
            </AlertDescription>
          </Alert>

          {/* أزرار الحفظ */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              حفظ الإعدادات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
