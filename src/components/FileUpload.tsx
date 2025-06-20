import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image, 
  FileText, 
  Music, 
  Video, 
  X, 
  Send,
  Paperclip,
  Camera
} from 'lucide-react';

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSendFile: (file: File, caption?: string) => void;
  maxFileSize?: number; // بالميجابايت
}

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  isOpen, 
  onClose, 
  onSendFile, 
  maxFileSize = 10 
}) => {
  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null);
  const [caption, setCaption] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-8 h-8 text-green-500" />;
      case 'video':
        return <Video className="w-8 h-8 text-blue-500" />;
      case 'audio':
        return <Music className="w-8 h-8 text-purple-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file: File) => {
    // فحص حجم الملف
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`حجم الملف كبير جداً. الحد الأقصى هو ${maxFileSize} ميجابايت`);
      return;
    }

    // فحص نوع الملف
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('نوع الملف غير مدعوم');
      return;
    }

    const url = URL.createObjectURL(file);
    const type = getFileType(file);

    setSelectedFile({
      file,
      url,
      type
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSend = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    // محاكاة رفع الملف
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    onSendFile(selectedFile.file, caption);
    
    // إعادة تعيين الحالة
    setSelectedFile(null);
    setCaption('');
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  };

  const handleClose = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.url);
    }
    setSelectedFile(null);
    setCaption('');
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* رأس النافذة */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            إرسال ملف
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!selectedFile ? (
            /* منطقة اختيار الملف */
            <div>
              {/* منطقة السحب والإفلات */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  اسحب الملف هنا أو اضغط لاختيار ملف
                </h3>
                <p className="text-gray-600 mb-4">
                  الحد الأقصى: {maxFileSize} ميجابايت
                </p>
                
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Paperclip className="w-4 h-4" />
                    اختيار ملف
                  </button>
                  
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    التقاط صورة
                  </button>
                </div>
              </div>

              {/* أنواع الملفات المدعومة */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">أنواع الملفات المدعومة:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Image className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-600">صور</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Video className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-600">فيديو</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Music className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-600">صوت</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">مستندات</span>
                  </div>
                </div>
              </div>

              {/* حقول الإدخال المخفية */}
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              />
              
              <input
                ref={cameraInputRef}
                type="file"
                hidden
                capture="environment"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : (
            /* معاينة الملف */
            <div>
              {/* معاينة الملف */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                {selectedFile.type === 'image' ? (
                  <div className="text-center">
                    <img
                      src={selectedFile.url}
                      alt="معاينة"
                      className="max-w-full max-h-64 mx-auto rounded shadow-lg"
                    />
                    <p className="text-sm text-gray-600 mt-2">{selectedFile.file.name}</p>
                  </div>
                ) : selectedFile.type === 'video' ? (
                  <div className="text-center">
                    <video
                      src={selectedFile.url}
                      controls
                      className="max-w-full max-h-64 mx-auto rounded shadow-lg"
                    />
                    <p className="text-sm text-gray-600 mt-2">{selectedFile.file.name}</p>
                  </div>
                ) : selectedFile.type === 'audio' ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <Music className="w-16 h-16 text-purple-500" />
                    </div>
                    <audio src={selectedFile.url} controls className="w-full mb-2" />
                    <p className="text-sm text-gray-600">{selectedFile.file.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      {getFileIcon(selectedFile.type)}
                    </div>
                    <p className="font-medium text-gray-800">{selectedFile.file.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatFileSize(selectedFile.file.size)}
                    </p>
                  </div>
                )}
              </div>

              {/* معلومات الملف */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  {getFileIcon(selectedFile.type)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 truncate">
                      {selectedFile.file.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(selectedFile.file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(selectedFile.url);
                      setSelectedFile(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* حقل التعليق */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تعليق (اختياري)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="أضف تعليق للملف..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* شريط التقدم */}
              {isUploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>جاري الرفع...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* تذييل النافذة */}
        {selectedFile && (
          <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleSend}
              disabled={isUploading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              إرسال
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
