import React, { useRef } from 'react';
import { CloudArrowUpIcon, DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';

export const UploadsTab: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = [
    {
      category: 'Images',
      icon: PhotoIcon,
      formats: ['JPG', 'PNG', 'SVG', 'WebP'],
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      category: 'Videos',
      icon: VideoCameraIcon,
      formats: ['MP4', 'WebM', 'MOV'],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      category: 'Audio',
      icon: MusicalNoteIcon,
      formats: ['MP3', 'WAV', 'OGG'],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      category: 'Documents',
      icon: DocumentIcon,
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
      // Handle file upload logic here
      console.log('Files selected:', Array.from(files));
      // You can add actual upload functionality here
    }
  };

  return (
    <div className="h-full w-80 my-2 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CloudArrowUpIcon className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Uploads</h3>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-4 hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer"
          onClick={handleUploadClick}
        >
          <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <div className="font-medium text-gray-700">Drag files here</div>
          <div className="text-xs text-gray-500">or click to browse</div>
        </div>

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
            <div>• Total storage: 1GB</div>
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