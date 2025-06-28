import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// تطبيق بسيط جداً بدون مكتبات خارجية
function SimpleApp() {
  return (
    <div style={{
      fontFamily: 'Cairo, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
        <h1 style={{ fontSize: '3em', marginBottom: '20px' }}>
          🎉 React يعمل!
        </h1>
        
        <div style={{
          background: 'rgba(34, 197, 94, 0.3)',
          padding: '15px',
          borderRadius: '10px',
          margin: '20px 0',
          border: '2px solid #22c55e'
        }}>
          ✅ تم حل مشكلة الصفحة البيضاء
        </div>
        
        <div style={{
          background: 'rgba(59, 130, 246, 0.3)',
          padding: '15px',
          borderRadius: '10px',
          margin: '20px 0',
          border: '2px solid #3b82f6'
        }}>
          🚀 التطبيق جاهز للاستخدام
        </div>
        
        <button 
          onClick={() => alert('التطبيق يعمل بنجاح!')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            padding: '15px 30px',
            borderRadius: '10px',
            fontSize: '1.1em',
            cursor: 'pointer',
            margin: '10px'
          }}
        >
          🧪 اختبار التفاعل
        </button>
      </div>
    </div>
  )
}

// تحميل التطبيق
const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<SimpleApp />)
