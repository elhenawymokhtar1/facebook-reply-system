import React from 'react';

const TestSimple = () => {
  console.log('🧪 TestSimple component is rendering...');
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Cairo, sans-serif',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          🎉 النظام يعمل بنجاح!
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
          تم حل مشكلة التحميل وإصلاح الواجهة
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1rem'
        }}>
          <p>✅ React يعمل بشكل صحيح</p>
          <p>✅ TypeScript يعمل بشكل صحيح</p>
          <p>✅ Vite يعمل بشكل صحيح</p>
          <p>✅ الخادم متصل على المنفذ 3002</p>
        </div>
        <button 
          onClick={() => {
            console.log('🔄 اختبار console.log');
            alert('🎉 JavaScript يعمل بشكل صحيح!');
          }}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '5px',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          اختبار JavaScript
        </button>
      </div>
    </div>
  );
};

export default TestSimple;
