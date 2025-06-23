/**
 * 🧪 صفحة اختبار الأزرار
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const TestButtons: React.FC = () => {
  const handleClick = (buttonName: string) => {
    console.log(`🎯 Button clicked: ${buttonName}`);
    toast.success(`تم الضغط على زر ${buttonName}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>اختبار الأزرار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => handleClick('الأساسي')}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            زر أساسي
          </Button>
          
          <Button 
            onClick={() => handleClick('الثانوي')}
            variant="outline"
            className="w-full"
          >
            زر ثانوي
          </Button>
          
          <Button 
            onClick={() => handleClick('النجاح')}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            زر النجاح
          </Button>
          
          <Button 
            onClick={() => handleClick('الخطر')}
            className="w-full bg-red-500 hover:bg-red-600"
          >
            زر الخطر
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestButtons;
