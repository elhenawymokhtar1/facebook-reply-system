
import { useState } from "react";
import Navigation from "@/components/Navigation";
import ConversationsList from "@/components/ConversationsList";
import ChatWindow from "@/components/ChatWindow";
import { DiagnosticsPanel } from "@/components/DiagnosticsPanel";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const Conversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <div className="conversations-page-container bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />

      <div className="container mx-auto px-6 py-8 flex-1 flex flex-col overflow-hidden">
        <div className="mb-8 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                المحادثات
              </h1>
              <p className="text-gray-600">
                إدارة المحادثات والرد على رسائل الفيسبوك
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {showDiagnostics ? 'إخفاء التشخيص' : 'عرض التشخيص'}
            </Button>
          </div>
        </div>

        {/* لوحة التشخيص */}
        {showDiagnostics && (
          <div className="mb-6">
            <DiagnosticsPanel />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* قائمة المحادثات */}
          <div className="lg:col-span-1">
            <ConversationsList
              selectedConversation={selectedConversation}
              onSelectConversation={setSelectedConversation}
            />
          </div>

          {/* نافذة الدردشة */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <ChatWindow conversationId={selectedConversation} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">اختر محادثة</h3>
                  <p>اختر محادثة من القائمة لبدء الرد على الرسائل</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;
