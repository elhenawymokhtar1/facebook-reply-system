/**
 * 🏠 Layout للصفحات المحمية مع Sidebar
 * يظهر فقط للمستخدمين المسجلين
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React from 'react';
import Sidebar from './Sidebar';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
