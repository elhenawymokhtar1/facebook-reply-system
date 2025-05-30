
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Edit, Trash2, MessageSquare, Hash, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useAutoReplies } from "@/hooks/useAutoReplies";
import AutoReplyTester from "@/components/AutoReplyTester";

const Responses = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newResponse, setNewResponse] = useState({
    keywords: "",
    response: "",
    isActive: true
  });

  const {
    autoReplies,
    isLoading,
    error,
    addAutoReply,
    updateAutoReply,
    deleteAutoReply,
    isAddingReply,
    isUpdatingReply,
    isDeletingReply,
  } = useAutoReplies();

  const filteredResponses = autoReplies.filter(response =>
    response.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase())) ||
    response.response_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddResponse = async () => {
    if (!newResponse.keywords.trim() || !newResponse.response.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const keywords = newResponse.keywords.split(",").map(k => k.trim()).filter(k => k);

    try {
      await addAutoReply.mutateAsync({
        keywords,
        responseText: newResponse.response,
      });

      setNewResponse({ keywords: "", response: "", isActive: true });
      setIsAddingNew(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleUpdateResponse = async (id: string, updates: any) => {
    try {
      await updateAutoReply.mutateAsync({ id, ...updates });
      setEditingId(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const toggleResponseStatus = (id: string, currentStatus: boolean) => {
    handleUpdateResponse(id, { isActive: !currentStatus });
  };

  const handleDeleteResponse = async (id: string) => {
    try {
      await deleteAutoReply.mutateAsync(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">الردود الآلية</h1>
            <p className="text-gray-600">إدارة الردود الآلية على رسائل الفيسبوك</p>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => setIsAddingNew(true)}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة رد جديد
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في الردود أو الكلمات المفتاحية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button variant="outline">تصفية</Button>
            </div>
          </CardContent>
        </Card>

        {/* Add New Response Form */}
        {isAddingNew && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>إضافة رد آلي جديد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keywords">الكلمات المفتاحية</Label>
                <Input
                  id="keywords"
                  placeholder="أدخل الكلمات المفتاحية مفصولة بفاصلة (مثال: مرحبا، السلام عليكم، أهلا)"
                  value={newResponse.keywords}
                  onChange={(e) => setNewResponse(prev => ({ ...prev, keywords: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  اكتب الكلمات المفتاحية مفصولة بفاصلة
                </p>
              </div>

              <div>
                <Label htmlFor="response">نص الرد</Label>
                <Textarea
                  id="response"
                  placeholder="اكتب الرد الذي سيتم إرساله تلقائياً..."
                  value={newResponse.response}
                  onChange={(e) => setNewResponse(prev => ({ ...prev, response: e.target.value }))}
                  className="mt-1 h-24"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    checked={newResponse.isActive}
                    onCheckedChange={(checked) => setNewResponse(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>تفعيل الرد</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewResponse({ keywords: "", response: "", isActive: true });
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleAddResponse}
                    disabled={isAddingReply}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isAddingReply ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                      <Plus className="w-4 h-4 ml-2" />
                    )}
                    إضافة الرد
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Responses List */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin ml-2" />
            <span>تحميل الردود...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <MessageSquare className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل الردود</h3>
              <p className="text-gray-600">{error.message}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResponses.map((response) => (
              <Card key={response.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 space-x-reverse mb-3">
                        <div className="flex flex-wrap gap-2">
                          {response.keywords.map((keyword, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 font-medium"
                            >
                              <Hash className="w-3 h-3 ml-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        <Badge
                          variant={response.is_active ? "default" : "secondary"}
                          className={response.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                          }
                        >
                          {response.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(response.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      <p className="text-gray-700 leading-relaxed">
                        {response.response_text}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse mr-4">
                      <Switch
                        checked={response.is_active}
                        onCheckedChange={() => toggleResponseStatus(response.id, response.is_active)}
                        disabled={isUpdatingReply}
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => setEditingId(response.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteResponse(response.id)}
                        disabled={isDeletingReply}
                      >
                        {isDeletingReply ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !error && filteredResponses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                {searchTerm ? (
                  <Search className="w-12 h-12 mx-auto mb-4" />
                ) : (
                  <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "لا توجد نتائج" : "لا توجد ردود آلية"}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "لم يتم العثور على ردود تطابق البحث"
                  : "ابدأ بإضافة ردود آلية لرسائل الفيسبوك"
                }
              </p>
              {!searchTerm && (
                <Button
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsAddingNew(true)}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة أول رد آلي
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* مكون اختبار الردود الآلية */}
        {autoReplies.length > 0 && (
          <div className="mt-8">
            <AutoReplyTester />
          </div>
        )}
      </div>
    </div>
  );
};

export default Responses;
