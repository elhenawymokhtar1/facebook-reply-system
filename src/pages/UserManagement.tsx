/**
 * 👥 صفحة إدارة المستخدمين والأدوار
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Calendar,
  Crown,
  ArrowLeft,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  permissions?: string[];
}

interface Role {
  role: string;
  name: string;
  description: string;
}

interface Permission {
  permission: string;
  name: string;
  category: string;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<{ [category: string]: Permission[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // بيانات النموذج
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    customPermissions: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const company = JSON.parse(localStorage.getItem('company') || '{}');
      if (!company.id) {
        navigate('/company-login');
        return;
      }

      // تحميل المستخدمين والأدوار والصلاحيات
      const [usersRes, rolesRes, permissionsRes] = await Promise.all([
        fetch(`http://localhost:3002/api/subscriptions/companies/${company.id}/users`),
        fetch('http://localhost:3002/api/subscriptions/roles'),
        fetch('http://localhost:3002/api/subscriptions/permissions')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.data || []);
      }

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        setPermissions(permissionsData.data?.grouped || {});
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const company = JSON.parse(localStorage.getItem('company') || '{}');
      
      const response = await fetch(`http://localhost:3002/api/subscriptions/companies/${company.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم إضافة المستخدم بنجاح');
        setIsAddDialogOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'employee', customPermissions: [] });
        loadData();
      } else {
        toast.error(result.error || 'فشل في إضافة المستخدم');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('حدث خطأ في إضافة المستخدم');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const company = JSON.parse(localStorage.getItem('company') || '{}');
      
      const response = await fetch(`http://localhost:3002/api/subscriptions/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, companyId: company.id })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم تحديث الدور بنجاح');
        loadData();
      } else {
        toast.error(result.error || 'فشل في تحديث الدور');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('حدث خطأ في تحديث الدور');
    }
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

  const getRoleName = (role: string) => {
    const roleObj = roles.find(r => r.role === role);
    return roleObj?.name || role;
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط التنقل */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/company-dashboard')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة للوحة التحكم
            </Button>
            
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              إدارة المستخدمين والأدوار
            </h1>
            
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">المستخدمين النشطين</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Crown className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">المديرين</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => ['owner', 'admin'].includes(u.role)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">الأدوار المتاحة</p>
                  <p className="text-2xl font-bold text-orange-600">{roles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* شريط البحث والإجراءات */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في المستخدمين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                إضافة مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات المستخدم الجديد وحدد دوره
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="اسم المستخدم"
                  />
                </div>

                <div>
                  <Label htmlFor="email">الإيميل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="كلمة المرور"
                  />
                </div>

                <div>
                  <Label htmlFor="role">الدور</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.role} value={role.role}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddUser}>
                    إضافة المستخدم
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* قائمة المستخدمين */}
        <Card>
          <CardHeader>
            <CardTitle>المستخدمين</CardTitle>
            <CardDescription>
              إدارة مستخدمي الشركة وأدوارهم وصلاحياتهم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span>{user.email}</span>
                      </div>
                      {user.last_login_at && (
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>آخر دخول: {new Date(user.last_login_at).toLocaleDateString('ar')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleName(user.role)}
                    </Badge>
                    
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'نشط' : 'معطل'}
                    </Badge>

                    <Select
                      value={user.role}
                      onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.role} value={role.role}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  لا توجد مستخدمين مطابقين للبحث
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
