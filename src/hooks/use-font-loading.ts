import { useState, useEffect, useCallback } from 'react';
import { testFonts, FONTS_TO_TEST } from '@/utils/font-utils';

interface FontLoadingState {
  fontsLoaded: boolean;
  loadingFonts: boolean;
  availableFonts: string[];
  loadFonts: () => Promise<void>;
}

export const useFontLoading = (): FontLoadingState => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [loadingFonts, setLoadingFonts] = useState(true);
  const [availableFonts, setAvailableFonts] = useState<string[]>([]);

  const loadFonts = useCallback(async () => {
    if (fontsLoaded) return; // Don't reload if already loaded
    
    setLoadingFonts(true);
    
    try {
      // Load OTF fonts with exact file names
      const otfFonts = [
        { name: 'Bouncy-PERSONAL_USE_ONLY', file: 'Bouncy-PERSONAL_USE_ONLY.otf' },
        { name: 'College-Block', file: 'College-Block.otf' },
        { name: 'Playful-Boxes', file: 'Playful-Boxes.otf' },
        { name: 'DK-Jambo', file: 'DK-Jambo.otf' },
        { name: 'Bouncy-Thin-PERSONAL_USE_ONLY', file: 'Bouncy-Thin-PERSONAL_USE_ONLY.otf' },
        { name: 'Bouncy-Black-PERSONAL_USE_ONLY', file: 'Bouncy-Black-PERSONAL_USE_ONLY.otf' }
      ];
      
      // Load TTF fonts with exact file names
      const ttfFonts = [
        { name: 'varsity_regular', file: 'varsity_regular.ttf' },
        { name: 'spacetime-regular', file: 'spacetime-regular.ttf' },
        { name: 'Top-Secret', file: 'Top-Secret.ttf' },
        { name: 'Super-Kindly', file: 'Super-Kindly.ttf' },
        { name: 'Snowboarding', file: 'Snowboarding.ttf' },
        { name: 'Richis-Stiller', file: 'Richis-Stiller.ttf' },
        { name: 'Ka-Blam', file: 'Ka-Blam.ttf' },
        { name: 'Cute-Notes', file: 'Cute-Notes.ttf' },
        { name: 'KGChasingCars', file: 'KGChasingCars.ttf' },
        { name: 'Angelia-Beauty', file: 'Angelia-Beauty.ttf' }
      ];

      // Load all custom fonts concurrently and wait for completion
      const fontPromises = [
        ...otfFonts.map(async (font) => {
          try {
            const fontFace = new FontFace(font.name, `url(/fonts/otf/${font.file})`);
            await fontFace.load();
            document.fonts.add(fontFace);
            return font.name;
          } catch (err) {
            return null;
          }
        }),
        ...ttfFonts.map(async (font) => {
          try {
            const fontFace = new FontFace(font.name, `url(/fonts/tff/${font.file})`);
            await fontFace.load();
            document.fonts.add(fontFace);
            return font.name;
          } catch (err) {
            return null;
          }
        })
      ];

      // Wait for all custom fonts to load
      const loadedFonts = await Promise.all(fontPromises);
      const successfulFonts = loadedFonts.filter(name => name !== null);

      // Test all fonts in batches to avoid overwhelming the browser
      const batchSize = 10;
      const availableSystemFonts: string[] = [];
      
      for (let i = 0; i < FONTS_TO_TEST.length; i += batchSize) {
        const batch = FONTS_TO_TEST.slice(i, i + batchSize);
        const availableBatch = testFonts(batch);
        availableSystemFonts.push(...availableBatch);
        
        // Small delay between batches to prevent browser freezing
        if (i + batchSize < FONTS_TO_TEST.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Combine all available fonts - no fallbacks
      const allAvailableFonts = [...successfulFonts, ...availableSystemFonts];
      
      // Remove duplicates
      const uniqueFonts = [...new Set(allAvailableFonts)];
      
      setAvailableFonts(uniqueFonts);
      setFontsLoaded(true);
      setLoadingFonts(false);
      
    } catch (error) {
      console.error('Error loading fonts:', error);
      setLoadingFonts(false);
    }
  }, [fontsLoaded]);

  // Load fonts on mount
  useEffect(() => {
    loadFonts();
  }, [loadFonts]);

  return {
    fontsLoaded,
    loadingFonts,
    availableFonts,
    loadFonts
  };
};
