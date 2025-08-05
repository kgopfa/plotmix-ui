import React from 'react';
import Image from 'next/image';
import { Eye, Heart } from 'lucide-react';
import { CommunityProject } from '@/data/community-projects';

interface ProjectCardProps {
  project: CommunityProject;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
      {/* Project Image */}
      <div className="relative h-40 overflow-hidden">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {project.category}
          </span>
        </div>
      </div>
      
      {/* Project Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {project.description}
        </p>
        
        {/* Project Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-white">
                {project.author.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <span className="text-xs text-gray-600">{project.author}</span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-x-3 text-xs text-gray-500">
            <div className="flex items-center gap-x-1">
              <Eye className="size-3" />
              <span>{project.views}</span>
            </div>
            <div className="flex items-center gap-x-1">
              <Heart className="size-3" />
              <span>{project.likes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 