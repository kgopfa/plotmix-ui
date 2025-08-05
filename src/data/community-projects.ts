export interface CommunityProject {
  id: number;
  title: string;
  description: string;
  image: string;
  author: string;
  views: number;
  likes: number;
  category: string;
}

export const communityProjects: CommunityProject[] = [
  {
    id: 1,
    title: "Creative Design System",
    description: "A comprehensive design system with reusable components",
    image: "/demo/drawing.avif",
    author: "Sarah Chen",
    views: 1247,
    likes: 89,
    category: "Design System"
  },
  {
    id: 2,
    title: "Mobile App Prototype",
    description: "Interactive prototype for a mobile application",
    image: "/demo/phone.avif",
    author: "Mike Johnson",
    views: 892,
    likes: 67,
    category: "Prototype"
  },
  {
    id: 3,
    title: "Innovation Workshop",
    description: "Brainstorming session for product innovation",
    image: "/demo/ideas.avif",
    author: "Alex Rivera",
    views: 1563,
    likes: 134,
    category: "Workshop"
  },
  {
    id: 4,
    title: "Team Collaboration",
    description: "Real-time collaboration tools and workflows",
    image: "/demo/people.avif",
    author: "Emma Wilson",
    views: 2103,
    likes: 156,
    category: "Collaboration"
  },
  {
    id: 5,
    title: "Code Architecture",
    description: "Clean code architecture and best practices",
    image: "/demo/coding.avif",
    author: "David Kim",
    views: 987,
    likes: 78,
    category: "Development"
  },
  {
    id: 6,
    title: "Presentation Design",
    description: "Professional presentation templates and layouts",
    image: "/demo/present.avif",
    author: "Lisa Park",
    views: 743,
    likes: 45,
    category: "Presentation"
  },
  {
    id: 7,
    title: "Advanced Prototyping",
    description: "Complex interactive prototypes with animations",
    image: "/demo/ideas2.avif",
    author: "Chris Martinez",
    views: 1123,
    likes: 92,
    category: "Prototype"
  },
  {
    id: 8,
    title: "Creative Illustration",
    description: "Custom illustrations and visual storytelling",
    image: "/demo/troll.avif",
    author: "Anna Thompson",
    views: 876,
    likes: 67,
    category: "Illustration"
  },
  {
    id: 9,
    title: "Tablet App Design",
    description: "Optimized user experience for tablet devices",
    image: "/demo/tablet.avif",
    author: "Ryan Cooper",
    views: 654,
    likes: 43,
    category: "App Design"
  },
  {
    id: 10,
    title: "Backend Development",
    description: "Server-side architecture and API design",
    image: "/demo/coding2.avif",
    author: "Maria Garcia",
    views: 1456,
    likes: 112,
    category: "Development"
  },
  {
    id: 11,
    title: "User Research",
    description: "Comprehensive user research and insights",
    image: "/demo/people.avif",
    author: "James Wilson",
    views: 789,
    likes: 56,
    category: "Research"
  },
  {
    id: 12,
    title: "Design Thinking",
    description: "Design thinking methodology and workshops",
    image: "/demo/drawing.avif",
    author: "Sophie Lee",
    views: 923,
    likes: 78,
    category: "Workshop"
  }
]; 