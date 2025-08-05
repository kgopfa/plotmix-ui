export interface Suggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'design' | 'algorithm' | 'system';
}

export const suggestions: Suggestion[] = [
  {
    id: '1',
    title: 'Design Twitter',
    description: 'Create a system design for Twitter',
    prompt: 'Design a system similar to Twitter. Include user authentication, tweet creation and storage, timeline generation, follow/unfollow functionality, and real-time notifications. Show the database schema, API endpoints, and system architecture.',
    category: 'design'
  },
  {
    id: '2',
    title: 'Design Spotify Top K Songs',
    description: 'Design a system to find top K songs',
    prompt: 'Design a system to find the top K most played songs on Spotify. Consider millions of users, real-time play counts, and efficient data structures. Include the algorithm, database design, and scaling considerations.',
    category: 'design'
  },
  {
    id: '3',
    title: 'Binary Search',
    description: 'Visualize binary search algorithm',
    prompt: 'Create a visual representation of binary search algorithm. Show a sorted array and demonstrate how the algorithm finds a target value by repeatedly dividing the search interval in half.',
    category: 'algorithm'
  },
  {
    id: '4',
    title: 'Explain Depth First Search',
    description: 'Visualize DFS algorithm step by step',
    prompt: 'Create a visual representation of Depth First Search algorithm. Show a graph with nodes and demonstrate how DFS traverses through the graph step by step, including the stack operations and visited nodes.',
    category: 'algorithm'
  },
  {
    id: '5',
    title: 'Design Twitter',
    description: 'Create a system design for Twitter',
    prompt: 'Design a system similar to Twitter. Include user authentication, tweet creation and storage, timeline generation, follow/unfollow functionality, and real-time notifications. Show the database schema, API endpoints, and system architecture.',
    category: 'design'
  },
  {
    id: '6',
    title: 'Design Netflix',
    description: 'Design a video streaming platform',
    prompt: 'Design a video streaming platform like Netflix. Include video storage and delivery, recommendation system, user profiles, content management, and CDN distribution for global scalability.',
    category: 'design'
  },
  {
    id: '7',
    title: 'Design Uber',
    description: 'Design a ride-sharing system',
    prompt: 'Design a ride-sharing system like Uber. Include user and driver apps, real-time location tracking, ride matching algorithm, payment processing, and handling peak demand scenarios.',
    category: 'design'
  },
  {
    id: '8',
    title: 'Design Spotify Top K',
    description: 'Design a system to find top K songs',
    prompt: 'Design a system to find the top K most played songs on Spotify. Consider millions of users, real-time play counts, and efficient data structures. Include the algorithm, database design, and scaling considerations.',
    category: 'design'
  }
]; 