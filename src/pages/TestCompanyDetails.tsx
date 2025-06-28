/**
 * 🧪 صفحة اختبار لتفاصيل الشركة
 */

import React from 'react';
import { useParams } from 'react-router-dom';

const TestCompanyDetails: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();

  return (
    <div className="container mx-auto p-6">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <h1 className="text-2xl font-bold mb-4">🧪 صفحة اختبار تفاصيل الشركة</h1>
        <p className="mb-2"><strong>معرف الشركة:</strong> {companyId}</p>
        <p className="mb-2"><strong>المسار:</strong> /super-admin-company/{companyId}</p>
        <p className="text-sm text-green-600">✅ التوجيه يعمل بشكل صحيح!</p>
      </div>
    </div>
  );
};

export default TestCompanyDetails;
