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
    if (!lastMessage) {
      toast({
        title: "خطأ",
        description: "لا توجد رسالة لاختبار Gemini AI عليها",
        variant: "destructive",
      });
      return;
    }

    sendMessage.mutate({
      message: lastMessage,
      conversationId,
      senderId
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTestGemini}
      disabled={isLoading || !lastMessage}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bot className="h-4 w-4" />
      )}
      اختبار Gemini AI
    </Button>
  );
};
