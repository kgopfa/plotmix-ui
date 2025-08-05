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
  },
  {
    id: 105,
    title: "Social Media Kit",
    description: "Complete social media design templates",
    image: "/demo/ideas.avif",
    author: "David Kim",
    views: 987,
    likes: 78,
    category: "Social Media",
    lastViewed: "2024-01-11T11:30:00Z"
  },
  {
    id: 106,
    title: "Web App Prototype",
    description: "Interactive web application prototype",
    image: "/demo/coding2.avif",
    author: "Lisa Park",
    views: 743,
    likes: 45,
    category: "Web App",
    lastViewed: "2024-01-10T16:20:00Z"
  },
  {
    id: 107,
    title: "Illustration Set",
    description: "Custom illustration collection",
    image: "/demo/troll.avif",
    author: "Chris Martinez",
    views: 1123,
    likes: 92,
    category: "Illustration",
    lastViewed: "2024-01-09T13:45:00Z"
  },
  {
    id: 108,
    title: "Product Landing",
    description: "High-converting product landing page",
    image: "/demo/present.avif",
    author: "Anna Thompson",
    views: 876,
    likes: 67,
    category: "Landing Page",
    lastViewed: "2024-01-08T10:15:00Z"
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
  },
  {
    id: 205,
    title: "Icon Set Collection",
    description: "Comprehensive icon library for designers",
    image: "/demo/drawing.avif",
    author: "Ryan Cooper",
    views: 654,
    likes: 43,
    category: "Icons",
    sharedBy: "David Kim",
    isShared: true
  },
  {
    id: 206,
    title: "Wireframe Kit",
    description: "Low-fidelity wireframe templates",
    image: "/demo/phone.avif",
    author: "Maria Garcia",
    views: 1456,
    likes: 112,
    category: "Wireframes",
    sharedBy: "Lisa Park",
    isShared: true
  },
  {
    id: 207,
    title: "Color Palette Guide",
    description: "Curated color palettes for different industries",
    image: "/demo/tablet.avif",
    author: "James Wilson",
    views: 789,
    likes: 56,
    category: "Color",
    sharedBy: "Chris Martinez",
    isShared: true
  },
  {
    id: 208,
    title: "Typography System",
    description: "Complete typography hierarchy and guidelines",
    image: "/demo/coding.avif",
    author: "Sophie Lee",
    views: 923,
    likes: 78,
    category: "Typography",
    sharedBy: "Anna Thompson",
    isShared: true
  }
]; 