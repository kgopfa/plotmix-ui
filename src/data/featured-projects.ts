import { CommunityProject } from './community-projects';

export interface FeaturedProject extends CommunityProject {
  lastViewed?: string;
  sharedBy?: string;
  isShared?: boolean;
}

export const recentlyViewedProjects: FeaturedProject[] = [
  {
    id: 101,
    title: "Dashboard Design",
    description: "Modern dashboard with analytics and charts",
    image: "/demo/coding.avif",
    author: "Sarah Chen",
    views: 1247,
    likes: 89,
    category: "Dashboard",
    lastViewed: "2024-01-15T10:30:00Z"
  },
  {
    id: 102,
    title: "Mobile App UI",
    description: "Clean and intuitive mobile interface design",
    image: "/demo/phone.avif",
    author: "Mike Johnson",
    views: 892,
    likes: 67,
    category: "Mobile",
    lastViewed: "2024-01-14T15:45:00Z"
  },
  {
    id: 103,
    title: "Brand Identity",
    description: "Complete brand identity and logo design",
    image: "/demo/drawing.avif",
    author: "Alex Rivera",
    views: 1563,
    likes: 134,
    category: "Branding",
    lastViewed: "2024-01-13T09:20:00Z"
  },
  {
    id: 104,
    title: "E-commerce Flow",
    description: "User journey for online shopping experience",
    image: "/demo/tablet.avif",
    author: "Emma Wilson",
    views: 2103,
    likes: 156,
    category: "E-commerce",
    lastViewed: "2024-01-12T14:15:00Z"
  }
];

export const sharedProjects: FeaturedProject[] = [
  {
    id: 201,
    title: "Design System Guide",
    description: "Comprehensive design system documentation",
    image: "/demo/ideas.avif",
    author: "David Kim",
    views: 987,
    likes: 78,
    category: "Design System",
    sharedBy: "Sarah Chen",
    isShared: true
  },
  {
    id: 202,
    title: "Prototype Templates",
    description: "Reusable prototype components and layouts",
    image: "/demo/present.avif",
    author: "Lisa Park",
    views: 743,
    likes: 45,
    category: "Templates",
    sharedBy: "Mike Johnson",
    isShared: true
  },
  {
    id: 203,
    title: "User Research Report",
    description: "Detailed user research findings and insights",
    image: "/demo/people.avif",
    author: "Chris Martinez",
    views: 1123,
    likes: 92,
    category: "Research",
    sharedBy: "Alex Rivera",
    isShared: true
  },
  {
    id: 204,
    title: "Animation Library",
    description: "Collection of micro-interactions and animations",
    image: "/demo/coding2.avif",
    author: "Anna Thompson",
    views: 876,
    likes: 67,
    category: "Animation",
    sharedBy: "Emma Wilson",
    isShared: true
  }
]; 