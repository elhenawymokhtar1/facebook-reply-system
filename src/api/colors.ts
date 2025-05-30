import express from 'express';
import fs from 'fs';
import path from 'path';

// مسار ملف الألوان الدائم
const COLORS_FILE = path.join(process.cwd(), 'colors-data.json');

// دالة لحفظ الألوان في ملف
const saveColorsToFile = () => {
  try {
    fs.writeFileSync(COLORS_FILE, JSON.stringify(colors, null, 2), 'utf8');
    console.log('💾 Colors saved to file successfully');
  } catch (error) {
    console.error('❌ Error saving colors:', error);
  }
};

// دالة لتحميل الألوان من الملف
const loadColorsFromFile = () => {
  try {
    if (fs.existsSync(COLORS_FILE)) {
      const data = fs.readFileSync(COLORS_FILE, 'utf8');
      const loadedColors = JSON.parse(data);
      console.log('📂 Colors loaded from file:', loadedColors.length);
      return loadedColors;
    }
  } catch (error) {
    console.error('❌ Error loading colors:', error);
  }
  return null;
};

// الألوان الافتراضية
const defaultColors = [
  {
    id: '1',
    color_key: 'white',
    arabic_name: 'أبيض',
    english_name: 'White',
    image_url: 'https://files.easy-orders.net/1744641208557436357.jpg',
    keywords: ['ابيض', 'أبيض', 'الابيض', 'الأبيض', 'white'],
    is_active: true
  },
  {
    id: '2',
    color_key: 'red',
    arabic_name: 'أحمر',
    english_name: 'Red',
    image_url: 'https://files.easy-orders.net/1744720320703143217.jpg',
    keywords: ['احمر', 'أحمر', 'الاحمر', 'الأحمر', 'red'],
    is_active: true
  },
  {
    id: '3',
    color_key: 'black',
    arabic_name: 'أسود',
    english_name: 'Black',
    image_url: 'https://files.easy-orders.net/1723117580290608498.jpg',
    keywords: ['اسود', 'أسود', 'الاسود', 'الأسود', 'black'],
    is_active: true
  },
  {
    id: '4',
    color_key: 'pink',
    arabic_name: 'وردي',
    english_name: 'Pink',
    image_url: 'https://files.easy-orders.net/1744720320703143217.jpg',
    keywords: ['جملي', 'وردي', 'الوردي', 'pink'],
    is_active: true
  },
  {
    id: '5',
    color_key: 'blue',
    arabic_name: 'أزرق',
    english_name: 'Blue',
    image_url: 'https://files.easy-orders.net/1723117554054321721.jpg',
    keywords: ['ازرق', 'أزرق', 'الازرق', 'الأزرق', 'blue', 'كحلي', 'الكحلي', 'لون ازرق', 'اللون الازرق', 'اللون الأزرق'],
    is_active: true
  },
  // مثال لإضافة لون جديد - فعل هذا المثال:
  {
    id: '6',
    color_key: 'purple',
    arabic_name: 'بنفسجي',
    english_name: 'Purple',
    image_url: 'https://files.easy-orders.net/1744720320703143217.jpg', // استخدم رابط صورتك هنا
    keywords: ['بنفسجي', 'البنفسجي', 'موف', 'purple', 'بنفسج'],
    is_active: true
  },
  {
    id: '7',
    color_key: 'beige',
    arabic_name: 'بيج',
    english_name: 'Beige',
    image_url: 'https://files.easy-orders.net/1739181695020677812.jpg',
    keywords: ['بيج', 'البيج', 'beige'],
    is_active: true
  },
  {
    id: '8',
    color_key: 'camel',
    arabic_name: 'جملي',
    english_name: 'Camel',
    image_url: 'https://files.easy-orders.net/1739181874715440699.jpg',
    keywords: ['جملي', 'الجملي', 'camel'],
    is_active: true
  }
];

// تحميل الألوان من الملف أو استخدام الافتراضية
let colors = loadColorsFromFile() || [...defaultColors];

// حفظ الألوان الافتراضية إذا لم يكن الملف موجوداً
if (!loadColorsFromFile()) {
  saveColorsToFile();
  console.log('🎨 Default colors saved to file');
}

const router = express.Router();

// الحصول على جميع الألوان
router.get('/', (req, res) => {
  console.log('📋 Current colors in memory:', colors.map(c => `${c.arabic_name} (${c.image_url})`));
  res.json(colors.filter(c => c.is_active));
});

// إضافة لون جديد
router.post('/', (req, res) => {
  const { colorKey, arabicName, englishName, imageUrl, keywords } = req.body;
  const newColor = {
    id: (colors.length + 1).toString(),
    color_key: colorKey,
    arabic_name: arabicName,
    english_name: englishName,
    image_url: imageUrl,
    keywords: Array.isArray(keywords) ? keywords : keywords.split(',').map((k: string) => k.trim()),
    is_active: true
  };
  colors.push(newColor);
  saveColorsToFile(); // 💾 حفظ في الملف
  console.log('✅ Color added and saved:', newColor.arabic_name);
  res.json(newColor);
});

// حذف لون
router.delete('/:id', (req, res) => {
  const index = colors.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    const deletedColor = colors[index];
    colors.splice(index, 1);
    saveColorsToFile(); // 💾 حفظ في الملف
    console.log('🗑️ Color deleted and saved:', deletedColor.arabic_name);
    res.json({ message: 'Color deleted', deletedColor });
  } else {
    res.status(404).json({ error: 'Color not found' });
  }
});

// البحث عن لون - نظام بسيط ومحسن
router.post('/detect', (req, res) => {
  const { text } = req.body;
  const lowerText = text.toLowerCase();

  console.log(`🔍 Searching for color in: "${text}"`);

  // ابحث في أسماء الألوان أولاً
  for (const color of colors) {
    const colorName = color.arabic_name.toLowerCase();
    if (lowerText.includes(colorName)) {
      console.log(`✅ Found color by name: ${color.arabic_name}`);
      return res.json({ detected: true, color });
    }
  }

  // ابحث في الكلمات المفتاحية
  for (const color of colors) {
    for (const keyword of color.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (lowerText.includes(keywordLower)) {
        console.log(`✅ Found color by keyword: ${color.arabic_name} (${keyword})`);
        return res.json({ detected: true, color });
      }
    }
  }

  console.log(`❌ No color found in: "${text}"`);
  res.json({ detected: false, color: null });
});

export default router;
