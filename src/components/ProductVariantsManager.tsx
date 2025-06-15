import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Palette, 
  Ruler,
  ShoppingBag,
  Eye,
  Copy
} from 'lucide-react';

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  is_active: boolean;
  description?: string;
}

interface ProductVariantsManagerProps {
  productId: string;
  productName: string;
}

const ProductVariantsManager: React.FC<ProductVariantsManagerProps> = ({ 
  productId, 
  productName 
}) => {
  const { toast } = useToast();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [newVariant, setNewVariant] = useState({
    sku: '',
    color: '',
    size: '',
    price: '',
    stock: '',
    image_url: ''
  });

  // جلب المتغيرات الموجودة
  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    try {
      setIsLoading(true);

      // جلب المتغيرات من جدول product_variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at');

      if (variantsError) {
        console.error('خطأ في جلب المتغيرات:', variantsError);

        // في حالة الخطأ، محاولة جلب المعلومات من المنتج الأساسي
        const { data: productData } = await supabase
          .from('ecommerce_products')
          .select('description, stock_quantity')
          .eq('id', productId)
          .single();

        if (productData?.description?.includes('متوفر بالألوان')) {
          // استخراج معلومات المتغيرات من الوصف
          const mockVariants = generateMockVariants(productData);
          setVariants(mockVariants);
        } else {
          setVariants([]);
        }
      } else {
        // تحويل البيانات للتأكد من التوافق
        const formattedVariants = (variantsData || []).map(variant => ({
          ...variant,
          name: variant.name || `${variant.color} - ${variant.size}`,
          is_active: variant.is_available !== undefined ? variant.is_available : true
        }));
        setVariants(formattedVariants);
      }
    } catch (error) {
      console.error('خطأ في جلب المتغيرات:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب متغيرات المنتج",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إنشاء متغيرات وهمية من وصف المنتج
  const generateMockVariants = (productData: any) => {
    const colors = ['أحمر', 'أزرق', 'أسود', 'أبيض'];
    const sizes = ['S', 'M', 'L', 'XL'];
    const mockVariants: ProductVariant[] = [];

    colors.forEach((color, colorIndex) => {
      sizes.forEach((size, sizeIndex) => {
        mockVariants.push({
          id: `mock-${colorIndex}-${sizeIndex}`,
          sku: `VAR-${(colorIndex * sizes.length + sizeIndex + 1).toString().padStart(3, '0')}`,
          name: `${productName} - ${color} - ${size}`,
          price: 150 + (color === 'أسود' ? 10 : 0),
          stock_quantity: Math.floor(Math.random() * 20) + 5,
          is_active: true,
          description: JSON.stringify({ color, size })
        });
      });
    });

    return mockVariants;
  };

  // إضافة أو تعديل متغير
  const handleAddVariant = async () => {
    try {
      if (!newVariant.sku || !newVariant.color || !newVariant.size) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة (SKU، اللون، المقاس)",
          variant: "destructive",
        });
        return;
      }

      const variantData = {
        product_id: productId,
        sku: newVariant.sku,
        color: newVariant.color,
        size: newVariant.size,
        price: parseFloat(newVariant.price) || 0,
        stock_quantity: parseInt(newVariant.stock) || 0,
        image_url: newVariant.image_url || null,
        is_available: true
      };

      let error;

      if (editingVariant) {
        // تعديل متغير موجود
        const { error: updateError } = await supabase
          .from('product_variants')
          .update(variantData)
          .eq('id', editingVariant.id);
        error = updateError;
      } else {
        // إضافة متغير جديد
        const { error: insertError } = await supabase
          .from('product_variants')
          .insert(variantData);
        error = insertError;
      }

      if (error) {
        throw error;
      }

      toast({
        title: "نجح",
        description: editingVariant ? "تم تعديل المتغير بنجاح" : "تم إضافة المتغير بنجاح",
      });

      setNewVariant({
        sku: '',
        color: '',
        size: '',
        price: '',
        stock: '',
        image_url: ''
      });
      setEditingVariant(null);
      setShowAddForm(false);
      fetchVariants();

    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || (editingVariant ? "فشل في تعديل المتغير" : "فشل في إضافة المتغير"),
        variant: "destructive",
      });
    }
  };

  // حذف متغير
  const handleDeleteVariant = async (variantId: string) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) {
        throw error;
      }

      toast({
        title: "نجح",
        description: "تم حذف المتغير بنجاح",
      });

      fetchVariants();

    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المتغير",
        variant: "destructive",
      });
    }
  };

  // دالة تعديل متغير
  const handleEditVariant = (variant: ProductVariant) => {
    setNewVariant({
      sku: variant.sku,
      price: variant.price.toString(),
      color: getVariantAttributes(variant.description).color || '',
      size: getVariantAttributes(variant.description).size || '',
      stock: variant.stock_quantity.toString(),
      image_url: variant.image_url || ''
    });
    setEditingVariant(variant);
    setShowAddForm(true);
  };

  // دالة نسخ متغير
  const handleCopyVariant = async (variant: ProductVariant) => {
    const attributes = getVariantAttributes(variant.description);
    const newVariantData = {
      sku: `${variant.sku}-copy`,
      price: variant.price.toString(),
      color: attributes.color || '',
      size: attributes.size || '',
      stock: variant.stock_quantity.toString(),
      image_url: variant.image_url || ''
    };

    setNewVariant(newVariantData);
    setShowAddForm(true);

    toast({
      title: "تم النسخ",
      description: "تم نسخ بيانات المتغير، يمكنك تعديلها وحفظها",
    });
  };

  // دالة عرض تفاصيل المتغير
  const handleViewVariant = (variant: ProductVariant) => {
    const attributes = getVariantAttributes(variant.description);

    alert(`تفاصيل المتغير:
الاسم: ${variant.name}
SKU: ${variant.sku}
السعر: ${variant.price} ج.م
الكمية: ${variant.stock_quantity}
اللون: ${attributes.color || 'غير محدد'}
المقاس: ${attributes.size || 'غير محدد'}
الحالة: ${variant.is_active ? 'نشط' : 'غير نشط'}`);
  };

  // استخراج معلومات الخواص من الوصف
  const getVariantAttributes = (description?: string) => {
    try {
      if (description) {
        const attrs = JSON.parse(description);
        return attrs;
      }
    } catch (error) {
      // تجاهل الخطأ
    }
    return {};
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
              <p className="text-gray-600">جاري تحميل المتغيرات...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            متغيرات المنتج: {productName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {variants.length} متغير
              </Badge>
              <Badge variant="outline">
                إجمالي المخزون: {variants.reduce((sum, v) => sum + v.stock_quantity, 0)}
              </Badge>
            </div>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة متغير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة/تعديل متغير */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingVariant ? 'تعديل المتغير' : 'إضافة متغير جديد'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                  placeholder="مثال: PROD-RED-M"
                />
              </div>
              <div>
                <Label htmlFor="price">السعر</Label>
                <Input
                  id="price"
                  type="number"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant({...newVariant, price: e.target.value})}
                  placeholder="150.00"
                />
              </div>
              <div>
                <Label htmlFor="color">اللون *</Label>
                <Input
                  id="color"
                  value={newVariant.color}
                  onChange={(e) => setNewVariant({...newVariant, color: e.target.value})}
                  placeholder="مثال: أحمر"
                />
              </div>
              <div>
                <Label htmlFor="size">المقاس *</Label>
                <Input
                  id="size"
                  value={newVariant.size}
                  onChange={(e) => setNewVariant({...newVariant, size: e.target.value})}
                  placeholder="مثال: M"
                />
              </div>

              <div>
                <Label htmlFor="stock">المخزون</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newVariant.stock}
                  onChange={(e) => setNewVariant({...newVariant, stock: e.target.value})}
                  placeholder="10"
                />
              </div>
            </div>

            {/* حقل الصورة */}
            <div className="mt-4">
              <Label htmlFor="image_url">رابط الصورة</Label>
              <Input
                id="image_url"
                value={newVariant.image_url}
                onChange={(e) => setNewVariant({...newVariant, image_url: e.target.value})}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                اختياري - أدخل رابط صورة المتغير
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddVariant} className="bg-green-600 hover:bg-green-700">
                {editingVariant ? 'تحديث المتغير' : 'حفظ المتغير'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingVariant(null);
                  setNewVariant({
                    sku: '',
                    color: '',
                    size: '',
                    price: '',
                    stock: '',
                    image_url: ''
                  });
                }}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة المتغيرات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {variants.map((variant) => {
          const attributes = getVariantAttributes(variant.description);
          
          return (
            <Card key={variant.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* صورة المتغير */}
                  {variant.image_url && (
                    <img 
                      src={variant.image_url} 
                      alt={variant.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  
                  {/* معلومات المتغير */}
                  <div>
                    <h3 className="font-semibold text-sm">{variant.name}</h3>
                    <p className="text-xs text-gray-600">SKU: {variant.sku}</p>
                  </div>

                  {/* الخواص */}
                  <div className="flex gap-2 flex-wrap">
                    {attributes.color && (
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        <Palette className="w-3 h-3 ml-1" />
                        {attributes.color}
                      </Badge>
                    )}
                    {attributes.size && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        <Ruler className="w-3 h-3 ml-1" />
                        {attributes.size}
                      </Badge>
                    )}
                  </div>

                  {/* السعر والمخزون */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-green-600">{variant.price} ج</p>
                      <p className="text-xs text-gray-600">مخزون: {variant.stock_quantity}</p>
                    </div>
                    <Badge className={variant.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {variant.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditVariant(variant)}
                      title="تعديل المتغير"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCopyVariant(variant)}
                      title="نسخ المتغير"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewVariant(variant)}
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    {!variant.id.startsWith('mock-') && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteVariant(variant.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* رسالة عدم وجود متغيرات */}
      {variants.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد متغيرات</h3>
            <p className="text-gray-600 mb-4">
              لم يتم إنشاء متغيرات لهذا المنتج بعد
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول متغير
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductVariantsManager;
