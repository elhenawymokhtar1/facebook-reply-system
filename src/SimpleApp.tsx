import React from 'react';

function SimpleApp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '40px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        maxWidth: '600px'
      }}>
        <h1 style={{
          fontSize: '3em',
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          🎉 React يعمل!
        </h1>
        
        <div style={{
          fontSize: '1.2em',
          marginBottom: '30px',
          background: 'rgba(34, 197, 94, 0.3)',
          padding: '15px',
          borderRadius: '10px',
          border: '2px solid #22c55e'
        }}>
          ✅ تم تحميل React بنجاح
        </div>
        
        <div style={{
          fontSize: '1em',
          marginBottom: '20px',
          background: 'rgba(59, 130, 246, 0.3)',
          padding: '15px',
          borderRadius: '10px',
          border: '2px solid #3b82f6'
        }}>
          📅 التاريخ: {new Date().toLocaleString('ar-EG')}
        </div>
        
        <div style={{
          fontSize: '1em',
          marginBottom: '30px',
          background: 'rgba(59, 130, 246, 0.3)',
          padding: '15px',
          borderRadius: '10px',
          border: '2px solid #3b82f6'
        }}>
          🌐 الرابط: {window.location.href}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => window.location.href = '/debug.html'}
            style={{
              padding: '15px 30px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1em',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🔍 تشخيص متقدم
          </button>
          
          <button 
            onClick={() => window.location.href = '/react-test.html'}
            style={{
              padding: '15px 30px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1em',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🧪 اختبار React
          </button>
        </div>
        
        <div style={{
          marginTop: '30px',
          fontSize: '0.9em',
          opacity: '0.8',
          fontStyle: 'italic'
        }}>
          إذا كنت ترى هذه الصفحة، فهذا يعني أن React يعمل بشكل صحيح!
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;
