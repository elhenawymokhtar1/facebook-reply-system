-- إنشاء وظيفة exec_sql اللازمة لتهيئة جداول المنتجات والفئات
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح صلاحيات تنفيذ الوظيفة
GRANT EXECUTE ON FUNCTION public.exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql TO anon;
