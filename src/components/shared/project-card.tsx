import React from 'react';
import Image from 'next/image';
import { Eye, Heart } from 'lucide-react';
import { CommunityProject } from '@/data/community-projects';

interface ProjectCardProps {
  project: CommunityProject;
  onClick?: () => void;
  variant?: 'default' | 'compact';
}

export function ProjectCard({ project, onClick, variant = 'default' }: ProjectCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div 
      className={`group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all duration-300 cursor-pointer ${
        isCompact ? 'hover:shadow-md' : ''
      }`}
      onClick={handleClick}
    >
      {/* Project Image */}
      <div className={`relative overflow-hidden ${isCompact ? 'h-32' : 'h-48'}`}>
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ${
            isCompact ? 'px-2 py-0.5 text-xs' : ''
          }`}>
            {project.category}
          </span>
        </div>
      </div>
      
      {/* Project Content */}
      <div className={`${isCompact ? 'p-3' : 'p-4'}`}>
        <h3 className={`font-semibold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors ${
          isCompact ? 'text-sm' : ''
        }`}>
          {project.title}
        </h3>
        <p className={`text-gray-600 mb-3 line-clamp-2 ${
          isCompact ? 'text-xs mb-2' : 'text-sm'
        }`}>
          {project.description}
        </p>
        
        {/* Project Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <div className={`bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center w-8 h-8`}>
              <span className={`font-semibold text-white ${
                isCompact ? 'text-xs' : 'text-xs'
              }`}>
                {project.author.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <span className={`text-gray-600 text-xs`}>
              {project.author}
            </span>
          </div>
          
          {/* Stats */}
          <div className={`flex items-center gap-x-3 text-gray-500`}>
            <div className={`flex items-center gap-x-1 text-xs font-semibold`}>
              <Eye strokeWidth={2.5} className='size-3' />
              <span>{project.views}</span>
            </div>
            <div className={`flex items-center gap-x-1 text-xs font-semibold`}>
              <Heart strokeWidth={2.5} className='size-3' />
              <span>{project.likes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 