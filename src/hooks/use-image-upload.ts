import { useCallback, useEffect, useRef } from 'react';
import { createNewObject } from '@/lib/canvas-object-factory';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useUploadedFilesActions } from '@/stores/use-ui-store';

interface UseImageUploadReturn {
  imageFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageFile: (file: File) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const { elements: canvasObjects, addElement } = useCanvasStore();
  const { select: selectElement } = useSelectionStore();
  const { linkFileToElement } = useUploadedFilesActions();

  // Helper function to handle image file directly
  const handleImageFile = useCallback((file: File) => {
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      if (imageData) {
        // Position new image at center of fixed canvas (0,0 in canvas coordinates)
        const newImage = createNewObject(
          'image',
          0, // Center of canvas
          0, // Center of canvas
          canvasObjects,
          undefined, // pathPoints
          false, // isPath
          imageData,
          200, // default width
          150  // default height
        );

        // Add to canvas and select
        addElement(newImage);
        selectElement([newImage]);
      }
    };

    reader.onerror = () => {
      alert('Error reading image file.');
    };

    reader.readAsDataURL(file);
  }, [canvasObjects, addElement, selectElement]);

  // Handle image file upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleImageFile(file);
    
    // Clear the input so same file can be uploaded again
    e.target.value = '';
  }, [handleImageFile]);

  // Add event listener for image import from uploads tab
  useEffect(() => {
    const handleImageImport = (event: CustomEvent) => {
      const { file, imageData, uploadedFileId } = event.detail;
      if (file && imageData) {
        // Create new image element directly from the provided data
        const newImage = createNewObject(
          'image',
          0, // Center of canvas
          0, // Center of canvas
          canvasObjects,
          undefined, // pathPoints
          false, // isPath
          imageData,
          200, // default width
          150  // default height
        );

        // Add to canvas and select
        addElement(newImage);
        selectElement([newImage]);
        
        // Link the uploaded file to the canvas element if we have an uploaded file ID
        if (uploadedFileId) {
          linkFileToElement(uploadedFileId, newImage.id);
        }
      } else if (file) {
        // Fallback to old method for backward compatibility
        handleImageFile(file);
      }
    };

    window.addEventListener('image-import', handleImageImport as EventListener);
    return () => {
      window.removeEventListener('image-import', handleImageImport as EventListener);
    };
  }, [canvasObjects, addElement, selectElement, handleImageFile, linkFileToElement]);

  return {
    imageFileInputRef,
    handleImageFile,
    handleImageUpload,
  };
}; 