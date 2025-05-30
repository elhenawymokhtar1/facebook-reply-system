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
import { Loader2, Bot, TestTube, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const GeminiSettings: React.FC = () => {
  const { settings, isLoading, saveSettings, testConnection, isSaving, isTesting } = useGeminiSettings();

  const [formData, setFormData] = useState({
    api_key: '',
    model: 'gemini-1.5-flash',
    prompt_template: '',
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

          {/* البرومت */}
          <div className="space-y-2">
            <Label htmlFor="prompt">البرومت (التعليمات)</Label>
            <Textarea
              id="prompt"
              placeholder="أدخل التعليمات للذكاء الاصطناعي..."
              value={formData.prompt_template}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, prompt_template: e.target.value }))
              }
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              هذه التعليمات ستحدد كيفية رد الذكاء الاصطناعي على العملاء
            </p>
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
