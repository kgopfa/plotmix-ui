export interface FontCategory {
  name: string;
  description: string;
  fonts: FontOption[];
}

export interface FontOption {
  name: string;
  family: string;
  category: string;
  webSafe?: boolean;
  popular?: boolean;
  description?: string;
}

export const FONT_CATEGORIES: FontCategory[] = [
  {
    name: 'Sans-serif',
    description: 'Clean, without serifs. Highly legible, versatile, and ideal for motion graphics and digital interfaces.',
    fonts: [
      { name: 'Tailwind Sans', family: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', category: 'Sans-serif', webSafe: true, popular: true, description: 'Official Tailwind CSS font stack - optimal performance and system compatibility' },
      { name: 'Arial', family: 'Arial, sans-serif', category: 'Sans-serif', webSafe: true, popular: true },
      { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif', category: 'Sans-serif', webSafe: true, popular: true },
      { name: 'Helvetica Neue', family: 'Helvetica Neue, Helvetica, Arial, sans-serif', category: 'Sans-serif', popular: true },
      { name: 'Verdana', family: 'Verdana, Geneva, sans-serif', category: 'Sans-serif', webSafe: true },
      { name: 'Tahoma', family: 'Tahoma, Geneva, sans-serif', category: 'Sans-serif', webSafe: true },
      { name: 'Trebuchet MS', family: 'Trebuchet MS, Helvetica, sans-serif', category: 'Sans-serif', webSafe: true },
      { name: 'Roboto', family: 'Roboto, Arial, sans-serif', category: 'Sans-serif', popular: true, description: 'Highly versatile, multi-lingual support' },
      { name: 'Libre Franklin', family: 'Libre Franklin, Arial, sans-serif', category: 'Sans-serif', description: 'Modern, supports Latin and non-Latin alphabets' },
      { name: 'Raleway', family: 'Raleway, Arial, sans-serif', category: 'Sans-serif', description: 'Open letterforms, ideal for headlines and body' },
      { name: 'Inter', family: 'Inter, Arial, sans-serif', category: 'Sans-serif', description: 'Designed for screens and UI, variable font' },
      { name: 'Source Sans Pro', family: 'Source Sans Pro, Arial, sans-serif', category: 'Sans-serif', description: 'Optimized for web legibility, 200+ languages' },
      { name: 'Poppins', family: 'Poppins, Arial, sans-serif', category: 'Sans-serif', description: 'Geometric, supports Latin/Devanagari' },
      { name: 'Open Sans', family: 'Open Sans, Arial, sans-serif', category: 'Sans-serif', description: 'Extremely neutral, easy to pair' },
      { name: 'Lato', family: 'Lato, Arial, sans-serif', category: 'Sans-serif', description: 'Balanced warmth and professionalism' },
      { name: 'Uni Sans', family: 'Uni Sans, Arial, sans-serif', category: 'Sans-serif', description: 'Classic sans-serif with unique blockiness' },
      { name: 'Morro', family: 'Morro, Arial, sans-serif', category: 'Sans-serif', description: 'Geometric and blocky, modern animated looks' },
    ]
  },
  {
    name: 'Serif',
    description: 'Features small decorative strokes (serifs) at the end of letters. Common in print and classical web headers.',
    fonts: [
      { name: 'Times New Roman', family: 'Times New Roman, Times, serif', category: 'Serif', webSafe: true, popular: true },
      { name: 'Georgia', family: 'Georgia, Times, serif', category: 'Serif', webSafe: true, popular: true },
      { name: 'Garamond', family: 'Garamond, Times New Roman, serif', category: 'Serif', webSafe: true },
      { name: 'Palatino', family: 'Palatino, Times New Roman, serif', category: 'Serif', webSafe: true },
      { name: 'Baskerville', family: 'Baskerville, Times New Roman, serif', category: 'Serif' },
      { name: 'Playfair Display', family: 'Playfair Display, Georgia, serif', category: 'Serif', description: 'Elegant serif for headlines' },
      { name: 'Merriweather', family: 'Merriweather, Georgia, serif', category: 'Serif', description: 'Designed for screen readability' },
      { name: 'Lora', family: 'Lora, Georgia, serif', category: 'Serif', description: 'Contemporary serif for body text' },
    ]
  },
  {
    name: 'Script',
    description: 'Mimics handwritten or calligraphic styles. Often used to add flair in titles or artistic animations.',
    fonts: [
      { name: 'Brush Script MT', family: 'Brush Script MT, cursive', category: 'Script', webSafe: true },
      { name: 'Dancing Script', family: 'Dancing Script, cursive', category: 'Script', description: 'Casual script with a dancing baseline' },
      { name: 'Pacifico', family: 'Pacifico, cursive', category: 'Script', description: 'Fun and friendly script font' },
      { name: 'Great Vibes', family: 'Great Vibes, cursive', category: 'Script', description: 'Elegant script with flowing strokes' },
      { name: 'Satisfy', family: 'Satisfy, cursive', category: 'Script', description: 'Casual script with a natural feel' },
      { name: 'Kaushan Script', family: 'Kaushan Script, cursive', category: 'Script', description: 'Artistic script with personality' },
      { name: 'Allura', family: 'Allura, cursive', category: 'Script', description: 'Elegant and sophisticated script' },
      { name: 'Alex Brush', family: 'Alex Brush, cursive', category: 'Script', description: 'Smooth and flowing script' },
    ]
  },
  {
    name: 'Monospace',
    description: 'All characters are the same width. Used for code snippets and some retro or functional designs.',
    fonts: [
      { name: 'Courier New', family: 'Courier New, Courier, monospace', category: 'Monospace', webSafe: true, popular: true },
      { name: 'Courier', family: 'Courier, monospace', category: 'Monospace', webSafe: true },
      { name: 'Consolas', family: 'Consolas, Courier New, monospace', category: 'Monospace' },
      { name: 'Monaco', family: 'Monaco, Consolas, monospace', category: 'Monospace' },
      { name: 'Menlo', family: 'Menlo, Monaco, monospace', category: 'Monospace' },
      { name: 'Source Code Pro', family: 'Source Code Pro, Consolas, monospace', category: 'Monospace', description: 'Optimized for source code' },
      { name: 'Fira Code', family: 'Fira Code, Consolas, monospace', category: 'Monospace', description: 'Programming font with ligatures' },
      { name: 'JetBrains Mono', family: 'JetBrains Mono, Consolas, monospace', category: 'Monospace', description: 'Modern programming font' },
      { name: 'Inconsolata', family: 'Inconsolata, Consolas, monospace', category: 'Monospace', description: 'Humanist monospace font' },
    ]
  },
  {
    name: 'Decorative/Display',
    description: 'Unconventional, expressive designs for impact in titles and animation.',
    fonts: [
      { name: 'Wicked Mouse', family: 'Wicked Mouse, Arial, sans-serif', category: 'Decorative/Display', description: 'Whimsical, cartoon-inspired' },
      { name: 'Ribbon', family: 'Ribbon, Arial, sans-serif', category: 'Decorative/Display', description: 'Designed for pre-rendered animated effects' },
      { name: 'Shera', family: 'Shera, Arial, sans-serif', category: 'Decorative/Display', description: 'Decorative, bold, suited for headlines' },
      { name: 'Multicolore', family: 'Multicolore, Arial, sans-serif', category: 'Decorative/Display', description: 'Colorful, fun, and engaging' },
      { name: 'Zombies Ode', family: 'Zombies Ode, Arial, sans-serif', category: 'Decorative/Display', description: 'Expressive, hand-crafted style' },
      { name: 'Echo Blitz', family: 'Echo Blitz, Arial, sans-serif', category: 'Decorative/Display', description: 'Dynamic and energetic' },
      { name: 'Rio Saint', family: 'Rio Saint, Arial, sans-serif', category: 'Decorative/Display', description: 'Bold and impactful' },
      { name: 'The Mukote', family: 'The Mukote, Arial, sans-serif', category: 'Decorative/Display', description: 'Unique and expressive' },
      { name: 'Christmas College', family: 'Christmas College, Arial, sans-serif', category: 'Decorative/Display', description: 'Festive and playful' },
      { name: 'Jakarta Display', family: 'Jakarta Display, Arial, sans-serif', category: 'Decorative/Display', description: 'Modern display font' },
      { name: 'SD For Tim Burton', family: 'SD For Tim Burton, Arial, sans-serif', category: 'Decorative/Display', description: 'Themed font for creative applications' },
      { name: 'Little Orange', family: 'Little Orange, Arial, sans-serif', category: 'Decorative/Display', description: 'Playful and friendly' },
      { name: 'Yomogi', family: 'Yomogi, Arial, sans-serif', category: 'Decorative/Display', description: 'Unique and creative' },
      { name: 'Webster', family: 'Webster, Arial, sans-serif', category: 'Decorative/Display', description: 'Highly-animated, experimental font' },
      { name: 'Galgo Condensed', family: 'Galgo Condensed, Arial, sans-serif', category: 'Decorative/Display', description: 'Emerging display font' },
      { name: 'Aalto Display', family: 'Aalto Display, Arial, sans-serif', category: 'Decorative/Display', description: 'Modern and distinctive' },
      { name: 'Geist', family: 'Geist, Arial, sans-serif', category: 'Decorative/Display', description: 'Contemporary display font' },
      { name: 'Round 8', family: 'Round 8, Arial, sans-serif', category: 'Decorative/Display', description: 'Geometric and modern' },
      { name: 'NOHEMI', family: 'NOHEMI, Arial, sans-serif', category: 'Decorative/Display', description: 'Bold and contemporary' },
      { name: 'Absans', family: 'Absans, Arial, sans-serif', category: 'Decorative/Display', description: 'Unique and expressive' },
      { name: 'Random Box', family: 'Random Box, Arial, sans-serif', category: 'Decorative/Display', description: 'Free-to-use animation font' },
      { name: 'Funtalous', family: 'Funtalous, Arial, sans-serif', category: 'Decorative/Display', description: 'Playful and fun' },
      { name: 'Chubby Bear', family: 'Chubby Bear, Arial, sans-serif', category: 'Decorative/Display', description: 'Cute and friendly' },
      { name: 'Cute Keyboard', family: 'Cute Keyboard, Arial, sans-serif', category: 'Decorative/Display', description: 'Playful and themed' },
      { name: 'CARAMEL MOCACHINO', family: 'CARAMEL MOCACHINO, Arial, sans-serif', category: 'Decorative/Display', description: 'Fun and engaging' },
    ]
  }
];

// Flatten all fonts for easy access
export const ALL_FONTS: FontOption[] = FONT_CATEGORIES.flatMap(category => 
  category.fonts.map(font => ({ ...font, category: category.name }))
);

// Get fonts by category
export const getFontsByCategory = (categoryName: string): FontOption[] => {
  const category = FONT_CATEGORIES.find(cat => cat.name === categoryName);
  return category ? category.fonts : [];
};

// Get popular fonts (marked as popular or web-safe)
export const getPopularFonts = (): FontOption[] => {
  return ALL_FONTS.filter(font => font.popular || font.webSafe);
};

// Get web-safe fonts
export const getWebSafeFonts = (): FontOption[] => {
  return ALL_FONTS.filter(font => font.webSafe);
};

// Search fonts by name
export const searchFonts = (query: string): FontOption[] => {
  const lowercaseQuery = query.toLowerCase();
  return ALL_FONTS.filter(font => 
    font.name.toLowerCase().includes(lowercaseQuery) ||
    font.family.toLowerCase().includes(lowercaseQuery) ||
    (font.description && font.description.toLowerCase().includes(lowercaseQuery))
  );
}; 