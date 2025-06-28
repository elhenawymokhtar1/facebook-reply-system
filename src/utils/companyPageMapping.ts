/**
 * ربط الشركات بصفحات Facebook
 * حل مؤقت حتى يتم تطبيق company_id في قاعدة البيانات
 * تاريخ الإنشاء: 24 يونيو 2025
 */

export interface CompanyPageMapping {
  [companyId: string]: {
    name: string;
    pages: string[];
    description: string;
  };
}

// ربط الشركات بصفحاتها
export const COMPANY_PAGE_MAPPING: CompanyPageMapping = {
  'ac1eea64-6240-4c15-9cf1-569560fafb54': {
    name: 'Simple A42',
    pages: ['351400718067673'], // Simple A42
    description: 'متجر بقالة'
  },
  'company-2': {
    name: 'سولا 127',
    pages: ['240244019177739'], // سولا 127
    description: 'شركة تجارية متنوعة'
  },
  'a37ce988-fd80-4a73-914f-63dc72b687e2': {
    name: '121cx',
    pages: ['351400718067673'], // نفس صفحة Simple A42 - يمكن للصفحة أن تكون في أكثر من شركة
    description: 'شركة 121cx للتجارة الإلكترونية'
  },
  'company-new': {
    name: 'شركة جديدة للاختبار',
    pages: [], // لا توجد صفحات للشركات الجديدة
    description: 'شركة ناشئة جديدة'
  },
  'new-company-123': {
    name: 'شركة تجريبية جديدة',
    pages: [], // شركة جديدة بدون صفحات
    description: 'شركة تجريبية للاختبار'
  }
};

/**
 * الحصول على صفحات الشركة
 */
export function getCompanyPages(companyId: string): string[] {
  const mapping = COMPANY_PAGE_MAPPING[companyId];
  return mapping ? mapping.pages : [];
}

/**
 * التحقق من ملكية الصفحة للشركة
 */
export function isPageOwnedByCompany(pageId: string, companyId: string): boolean {
  const companyPages = getCompanyPages(companyId);
  return companyPages.includes(pageId);
}

/**
 * فلترة الصفحات حسب الشركة
 */
export function filterPagesByCompany(pages: any[], companyId: string): any[] {
  console.log('🔍 filterPagesByCompany called with:', {
    pagesCount: pages?.length || 0,
    companyId,
    pages: pages?.map(p => ({ id: p.page_id, name: p.page_name })) || []
  });

  if (!companyId) {
    console.log('❌ No companyId provided - returning all pages');
    return pages || [];
  }

  // التحقق من وجود الشركة في النظام
  const companyInfo = COMPANY_PAGE_MAPPING[companyId];
  if (!companyInfo) {
    console.log('⚠️ Unknown company:', companyId, '- returning empty array for safety');
    return [];
  }

  const allowedPageIds = getCompanyPages(companyId);
  console.log('📋 Allowed page IDs for', companyId, ':', allowedPageIds);

  // إذا لم تكن هناك صفحات مخصصة، إرجاع مصفوفة فارغة
  if (allowedPageIds.length === 0) {
    console.log('⚠️ No pages allowed for company:', companyId, '(this is normal for new companies)');
    return [];
  }

  const filteredPages = pages.filter(page => {
    const isAllowed = allowedPageIds.includes(page.page_id);
    console.log(`🔍 Page ${page.page_name} (${page.page_id}): ${isAllowed ? '✅ allowed' : '❌ blocked'}`);
    return isAllowed;
  });

  console.log('✅ Final filtered pages:', filteredPages.length);
  return filteredPages;
}

/**
 * الحصول على معلومات الشركة
 */
export function getCompanyInfo(companyId: string) {
  return COMPANY_PAGE_MAPPING[companyId] || null;
}

/**
 * الحصول على جميع الشركات المتاحة
 */
export function getAllCompanies() {
  return Object.entries(COMPANY_PAGE_MAPPING).map(([id, info]) => ({
    id,
    ...info
  }));
}

/**
 * البحث عن الشركة التي تملك صفحة معينة
 */
export function findCompanyByPage(pageId: string): string | null {
  for (const [companyId, info] of Object.entries(COMPANY_PAGE_MAPPING)) {
    if (info.pages.includes(pageId)) {
      return companyId;
    }
  }
  return null;
}

/**
 * إضافة صفحة جديدة لشركة
 */
export function addPageToCompany(companyId: string, pageId: string): boolean {
  const mapping = COMPANY_PAGE_MAPPING[companyId];
  if (!mapping) return false;
  
  if (!mapping.pages.includes(pageId)) {
    mapping.pages.push(pageId);
    return true;
  }
  
  return false; // الصفحة موجودة بالفعل
}

/**
 * إزالة صفحة من شركة
 */
export function removePageFromCompany(companyId: string, pageId: string): boolean {
  const mapping = COMPANY_PAGE_MAPPING[companyId];
  if (!mapping) return false;
  
  const index = mapping.pages.indexOf(pageId);
  if (index > -1) {
    mapping.pages.splice(index, 1);
    return true;
  }
  
  return false; // الصفحة غير موجودة
}
