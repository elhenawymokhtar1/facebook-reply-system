import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock, MessageCircle } from 'lucide-react';

interface FacebookMessageAlertProps {
  show: boolean;
  customerName?: string;
  onClose?: () => void;
}

export const FacebookMessageAlert: React.FC<FacebookMessageAlertProps> = ({ 
  show, 
  customerName = 'العميل',
  onClose 
}) => {
  if (!show) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        انتهت النافذة الزمنية للرد (24 ساعة)
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>
            <strong>لا يمكن إرسال رسائل إلى {customerName}</strong> لأن أكثر من 24 ساعة مرت على آخر رسالة منه.
          </p>
          
          <div className="bg-orange-100 p-3 rounded-md">
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4" />
              كيفية استئناف المحادثة:
            </h4>
            <ul className="text-sm space-y-1">
              <li>• العميل يحتاج لإرسال رسالة جديدة أولاً</li>
              <li>• بعدها يمكن الرد عليه بشكل طبيعي</li>
              <li>• الرسائل محفوظة في النظام ولن تضيع</li>
            </ul>
          </div>
          
          <div className="text-xs text-orange-600 mt-2">
            💡 <strong>نصيحة:</strong> هذا قيد من Facebook لحماية المستخدمين من الرسائل غير المرغوب فيها
          </div>
        </div>
      </AlertDescription>
      
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-orange-600 hover:text-orange-800"
        >
          ✕
        </button>
      )}
    </Alert>
  );
};

export default FacebookMessageAlert;
