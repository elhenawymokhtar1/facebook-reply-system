// Frontend Logger - يرسل الـ logs للـ API server
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
  timestamp?: string;
}

class FrontendLogger {
  private async sendLog(logData: LogData) {
    try {
      await fetch('http://localhost:3002/api/frontend-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...logData,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      // إذا فشل إرسال الـ log، اطبعه في console عادي
      console.error('Failed to send log to server:', error);
      console.log(`[${logData.level.toUpperCase()}] ${logData.message}`, logData.data);
    }
  }

  info(message: string, data?: any, source?: string) {
    this.sendLog({ level: 'info', message, data, source });
    // اطبع في console كمان للـ development
    console.log(`ℹ️ [${source || 'FRONTEND'}] ${message}`, data);
  }

  warn(message: string, data?: any, source?: string) {
    this.sendLog({ level: 'warn', message, data, source });
    console.warn(`⚠️ [${source || 'FRONTEND'}] ${message}`, data);
  }

  error(message: string, data?: any, source?: string) {
    this.sendLog({ level: 'error', message, data, source });
    console.error(`❌ [${source || 'FRONTEND'}] ${message}`, data);
  }

  debug(message: string, data?: any, source?: string) {
    this.sendLog({ level: 'debug', message, data, source });
    console.log(`🔍 [${source || 'FRONTEND'}] ${message}`, data);
  }

  // دالة خاصة لتتبع الأزرار
  buttonClick(buttonName: string, data?: any) {
    this.info(`Button clicked: ${buttonName}`, data, 'BUTTON');
  }

  // دالة خاصة لتتبع الـ API calls
  apiCall(method: string, url: string, data?: any) {
    this.info(`API Call: ${method} ${url}`, data, 'API');
  }

  // دالة خاصة لتتبع الأخطاء
  apiError(method: string, url: string, error: any) {
    this.error(`API Error: ${method} ${url}`, error, 'API');
  }
}

// إنشاء instance واحد للاستخدام في كل التطبيق
export const frontendLogger = new FrontendLogger();

// Export للاستخدام المباشر
export default frontendLogger;
