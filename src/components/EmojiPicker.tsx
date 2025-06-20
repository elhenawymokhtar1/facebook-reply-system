import React, { useState } from 'react';
import { Search, Clock, Smile, Heart, Star, Zap } from 'lucide-react';

interface EmojiPickerProps {
  isOpen: boolean;
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, onEmojiSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('smileys');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([
    '😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢'
  ]);

  const emojiCategories: EmojiCategory[] = [
    {
      id: 'recent',
      name: 'الأخيرة',
      icon: <Clock className="w-4 h-4" />,
      emojis: recentEmojis
    },
    {
      id: 'smileys',
      name: 'وجوه',
      icon: <Smile className="w-4 h-4" />,
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
        '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
        '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
        '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
        '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
        '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
        '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠',
        '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️',
        '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
        '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
        '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬'
      ]
    },
    {
      id: 'hearts',
      name: 'قلوب',
      icon: <Heart className="w-4 h-4" />,
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
        '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
        '💘', '💝', '💟', '♥️', '💌', '💋', '💍', '💎'
      ]
    },
    {
      id: 'gestures',
      name: 'إيماءات',
      icon: <Star className="w-4 h-4" />,
      emojis: [
        '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
        '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
        '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲',
        '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶',
        '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️',
        '👅', '👄', '💋', '🩸'
      ]
    },
    {
      id: 'objects',
      name: 'أشياء',
      icon: <Zap className="w-4 h-4" />,
      emojis: [
        '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽',
        '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
        '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
        '🎛️', '🧭', '⏱️', '⏰', '⏲️', '⏰', '🕰️', '⌛',
        '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔',
        '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰',
        '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️',
        '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣'
      ]
    }
  ];

  const stickers = [
    '🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁',
    '🍭', '🍬', '🍫', '🍩', '🍪', '☕', '🍵', '🥤',
    '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾',
    '🌟', '⭐', '🌠', '☀️', '🌙', '🌈', '☁️', '⛅',
    '🌤️', '⛈️', '🌩️', '⚡', '🔥', '💥', '❄️', '☃️',
    '⛄', '🌊', '💧', '💦', '☔', '🌂', '🌍', '🌎'
  ];

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    // إضافة الإيموجي للأخيرة
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 16);
    });
  };

  const filteredEmojis = searchTerm
    ? emojiCategories
        .flatMap(cat => cat.emojis)
        .filter(emoji => {
          // يمكن إضافة منطق بحث أكثر تطوراً هنا
          return true;
        })
    : emojiCategories.find(cat => cat.id === selectedCategory)?.emojis || [];

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-w-sm">
      {/* رأس محدد الإيموجي */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث عن إيموجي..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* فئات الإيموجي */}
      {!searchTerm && (
        <div className="flex border-b border-gray-200">
          {emojiCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-1 p-3 text-center hover:bg-gray-50 ${
                selectedCategory === category.id
                  ? 'bg-green-50 text-green-600 border-b-2 border-green-500'
                  : 'text-gray-600'
              }`}
              title={category.name}
            >
              {category.icon}
            </button>
          ))}
        </div>
      )}

      {/* شبكة الإيموجي */}
      <div className="p-3 max-h-64 overflow-y-auto">
        {searchTerm && filteredEmojis.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Smile className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا توجد نتائج</p>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 text-lg hover:bg-gray-100 rounded flex items-center justify-center"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* قسم الملصقات */}
      {selectedCategory === 'recent' && !searchTerm && (
        <div className="border-t border-gray-200">
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4" />
              ملصقات شائعة
            </h4>
            <div className="grid grid-cols-8 gap-1">
              {stickers.slice(0, 16).map((sticker, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick(sticker)}
                  className="w-8 h-8 text-lg hover:bg-gray-100 rounded flex items-center justify-center"
                  title={sticker}
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* تذييل محدد الإيموجي */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>اضغط على إيموجي لإضافته</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
