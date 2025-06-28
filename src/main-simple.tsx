import React from 'react';
import { createRoot } from 'react-dom/client';
import SimpleApp from './SimpleApp.tsx';

console.log('🚀 بدء تحميل التطبيق البسيط...');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ لم يتم العثور على عنصر root');
  document.body.innerHTML = `
    <div style="
      background: #dc2626; 
      color: white; 
      text-align: center; 
      padding: 50px; 
      font-family: Arial, sans-serif;
      font-size: 1.5em;
    ">
      ❌ خطأ: لم يتم العثور على عنصر root
    </div>
  `;
} else {
  console.log('✅ تم العثور على عنصر root');
  try {
    const root = createRoot(rootElement);
    console.log('✅ تم إنشاء React Root');
    root.render(<SimpleApp />);
    console.log('✅ تم تحميل التطبيق بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في تحميل التطبيق:', error);
    document.body.innerHTML = `
      <div style="
        background: #dc2626; 
        color: white; 
        text-align: center; 
        padding: 50px; 
        font-family: Arial, sans-serif;
        font-size: 1.2em;
      ">
        <h1>❌ خطأ في تحميل التطبيق</h1>
        <p>${error.message}</p>
        <p style="font-size: 0.9em; opacity: 0.8;">تحقق من Console للمزيد من التفاصيل</p>
      </div>
    `;
  }
}
