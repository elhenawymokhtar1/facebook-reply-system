
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import Index from "./pages/Index";
import Responses from "./pages/Responses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Conversations from "./pages/Conversations";
import WhatsAppConversations from "./pages/WhatsAppConversations";

import Orders from "./pages/Orders";

import SimpleTestChat from "./pages/SimpleTestChat";
import WhatsAppBaileys from "./pages/WhatsAppBaileys";
import WhatsAppAdvanced from "./pages/WhatsAppAdvanced";
import WhatsAppConnection from "./pages/WhatsAppConnection";
import WhatsAppChatPage from "./pages/WhatsAppChatPage";
import WhatsAppTest from "./pages/WhatsAppTest";
import { WhatsAppAI } from "./pages/WhatsAppAI";
import { GeminiAISettings } from "./pages/GeminiAISettings";
import { FacebookAISettings } from "./pages/FacebookAISettings";

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
      // إعداد قاعدة البيانات - معطل مؤقتاً للاختبار
      // initializeDatabase();
      console.log('✅ تم تحميل التطبيق بنجاح (بدون تهيئة قاعدة البيانات)');
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
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/store-dashboard" element={<StoreDashboard />} />
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/responses" element={<Responses />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/conversations" element={<Conversations />} />
                  <Route path="/whatsapp-conversations" element={<WhatsAppConversations />} />
                  <Route path="/whatsapp" element={<WhatsAppConnection />} />
                  <Route path="/whatsapp-ai-settings" element={<WhatsAppAI />} />
                  <Route path="/whatsapp-chat" element={<WhatsAppChatPage />} />
                  <Route path="/whatsapp-test" element={<WhatsAppTest />} />
                  <Route path="/whatsapp-advanced" element={<WhatsAppAdvanced />} />
                  <Route path="/whatsapp-basic" element={<WhatsAppBaileys />} />
                  <Route path="/whatsapp-ai" element={<WhatsAppAI />} />

                  {/* Gemini AI Settings */}
                  <Route path="/gemini-ai-settings" element={<GeminiAISettings />} />
                  <Route path="/whatsapp-gemini-settings" element={<GeminiAISettings />} />

                  {/* Facebook Routes */}
                  <Route path="/facebook-conversations" element={<Conversations />} />
                  <Route path="/facebook-settings" element={<Settings />} />
                  <Route path="/facebook-ai-settings" element={<FacebookAISettings />} />

                  <Route path="/orders" element={<OrdersManagement />} />

                  {/* Test Route - محاكي الدردشة */}
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

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
