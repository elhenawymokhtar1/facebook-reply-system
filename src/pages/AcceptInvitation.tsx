/**
 * 📧 صفحة قبول دعوة المستخدم
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Building, 
  Mail, 
  Lock, 
  User, 
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  company_id: string;
  expires_at: string;
  invited_by_user: {
    name: string;
    email: string;
  };
}

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      
      // في التطبيق الحقيقي، نحتاج endpoint للتحقق من الدعوة
      // هنا سنحاكي البيانات
      const mockInvitation: InvitationData = {
        id: '1',
        email: 'user@example.com',
        role: 'employee',
        company_id: '123',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invited_by_user: {
          name: 'أحمد محمد',
          email: 'admin@company.com'
        }
      };
      
      setInvitation(mockInvitation);
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('فشل في تحميل بيانات الدعوة');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('الاسم مطلوب');
      return false;
    }

    if (!formData.password) {
      setError('كلمة المرور مطلوبة');
      return false;
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقتان');
      return false;
    }

    return true;
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3002/api/subscriptions/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          password: formData.password
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم قبول الدعوة بنجاح! 🎉');
        toast.info('يمكنك الآن تسجيل الدخول');
        
        // الانتقال إلى صفحة تسجيل الدخول
        navigate('/company-login', { 
          state: { 
            message: 'تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول.',
            email: invitation?.email 
          } 
        });
      } else {
        setError(result.error || 'فشل في قبول الدعوة');
      }
    } catch (error) {
      console.error('Accept invitation error:', error);
      setError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'owner': 'مالك الشركة',
      'admin': 'مدير',
      'manager': 'مدير قسم',
      'employee': 'موظف',
      'viewer': 'مشاهد'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500';
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'employee': return 'bg-green-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const isExpired = invitation ? new Date() > new Date(invitation.expires_at) : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">جاري تحميل بيانات الدعوة...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">دعوة غير صحيحة</h2>
            <p className="text-gray-600 mb-6">الدعوة غير موجودة أو منتهية الصلاحية</p>
            <Button onClick={() => navigate('/')} variant="outline">
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">دعوة منتهية الصلاحية</h2>
            <p className="text-gray-600 mb-6">
              انتهت صلاحية هذه الدعوة في {new Date(invitation.expires_at).toLocaleDateString('ar')}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            دعوة للانضمام
          </CardTitle>
          <CardDescription className="text-gray-600">
            تم دعوتك للانضمام كعضو في الفريق
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* معلومات الدعوة */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الإيميل:</span>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">{invitation.email}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الدور:</span>
                <Badge className={getRoleBadgeColor(invitation.role)}>
                  {getRoleName(invitation.role)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">دعوة من:</span>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">{invitation.invited_by_user.name}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">تنتهي في:</span>
                <span className="text-sm font-medium text-orange-600">
                  {new Date(invitation.expires_at).toLocaleDateString('ar')}
                </span>
              </div>
            </div>
          </div>

          {/* نموذج قبول الدعوة */}
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                الاسم الكامل *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="اسمك الكامل"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                كلمة المرور *
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="كلمة المرور (6 أحرف على الأقل)"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                تأكيد كلمة المرور *
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="تأكيد كلمة المرور"
                required
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري قبول الدعوة...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    قبول الدعوة
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/')}
                disabled={submitting}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
