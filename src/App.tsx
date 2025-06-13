
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import SimpleHomePage from "./components/SimpleHomePage";
import SimpleConversationsPage from "./components/SimpleConversationsPage";
import Responses from "./pages/Responses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Conversations from "./pages/Conversations";

import Orders from "./pages/Orders";

import TestPage from "./pages/TestPage";
import TestSimple from "./pages/TestSimple";
import Categories from "./pages/Categories";

import SimpleTest from "./components/SimpleTest";
import NotFound from "./pages/NotFound";
import { NameUpdateService } from "./services/nameUpdateService";
import { initializeDatabase } from "./utils/setupDatabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // البيانات تبقى fresh لمدة 5 ثواني
      gcTime: 30000, // الاحتفاظ بالـ cache لمدة 30 ثانية
      refetchOnWindowFocus: false, // لا تعيد التحميل عند التركيز على النافذة
      refetchOnMount: false, // لا تعيد التحميل عند mount إذا كانت البيانات fresh
      retry: 2, // إعادة المحاولة مرتين فقط
    },
  },
});

const App = () => {
  console.log('🎯 App component is rendering...');

  useEffect(() => {
    // بدء خدمة تحديث الأسماء التلقائية
    console.log('🚀 بدء تطبيق Facebook Auto Reply');

    try {
      NameUpdateService.startAutoUpdate();
      // إعداد قاعدة البيانات
      initializeDatabase();
      console.log('✅ تم تحميل التطبيق بنجاح');
    } catch (error) {
      console.error('❌ خطأ في بدء التطبيق:', error);
    }

    // تنظيف عند إغلاق التطبيق
    return () => {
      try {
        NameUpdateService.stopAutoUpdate();
        console.log('🔄 تنظيف التطبيق');
      } catch (error) {
        console.error('❌ خطأ في إيقاف التطبيق:', error);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/simple" element={<SimpleHomePage />} />
            <Route path="/simple-conversations" element={<SimpleConversationsPage />} />
            <Route path="/responses" element={<Responses />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/orders" element={<Orders />} />

            <Route path="/test" element={<TestPage />} />
            <Route path="/test-simple" element={<TestSimple />} />
            <Route path="/categories" element={<Categories />} />

            <Route path="/simple-test" element={<SimpleTest />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
