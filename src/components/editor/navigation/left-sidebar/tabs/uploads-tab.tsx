import React, { useRef, useState } from 'react';
import { CloudUpload, FileText, Image, Video, Music, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useUploadedFiles, useUploadedFilesActions } from '@/stores/use-ui-store';

export const UploadsTab: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  
  // Get uploaded files from store
  const { files } = useUploadedFiles();
  const { addUploadedFile, removeUploadedFile } = useUploadedFilesActions();

  const supportedFormats = [
    {
      category: 'Images',
      icon: Image,
      formats: ['JPG', 'PNG', 'SVG', 'WebP'],
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      category: 'Videos',
      icon: Video,
      formats: ['MP4', 'WebM', 'MOV'],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      category: 'Audio',
      icon: Music,
      formats: ['MP3', 'WAV', 'OGG'],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      category: 'Documents',
      icon: FileText,
      formats: ['PDF', 'TXT'],
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(Array.from(files));
    }
  };

  const handleFileUpload = async (files: File[]) => {
    setUploading(true);
    setUploadStatus(null);

    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          await handleImageUpload(file);
        } else {
          // For now, we'll focus on image uploads
          // Other file types can be handled later
          console.log('File type not yet supported for canvas:', file.type);
        }
      }
      setUploadStatus(`Successfully uploaded ${files.length} file(s)`);
    } catch (error) {
      setUploadStatus('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      // Clear status after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const handleImageUpload = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        if (imageData) {
          // Add file to uploaded files store
          const uploadedFile = {
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            dataUrl: imageData,
          };
          
          try {
            addUploadedFile(uploadedFile);
            
            // Dispatch custom event to handle image import in the main editor
            const imageImportEvent = new CustomEvent('image-import', {
              detail: { file, imageData, uploadedFileId: uploadedFile.id }
            });
            window.dispatchEvent(imageImportEvent);
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Failed to read image data'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading image file'));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    removeUploadedFile(fileId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    return FileText;
  };

  const getFileColor = (type: string) => {
    if (type.startsWith('image/')) return 'text-green-600';
    if (type.startsWith('video/')) return 'text-blue-600';
    if (type.startsWith('audio/')) return 'text-purple-600';
    return 'text-orange-600';
  };

  return (
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CloudUpload className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Uploads</h3>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-4 hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer"
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CloudUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <div className="font-medium text-gray-700">Drag files here</div>
          <div className="text-xs text-gray-500">or click to browse</div>
        </div>

        {/* Upload Status */}
        {(uploading || uploadStatus) && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2">
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-blue-600">Uploading...</span>
              </>
            ) : uploadStatus?.includes('Successfully') ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">{uploadStatus}</span>
              </>
            ) : uploadStatus ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">{uploadStatus}</span>
              </>
            ) : null}
          </div>
        )}



        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-700 mb-2">Uploaded Files ({files.length})</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.type);
                const fileColor = getFileColor(file.type);
                
                return (
                  <div key={file.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileIcon className={`w-4 h-4 ${fileColor} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Supported Formats */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 mb-2">Supported Formats</div>
          {supportedFormats.map((format, index) => (
            <div key={index} className={`p-2 ${format.bgColor} rounded-lg`}>
              <div className="flex items-center gap-2 mb-1">
                <format.icon className={`w-4 h-4 ${format.color}`} />
                <span className="text-sm font-medium text-gray-700">{format.category}</span>
              </div>
              <div className="text-xs text-gray-600 ml-6">
                {format.formats.join(', ')}
              </div>
            </div>
          ))}
        </div>

        {/* Upload Limits */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium text-gray-700 mb-1">Upload Limits</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• Max file size: 100MB</div>
            <div>• Max files per upload: 10</div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}; 