
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
import TestChat from "./pages/TestChat";
import SimpleTestChat from "./pages/SimpleTestChat";
import Categories from "./pages/Categories";
import EcommerceProducts from "./pages/EcommerceProducts";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrdersManagement from "./pages/OrdersManagement";
import CouponsManagement from "./pages/CouponsManagement";
import ShippingManagement from "./pages/ShippingManagement";
import EcommerceAnalytics from "./pages/EcommerceAnalytics";
import StoreSetup from "./pages/StoreSetup";
import ProductVariants from "./pages/ProductVariants";
import StoreDashboard from "./pages/StoreDashboard";

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
            <Route path="/" element={<StoreDashboard />} />
            <Route path="/store-dashboard" element={<StoreDashboard />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/simple" element={<SimpleHomePage />} />
            <Route path="/simple-conversations" element={<SimpleConversationsPage />} />
            <Route path="/responses" element={<Responses />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/orders" element={<OrdersManagement />} />

            <Route path="/test" element={<TestPage />} />
            <Route path="/test-simple" element={<TestSimple />} />
            <Route path="/test-chat" element={<TestChat />} />
            <Route path="/simple-test-chat" element={<SimpleTestChat />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/ecommerce-products" element={<EcommerceProducts />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/coupons" element={<CouponsManagement />} />
            <Route path="/shipping" element={<ShippingManagement />} />
            <Route path="/ecommerce-analytics" element={<EcommerceAnalytics />} />
            <Route path="/store-setup" element={<StoreSetup />} />
            <Route path="/product-variants" element={<ProductVariants />} />

            <Route path="/simple-test" element={<SimpleTest />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
