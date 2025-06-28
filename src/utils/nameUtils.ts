/**
 * وظائف مساعدة لإدارة أسماء المستخدمين
 */

/**
 * قائمة أسماء عربية شائعة للاستخدام كبديل للأسماء غير المعروفة
 */
export const ARABIC_NAMES = [
  'محمد علي', 'أحمد محمود', 'خالد إبراهيم', 'مصطفى حسين', 'علي يوسف',
  'عمر فاروق', 'يوسف أحمد', 'إبراهيم محمد', 'عبدالله سعيد', 'سعيد محمود',
  'سارة محمد', 'فاطمة أحمد', 'نور حسين', 'مريم خالد', 'رنا سمير',
  'أمل علي', 'ليلى يوسف', 'هدى محمود', 'سلمى إبراهيم', 'رشا عبدالله'
];

/**
 * تحقق مما إذا كان الاسم بحاجة إلى استبدال (مثل أسماء تبدأ بـ User)
 * @param name اسم المستخدم للتحقق
 */
export function needsNameReplacement(name: string | null | undefined): boolean {
  if (!name) return true;
  if (name.startsWith('User ')) return true;
  return false;
}

/**
 * توليد اسم بديل بناءً على معرف المحادثة
 * @param conversationId معرف المحادثة
 * @param fallbackPageName اسم الصفحة كبديل احتياطي
 * @param customerId معرف العميل على فيسبوك
 */
export function generateAlternativeName(
  conversationId: string | undefined, 
  fallbackPageName?: string,
  customerId?: string | null
): string {
  // إذا كان لدينا معرف المستخدم، نستخدمه
  if (customerId) {
    return `ID: ${customerId}`;
  }
  
  // التعامل مع الحالات الخاصة
  if (conversationId === undefined || conversationId === null || conversationId === '') {
    return fallbackPageName ? `عميل ${fallbackPageName}` : 'عميل غير معروف';
  }

  // استخدام معرف المحادثة
  return `ID: ${conversationId}`;
}

/**
 * الحصول على اسم العرض المناسب بناءً على بيانات المحادثة
 * @param customerName اسم العميل من قاعدة البيانات
 * @param customerId معرف العميل على فيسبوك
 * @param conversationId معرف المحادثة
 * @param pageName اسم الصفحة
 */
export function getDisplayName(
  customerName: string | null | undefined,
  customerId: string | null | undefined,
  conversationId: string | undefined,
  pageName?: string | null
): string {
  // حالات خاصة معينة
  if (customerName === 'Mokhtar Elsnayy') return 'Mokhtar Elsnayy';
  if (customerId === '351400718067673') return 'Simple A42';
  
  // فحص ما إذا كان الاسم بحاجة إلى استبدال
  if (needsNameReplacement(customerName)) {
    return generateAlternativeName(conversationId, pageName || undefined, customerId);
  }
  
  // استخدام الاسم الحالي إذا كان صالحًا
  return customerName || generateAlternativeName(conversationId, pageName || undefined, customerId);
}
