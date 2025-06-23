import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './output.css';

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ لم يتم العثور على عنصر root');
  document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">❌ خطأ: لم يتم العثور على عنصر root</h1>';
} else {
  const root = createRoot(rootElement);
  root.render(<App />);
}
