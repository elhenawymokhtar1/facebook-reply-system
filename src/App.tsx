
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Responses from "./pages/Responses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Conversations from "./pages/Conversations";
import Orders from "./pages/Orders";
import ProductImages from "./pages/ProductImages";
import Products from "./pages/Products";
import ProductsVariants from "./pages/ProductsVariants";
import Categories from "./pages/Categories";
// import FacebookPageManagement from "./pages/FacebookPageManagement";
import NotFound from "./pages/NotFound";
import { NameUpdateService } from "./services/nameUpdateService";
import { initializeDatabase } from "./utils/setupDatabase";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // بدء خدمة تحديث الأسماء التلقائية
    console.log('🚀 بدء تطبيق Facebook Auto Reply');
    NameUpdateService.startAutoUpdate();

    // إعداد قاعدة البيانات
    initializeDatabase();

    // تنظيف عند إغلاق التطبيق
    return () => {
      NameUpdateService.stopAutoUpdate();
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
            <Route path="/responses" element={<Responses />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products-variants" element={<ProductsVariants />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/product-images" element={<ProductImages />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            {/* <Route path="/facebook-management" element={<FacebookPageManagement />} /> */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
