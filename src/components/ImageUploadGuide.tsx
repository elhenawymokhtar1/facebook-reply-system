import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ImageUploadGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* دليل سريع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            دليل رفع الصور
          </CardTitle>
          <CardDescription>
            كيفية إضافة صور المنتجات بشكل صحيح
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* الطرق المتاحة */}
          <div>
            <h3 className="font-semibold mb-2">طرق إضافة الصور:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">رفع ملف</span>
                  <Badge variant="outline">قريباً</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  رفع صورة من جهازك مباشرة
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Image className="h-4 w-4 text-green-500" />
                  <span className="font-medium">رابط مباشر</span>
                  <Badge variant="default">متاح</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  إدخال رابط الصورة مباشرة
                </p>
              </div>
            </div>
          </div>

          {/* الطريقة الحالية */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>الطريقة الحالية:</strong> ضع الصور في مجلد <code>public/product-images/</code>
              ثم استخدم الرابط <code>/product-images/اسم-الصورة.jpg</code>
            </AlertDescription>
          </Alert>

          {/* خطوات العمل */}
          <div>
            <h3 className="font-semibold mb-2">خطوات إضافة صورة:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>ضع ملف الصورة في مجلد <code>public/product-images/</code></li>
              <li>اختر اللون المناسب من القائمة</li>
              <li>أدخل رابط الصورة: <code>/product-images/اسم-الملف.jpg</code></li>
              <li>أضف وصف جذاب للصورة</li>
              <li>اضغط "إضافة الصورة"</li>
            </ol>
          </div>

          {/* أمثلة على الروابط */}
          <div>
            <h3 className="font-semibold mb-2">أمثلة على الروابط:</h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">روابط محلية:</p>
                <div className="space-y-1 text-sm font-mono bg-gray-50 p-3 rounded">
                  <div>/product-images/white-shoe.jpg</div>
                  <div>/product-images/black-shoe.jpg</div>
                  <div>/product-images/red-shoe.jpg</div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">روابط خارجية:</p>
                <div className="space-y-1 text-sm font-mono bg-blue-50 p-3 rounded">
                  <div>https://example.com/images/shoe.jpg</div>
                  <div>https://files.easy-orders.net/image.jpg</div>
                  <div>https://your-domain.com/photos/product.png</div>
                </div>
              </div>
            </div>
          </div>

          {/* مواصفات الصور */}
          <div>
            <h3 className="font-semibold mb-2">مواصفات الصور المفضلة:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">الحجم:</span> 1080x1080 بكسل أو أكبر
              </div>
              <div>
                <span className="font-medium">التنسيق:</span> JPG, PNG, WebP
              </div>
              <div>
                <span className="font-medium">الخلفية:</span> بيضاء أو شفافة
              </div>
              <div>
                <span className="font-medium">الجودة:</span> عالية ووضحة
              </div>
            </div>
          </div>

          {/* نصائح */}
          <div>
            <h3 className="font-semibold mb-2">نصائح مهمة:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>استخدم أسماء ملفات واضحة ومفهومة</li>
              <li>تأكد من وضوح المنتج في الصورة</li>
              <li>استخدم إضاءة جيدة عند التصوير</li>
              <li>اجعل المنتج هو محور الصورة</li>
              <li>تجنب الخلفيات المشتتة</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* حالة النظام */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            حالة النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>قاعدة البيانات</span>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                متصل
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>مجلد الصور</span>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                جاهز
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Gemini AI</span>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                نشط
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Facebook API</span>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                متصل
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageUploadGuide;
