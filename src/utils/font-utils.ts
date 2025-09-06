/**
 * Utility functions for font detection and management
 */

/**
 * Test if a font is available in the browser
 * @param fontFamily - The font family to test
 * @returns boolean - True if the font is available
 */
export const testFontAvailability = (fontFamily: string): boolean => {
  try {
    const testElement = document.createElement('span');
    testElement.style.fontFamily = `${fontFamily}, Arial`;
    testElement.style.fontSize = '72px';
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.style.whiteSpace = 'nowrap';
    testElement.textContent = 'a';
    document.body.appendChild(testElement);
    
    const originalWidth = testElement.offsetWidth;
    testElement.style.fontFamily = 'Arial';
    const fallbackWidth = testElement.offsetWidth;
    
    document.body.removeChild(testElement);
    
    // If widths are different, the font is loaded
    return originalWidth !== fallbackWidth;
  } catch (error) {
    return false;
  }
};

/**
 * Test multiple fonts and return available ones
 * @param fontList - Array of font names to test
 * @returns string[] - Array of available font names
 */
export const testFonts = (fontList: string[]): string[] => {
  return fontList.filter(font => testFontAvailability(font));
};

/**
 * Extract the primary font name from a font family string
 * @param fontFamily - The font family string (e.g., "Roboto, Arial, sans-serif")
 * @returns string - The primary font name (e.g., "Roboto")
 */
export const extractPrimaryFontName = (fontFamily: string): string => {
  return fontFamily.split(',')[0].trim().replace(/['"]/g, '');
};

/**
 * Check if a font is available using multiple detection methods
 * @param fontFamily - The font family to check
 * @param availableFonts - Array of known available fonts
 * @returns boolean - True if the font is available
 */
export const isFontAvailable = (fontFamily: string, availableFonts: string[]): boolean => {
  // Extract the primary font name
  const primaryFont = extractPrimaryFontName(fontFamily);
  
  // Check if it's in our available fonts list
  if (availableFonts.includes(primaryFont)) {
    return true;
  }
  
  // Also check if the full font family string is available
  if (availableFonts.includes(fontFamily)) {
    return true;
  }
  
  // Test the font directly
  return testFontAvailability(fontFamily);
};

/**
 * Comprehensive list of fonts to test for availability
 */
export const FONTS_TO_TEST = [
  // System and Web-safe fonts
  'Arial',
  'Helvetica',
  'Helvetica Neue',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Palatino',
  'Baskerville',
  'Brush Script MT',
  'Courier New',
  'Courier',
  'Consolas',
  'Monaco',
  'Menlo',
  
  // Google Fonts (Sans-serif)
  'Roboto',
  'Libre Franklin',
  'Raleway',
  'Inter',
  'Source Sans Pro',
  'Poppins',
  'Open Sans',
  'Lato',
  
  // Google Fonts (Serif)
  'Playfair Display',
  'Merriweather',
  'Lora',
  
  // Google Fonts (Script)
  'Dancing Script',
  'Pacifico',
  'Great Vibes',
  'Satisfy',
  'Kaushan Script',
  'Allura',
  'Alex Brush',
  
  // Google Fonts (Monospace)
  'Source Code Pro',
  'Fira Code',
  'JetBrains Mono',
  'Inconsolata'
] as const;
