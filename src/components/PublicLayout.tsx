/**
 * 🌐 Layout للصفحات العامة بدون Sidebar
 * للصفحات التي لا تتطلب تسجيل دخول
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

export default PublicLayout;
