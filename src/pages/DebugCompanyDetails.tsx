/**
 * 🐛 صفحة تشخيص مشاكل تفاصيل الشركة
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DebugCompanyDetails: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [apiResponse, setApiResponse] = useState<string>('');

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('🧪 اختبار API تفاصيل الشركة...');
        
        const response = await fetch(`http://localhost:3002/api/subscriptions/admin/company/${companyId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        
        setDebugInfo({
          status: response.status,
          success: result.success,
          hasData: !!result.data,
          companyName: result.data?.name,
          error: result.message
        });
        
        setApiResponse(JSON.stringify(result, null, 2));
        
      } catch (error) {
        setDebugInfo({
          error: error.message,
          status: 'Network Error'
        });
        setApiResponse(`خطأ: ${error.message}`);
      }
    };

    if (companyId) {
      testAPI();
    }
  }, [companyId]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
        <h1 className="text-2xl font-bold mb-2">🐛 تشخيص صفحة تفاصيل الشركة</h1>
        <p><strong>معرف الشركة:</strong> {companyId}</p>
        <p><strong>المسار الحالي:</strong> {window.location.pathname}</p>
        <p><strong>الوقت:</strong> {new Date().toLocaleString('ar-EG')}</p>
      </div>

      {/* Navigation Test */}
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <h2 className="text-lg font-bold mb-2">🔗 اختبار التوجيه</h2>
        <div className="space-x-2">
          <button 
            onClick={() => navigate('/super-admin-dashboard')}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            العودة للوحة التحكم
          </button>
          <button 
            onClick={() => navigate(`/super-admin-company/${companyId}`)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            الصفحة الأصلية
          </button>
        </div>
      </div>

      {/* API Test Results */}
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <h2 className="text-lg font-bold mb-2">📡 نتائج اختبار API</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><strong>الحالة:</strong> {debugInfo.status}</div>
          <div><strong>نجح:</strong> {debugInfo.success ? '✅' : '❌'}</div>
          <div><strong>يحتوي على بيانات:</strong> {debugInfo.hasData ? '✅' : '❌'}</div>
          <div><strong>اسم الشركة:</strong> {debugInfo.companyName || 'غير متوفر'}</div>
        </div>
        
        {debugInfo.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">
            <strong>خطأ:</strong> {debugInfo.error}
          </div>
        )}
      </div>

      {/* Raw API Response */}
      <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded">
        <h2 className="text-lg font-bold mb-2">📄 استجابة API الخام</h2>
        <pre className="text-xs overflow-auto max-h-96 bg-white p-3 rounded border">
          {apiResponse || 'جاري التحميل...'}
        </pre>
      </div>

      {/* Browser Info */}
      <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded">
        <h2 className="text-lg font-bold mb-2">🌐 معلومات المتصفح</h2>
        <div className="text-sm space-y-1">
          <div><strong>User Agent:</strong> {navigator.userAgent}</div>
          <div><strong>URL:</strong> {window.location.href}</div>
          <div><strong>Protocol:</strong> {window.location.protocol}</div>
          <div><strong>Host:</strong> {window.location.host}</div>
        </div>
      </div>
    </div>
  );
};

export default DebugCompanyDetails;
