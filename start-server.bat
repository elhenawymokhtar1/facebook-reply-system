@echo off
echo 🚀 بدء تشغيل خادم متجر سوان شوب...
echo.

cd /d "E:\Downloads\facebook-reply2\facebook-reply2"

echo 📦 تثبيت التبعيات...
call npm install

echo.
echo 🌐 تشغيل الخادم على المنفذ 8083...
echo.
echo ✅ الخادم سيعمل على: http://localhost:8083
echo ✅ صفحة المنتجات: http://localhost:8083/ecommerce-products
echo ✅ المنتجات متعددة الخواص: http://localhost:8083/product-variants
echo ✅ المتجر: http://localhost:8083/shop
echo.

call npm run dev

pause
