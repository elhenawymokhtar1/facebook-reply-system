import React from 'react';

const SimpleTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🎉 التطبيق يعمل بنجاح!</h1>
      <p>هذه صفحة اختبار بسيطة للتأكد من أن React يعمل بشكل صحيح.</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => alert('الزر يعمل!')}>
          اختبار الزر
        </button>
      </div>
    </div>
  );
};

export default SimpleTest;
