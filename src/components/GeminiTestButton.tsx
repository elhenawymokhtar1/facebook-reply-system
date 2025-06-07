import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bot, Loader2 } from "lucide-react";
import { useGeminiChat } from "@/hooks/useGeminiAi";
import { useToast } from "@/hooks/use-toast";

interface GeminiTestButtonProps {
  conversationId: string;
  senderId: string;
  lastMessage?: string;
}

export const GeminiTestButton: React.FC<GeminiTestButtonProps> = ({
  conversationId,
  senderId,
  lastMessage
}) => {
  const { sendMessage, isLoading } = useGeminiChat();
  const { toast } = useToast();

  const handleTestGemini = () => {
    // استخدام رسالة اختبار ثابتة بدلاً من آخر رسالة لتجنب التكرار
    const testMessage = "اختبار الذكاء الاصطناعي - مرحبا";

    toast({
      title: "جاري الاختبار",
      description: "يتم اختبار Gemini AI الآن...",
    });

    sendMessage.mutate({
      message: testMessage,
      conversationId,
      senderId
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTestGemini}
      disabled={isLoading}
      className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bot className="h-4 w-4" />
      )}
      اختبار AI
    </Button>
  );
};
