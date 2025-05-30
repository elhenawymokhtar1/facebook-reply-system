import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductImageService, ProductImage } from '@/services/productImageService';
import { Upload, Image, Edit, Trash2, Eye, Plus, HelpCircle, Palette, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

// واجهة موحدة للألوان والصور
interface ColorData {
  id?: string;
  color_name: string;
  color_key: string;
  image_url: string;
  keywords: string[];
  description: string;
  is_active: boolean;
}

const ProductImages: React.FC = () => {
  const [colors, setColors] = useState<ColorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('colors');

  // نموذج موحد للألوان والصور
  const [formData, setFormData] = useState({
    color_name: '',
    color_key: '',
    image_url: '',
    keywords: '',
    description: '',
    is_active: true
  });

  // تحميل الألوان البسيطة
  const loadData = async () => {
    try {
      setLoading(true);

      // تحميل الألوان من النظام البسيط
      const colorsResponse = await fetch('http://localhost:3002/api/colors');
      if (colorsResponse.ok) {
        const colorsData = await colorsResponse.json();
        const formattedColors = colorsData.map((color: any) => ({
          id: color.id,
          color_name: color.arabic_name,
          color_key: color.color_key,
          image_url: color.image_url,
          keywords: color.keywords || [],
          description: `✅ Gemini يتعرف على ${color.arabic_name} تلقائياً`,
          is_active: color.is_active
        }));
        setColors(formattedColors);
      }
    } catch (error) {
      console.error('Error loading colors:', error);
      toast.error('خطأ في تحميل الألوان');
    } finally {
      setLoading(false);
    }
  };

  // إضافة لون بسيط
  const handleAddColorAndImage = async () => {
    try {
      if (!formData.color_name || !formData.image_url) {
        toast.error('يرجى ملء اسم اللون ورابط الصورة');
        return;
      }

      // التحقق من صحة الرابط
      const urlPattern = /^(https?:\/\/|\/)/;
      if (!urlPattern.test(formData.image_url.trim())) {
        toast.error('رابط الصورة غير صحيح. يجب أن يبدأ بـ http:// أو https:// أو /');
        return;
      }

      // إضافة اللون للنظام البسيط
      const colorResponse = await fetch('http://localhost:3002/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colorKey: formData.color_name.toLowerCase(),
          arabicName: formData.color_name,
          englishName: formData.color_name,
          imageUrl: formData.image_url,
          keywords: [formData.color_name] // بسيط - اسم اللون فقط
        })
      });

      if (colorResponse.ok) {
        toast.success(`تم إضافة اللون "${formData.color_name}" بنجاح! 🎉 Gemini سيتعرف عليه تلقائياً`);
        setIsAddDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error('فشل في إضافة اللون');
      }
    } catch (error) {
      console.error('Error adding color:', error);
      toast.error('خطأ في إضافة اللون: ' + (error as Error).message);
    }
  };



  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      color_name: '',
      color_key: '',
      image_url: '',
      keywords: '',
      description: '',
      is_active: true
    });
  };

  // حذف لون بسيط
  const handleDeleteColorAndImage = async (colorId: string, colorName: string) => {
    if (!confirm(`هل أنت متأكد من حذف اللون "${colorName}"؟\n\nسيتوقف Gemini عن التعرف عليه.`)) return;

    try {
      // حذف من النظام البسيط
      const colorResponse = await fetch(`http://localhost:3002/api/colors/${colorId}`, {
        method: 'DELETE'
      });

      if (colorResponse.ok) {
        toast.success(`تم حذف اللون "${colorName}" بنجاح! 🗑️`);
        loadData();
      } else {
        toast.error('فشل في حذف اللون');
      }
    } catch (error) {
      console.error('Error deleting color:', error);
      toast.error('خطأ في حذف اللون');
    }
  };





  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري تحميل الصور...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🎨 النظام البسيط للألوان</h1>
            <p className="text-muted-foreground">نظام بسيط يعتمد على ذكاء Gemini - لا تعقيد!</p>
          </div>

          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة لون بسيط
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة لون جديد</DialogTitle>
                  <DialogDescription>
                    أضف لون جديد للنظام البسيط - Gemini سيتعرف عليه تلقائياً!
                  </DialogDescription>
                </DialogHeader>
                <SimpleColorForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleAddColorAndImage}
                  submitText="إضافة اللون"
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* إحصائيات النظام البسيط */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">الألوان في النظام</p>
                  <p className="text-2xl font-bold">{colors.length}</p>
                  <p className="text-xs text-green-600">✅ Gemini يتعرف عليها تلقائياً</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">الصور المتاحة</p>
                  <p className="text-2xl font-bold">{colors.length}</p>
                  <p className="text-xs text-blue-600">📤 إرسال فوري</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">النظام</p>
                  <p className="text-2xl font-bold">بسيط</p>
                  <p className="text-xs text-purple-600">🚀 لا تعقيد</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* النظام البسيط */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              النظام البسيط - يعتمد على ذكاء Gemini
            </CardTitle>
            <CardDescription>
              🤖 Gemini يتعرف على الألوان تلقائياً من ردوده - لا حاجة لكلمات مفتاحية معقدة!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">✨ كيف يعمل النظام البسيط:</h3>
              <ul className="text-green-800 space-y-1 text-sm">
                <li>• <strong>المستخدم:</strong> "عايز اشوف الأحمر"</li>
                <li>• <strong>Gemini:</strong> "حبيبتي قمر 😍 اهو يا عسل اللون الأحمر ❤️✨"</li>
                <li>• <strong>النظام:</strong> يستخرج "الأحمر" من رد Gemini ويبعت الصورة!</li>
                <li>• <strong>النتيجة:</strong> صورة صحيحة بدون تعقيد! 🎉</li>
              </ul>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="colors">🎨 الألوان المتاحة</TabsTrigger>
                <TabsTrigger value="test">🧪 اختبار Gemini</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                <SimpleColorTable
                  colors={colors}
                  onDelete={handleDeleteColorAndImage}
                />
              </TabsContent>

              <TabsContent value="test" className="space-y-4">
                <GeminiColorTest />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>


      </div>
    </div>
  );
};

// نموذج بسيط للألوان
const SimpleColorForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  submitText: string;
}> = ({ formData, setFormData, onSubmit, submitText }) => {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>نصيحة:</strong> أضف اسم اللون فقط - Gemini سيتعرف عليه تلقائياً!
        </p>
      </div>

      <div>
        <Label>اسم اللون *</Label>
        <Input
          value={formData.color_name}
          onChange={(e) => setFormData({...formData, color_name: e.target.value})}
          placeholder="أحمر، أزرق، جملي، بيج..."
        />
      </div>

      <div>
        <Label>رابط الصورة *</Label>
        <Input
          value={formData.image_url}
          onChange={(e) => setFormData({...formData, image_url: e.target.value})}
          placeholder="https://files.easy-orders.net/image.jpg"
        />
      </div>

      <div>
        <Label>الوصف (اختياري)</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="كوتشي حريمي جميل..."
        />
      </div>

      <Button onClick={onSubmit} className="w-full">
        {submitText}
      </Button>
    </div>
  );
};

// جدول الألوان البسيط
const SimpleColorTable: React.FC<{
  colors: ColorData[];
  onDelete: (colorId: string, colorName: string) => void;
}> = ({ colors, onDelete }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map((color) => (
          <Card key={color.id} className="overflow-hidden">
            <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
              <img
                src={color.image_url}
                alt={color.color_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                }}
              />
              <div className="w-full h-full flex items-center justify-center" style={{display: 'none'}}>
                <Image className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg">{color.color_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ✅ Gemini يتعرف عليه تلقائياً
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(color.id!, color.color_name)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {colors.length === 0 && (
        <div className="text-center py-8">
          <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد ألوان</p>
          <p className="text-sm text-muted-foreground mt-2">أضف لون جديد ليتعرف عليه Gemini!</p>
        </div>
      )}
    </div>
  );
};

// مكون اختبار Gemini البسيط
const GeminiColorTest: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">🤖 كيف يعمل Gemini:</h3>
        <div className="space-y-3 text-blue-800 text-sm">
          <div className="p-3 bg-white rounded border">
            <p><strong>المستخدم:</strong> "عايز اشوف الأحمر"</p>
            <p><strong>Gemini:</strong> "حبيبتي قمر 😍 اهو يا عسل اللون الأحمر ❤️✨"</p>
            <p><strong>النظام:</strong> يستخرج "الأحمر" ← يبعت الصورة! ✅</p>
          </div>
          <div className="p-3 bg-white rounded border">
            <p><strong>المستخدم:</strong> "ابعتي البيج"</p>
            <p><strong>Gemini:</strong> "حبيبتي قمر 😍 اهو يا عسل اللون البيج 🤍✨"</p>
            <p><strong>النظام:</strong> يستخرج "البيج" ← يبعت الصورة! ✅</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-medium text-green-900 mb-2">✨ مزايا النظام البسيط:</h3>
        <ul className="text-green-800 space-y-1 text-sm">
          <li>• <strong>لا كلمات مفتاحية معقدة</strong> - Gemini ذكي!</li>
          <li>• <strong>لا نظام نقاط</strong> - استخراج مباشر من الرد</li>
          <li>• <strong>لا API calls إضافية</strong> - سرعة عالية</li>
          <li>• <strong>دقة عالية</strong> - Gemini مش بيغلط في الألوان</li>
          <li>• <strong>سهولة الصيانة</strong> - كود بسيط ومفهوم</li>
        </ul>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-900 mb-2">🎯 للاختبار:</h3>
        <p className="text-yellow-800 text-sm mb-2">
          اذهب لـ Facebook وجرب هذه الرسائل:
        </p>
        <ul className="text-yellow-800 space-y-1 text-sm">
          <li>• "عايز اشوف الأحمر"</li>
          <li>• "ابعتي البيج"</li>
          <li>• "وريني الجملي"</li>
          <li>• "في لون أزرق؟"</li>
        </ul>
        <p className="text-yellow-800 text-sm mt-2">
          <strong>النتيجة:</strong> Gemini سيرد ويبعت الصورة المناسبة تلقائياً! 🎉
        </p>
      </div>
    </div>
  );
};

export default ProductImages;
