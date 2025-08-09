import { CirclePlus, MessagesSquare, Clapperboard, Boxes } from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  hoverColor: string;
  activeColor: string;
  strokeWidth?: number;
}

export const navigation: NavigationItem[] = [
  {
    name: 'New Chat',
    href: '/chat',
    icon: CirclePlus,
    color: 'text-gray-500',
    hoverColor: 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700',
    activeColor: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
  },
  {
    name: 'Chats',
    href: '/chats',
    icon: MessagesSquare,
    color: 'text-gray-500',
    hoverColor: 'hover:bg-gradient-to-r hover:from-sky-50 hover:to-sky-100 hover:text-sky-700',
    activeColor: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: Boxes,
    color: 'text-gray-500',
    hoverColor: 'hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 hover:text-violet-700',
    activeColor: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30',
    strokeWidth: 1.75,
  },
  {
    name: 'Content',
    href: '/content',
    icon: Clapperboard,
    color: 'text-gray-500',
    hoverColor: 'hover:bg-gradient-to-r hover:from-fuchsia-50 hover:to-fuchsia-50 hover:text-fuchsia-700',
    activeColor: 'bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30'
  },
]; 