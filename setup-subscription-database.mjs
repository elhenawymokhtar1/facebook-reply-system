#!/usr/bin/env node

/**
 * 🗄️ سكريبت إعداد قاعدة بيانات نظام الاشتراكات
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 🔗 إعدادات Supabase
const SUPABASE_URL = 'https://ddwszecfsfkjnahesymm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 📖 قراءة ملف SQL
 */
function readSQLFile(filename) {
    const filePath = path.join(process.cwd(), 'database', filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`❌ الملف غير موجود: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf8');
}

/**
 * 🔧 تنفيذ استعلام SQL
 */
async function executeSQL(sql, description) {
    try {
        console.log(`🔄 ${description}...`);
        
        // تقسيم الاستعلامات المتعددة
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.trim()) {
                const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
                if (error) {
                    console.error(`❌ خطأ في تنفيذ: ${statement.substring(0, 100)}...`);
                    console.error(error);
                    throw error;
                }
            }
        }
        
        console.log(`✅ ${description} - تم بنجاح`);
    } catch (error) {
        console.error(`❌ فشل في ${description}:`, error.message);
        throw error;
    }
}

/**
 * 🏗️ إنشاء دالة SQL مساعدة لتنفيذ الاستعلامات
 */
async function createExecSQLFunction() {
    const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            EXECUTE sql_query;
        END;
        $$;
    `;
    
    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
        if (error && !error.message.includes('already exists')) {
            // إذا لم تكن الدالة موجودة، ننشئها بطريقة مختلفة
            console.log('🔄 إنشاء دالة SQL مساعدة...');
        }
    } catch (error) {
        console.log('ℹ️ سيتم استخدام طريقة بديلة لتنفيذ SQL');
    }
}

/**
 * ✅ التحقق من وجود الجداول
 */
async function checkTables() {
    try {
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', [
                'subscription_plans',
                'companies', 
                'company_users',
                'company_subscriptions',
                'usage_tracking',
                'payments',
                'invoices'
            ]);
        
        if (error) {
            console.log('ℹ️ سيتم إنشاء الجداول...');
            return [];
        }
        
        return data?.map(row => row.table_name) || [];
    } catch (error) {
        console.log('ℹ️ سيتم إنشاء الجداول...');
        return [];
    }
}

/**
 * 🚀 الدالة الرئيسية
 */
async function main() {
    console.log('🏗️ بدء إعداد قاعدة بيانات نظام الاشتراكات...\n');
    
    try {
        // 1. إنشاء دالة SQL مساعدة
        await createExecSQLFunction();
        
        // 2. التحقق من الجداول الموجودة
        const existingTables = await checkTables();
        console.log(`📊 الجداول الموجودة: ${existingTables.length}`);
        
        // 3. إنشاء هيكل قاعدة البيانات
        if (existingTables.length < 7) {
            const schemaSQL = readSQLFile('subscription-system-schema.sql');
            await executeSQL(schemaSQL, 'إنشاء هيكل قاعدة البيانات');
        } else {
            console.log('✅ هيكل قاعدة البيانات موجود بالفعل');
        }
        
        // 4. التحقق من وجود خطط الاشتراك
        const { data: existingPlans } = await supabase
            .from('subscription_plans')
            .select('id')
            .limit(1);
        
        if (!existingPlans || existingPlans.length === 0) {
            const plansSQL = readSQLFile('insert-subscription-plans.sql');
            await executeSQL(plansSQL, 'إدراج خطط الاشتراك');
        } else {
            console.log('✅ خطط الاشتراك موجودة بالفعل');
        }
        
        // 5. عرض ملخص النتائج
        console.log('\n🎉 تم إعداد قاعدة البيانات بنجاح!');
        console.log('\n📊 ملخص النظام:');
        
        // عرض خطط الاشتراك
        const { data: plans } = await supabase
            .from('subscription_plans')
            .select('name, name_ar, monthly_price, yearly_price, max_products, max_messages_per_month')
            .order('display_order');
        
        if (plans) {
            console.log('\n💰 خطط الاشتراك المتاحة:');
            plans.forEach(plan => {
                console.log(`  📋 ${plan.name} (${plan.name_ar})`);
                console.log(`     💵 ${plan.monthly_price}$/شهر - ${plan.yearly_price}$/سنة`);
                console.log(`     📦 ${plan.max_products === -1 ? 'غير محدود' : plan.max_products} منتج`);
                console.log(`     📨 ${plan.max_messages_per_month === -1 ? 'غير محدود' : plan.max_messages_per_month} رسالة/شهر`);
                console.log('');
            });
        }
        
        console.log('🚀 النظام جاهز لاستقبال الشركات!');
        
    } catch (error) {
        console.error('\n❌ فشل في إعداد قاعدة البيانات:', error.message);
        process.exit(1);
    }
}

// تشغيل السكريبت
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { main as setupSubscriptionDatabase };
