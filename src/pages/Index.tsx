
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Clock, TrendingUp, Plus, Settings, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import StatsCard from "@/components/StatsCard";
import RecentMessages from "@/components/RecentMessages";
import QuickActions from "@/components/QuickActions";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة التحكم
          </h1>
          <p className="text-gray-600">
            إدارة الردود الآلية على رسائل الفيسبوك
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="إجمالي الرسائل"
            value="1,234"
            icon={MessageSquare}
            change="+12%"
            color="blue"
          />
          <StatsCard
            title="الردود الآلية"
            value="856"
            icon={Clock}
            change="+8%"
            color="green"
          />
          <StatsCard
            title="المحادثات النشطة"
            value="42"
            icon={Users}
            change="+5%"
            color="purple"
          />
          <StatsCard
            title="معدل الاستجابة"
            value="98%"
            icon={TrendingUp}
            change="+2%"
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <QuickActions />
          </div>

          {/* Recent Messages */}
          <div className="lg:col-span-2">
            <RecentMessages />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
