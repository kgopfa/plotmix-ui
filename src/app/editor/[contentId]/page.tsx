'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import EditorCanvas from '@/components/editor';
import { apiClient } from '@/lib/api-client';
import { useProjectStore } from '@/stores/use-project-store';

export default function EditorPage() {
  const params = useParams();
  const contentId = params.contentId as string;
  const { setProjectInfo, setBaseline, captureBaseline } = useProjectStore();

  useEffect(() => {
    const init = async () => {
      if (!contentId) return;
      try {
        const res = await apiClient.get<any>(`/api/projects/${contentId}`);
        const project = res.data.project;
        setProjectInfo({
          projectId: project.id,
          name: project.name,
          title: project.title,
          version: project.version,
        });
        setBaseline(project.mainState as any);
        captureBaseline();
      } catch (e) {
        console.error('Failed to initialize editor project', e);
      }
    };
    init();
  }, [contentId, setProjectInfo, setBaseline, captureBaseline]);

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