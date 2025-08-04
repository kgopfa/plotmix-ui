'use client';

import { useParams } from 'next/navigation';
import EditorCanvas from '@/components/editor';

export default function EditorPage() {
  const params = useParams();
  const contentId = params.contentId as string;

  return (
    <div>
      {/* You can add a header here to show which content is being edited */}
      <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-gray-600">
        Editing: {contentId}
      </div>
      <EditorCanvas />
    </div>
  );
} 