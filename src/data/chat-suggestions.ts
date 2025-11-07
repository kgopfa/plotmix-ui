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
    title: 'Compliance Training',
    description: 'Understand regulatory compliance',
    prompt: 'Explain key compliance training requirements for employees. Cover topics like data privacy regulations, workplace safety standards, anti-discrimination policies, and industry-specific compliance frameworks. Show how to track and verify completion of mandatory training.',
    category: 'system'
  },
  {
    id: '2',
    title: 'Performance Management',
    description: 'Learn performance review processes',
    prompt: 'Explain the performance management cycle including goal setting, continuous feedback, mid-year reviews, and annual evaluations. Cover best practices for giving constructive feedback, setting SMART goals, and creating development plans for employee growth.',
    category: 'system'
  },
  {
    id: '3',
    title: 'Searching Lists Efficiently',
    description: 'Visualize the binary search algorithm',
    prompt: 'Create a visual representation of binary search algorithm. Show a sorted array and demonstrate how the algorithm finds a target value by repeatedly dividing the search interval in half.',
    category: 'algorithm'
  },
  {
    id: '4',
    title: 'Change Management',
    description: 'Navigate organizational transitions',
    prompt: 'Explain change management frameworks and strategies. Cover the stages of change adoption, how to communicate change effectively, manage resistance, and create buy-in from stakeholders. Include practical tools like the ADKAR model and Kotter\'s 8-step process.',
    category: 'system'
  },
  {
    id: '5',
    title: 'Leadership Development',
    description: 'Build effective leadership skills',
    prompt: 'Explain core leadership competencies and development pathways. Cover different leadership styles, emotional intelligence, decision-making frameworks, team building strategies, and how to develop a leadership pipeline within an organization.',
    category: 'system'
  },
  {
    id: '6',
    title: 'Project Management',
    description: 'Master project planning and execution',
    prompt: 'Explain project management methodologies and best practices. Cover project lifecycle phases, risk management, stakeholder communication, resource allocation, timeline planning, and how to handle scope creep and project delays.',
    category: 'system'
  },
  {
    id: '7',
    title: 'Employee Onboarding',
    description: 'Create effective onboarding programs',
    prompt: 'Explain how to design and implement effective employee onboarding programs. Cover pre-boarding preparation, first-day activities, first-week goals, 30-60-90 day plans, mentorship programs, and how to measure onboarding success and retention rates.',
    category: 'system'
  },
  {
    id: '8',
    title: 'Learning Analytics',
    description: 'Measure training effectiveness',
    prompt: 'Explain how to measure and analyze learning outcomes. Cover Kirkpatrick\'s four levels of evaluation, key learning metrics, ROI calculations for training programs, how to track learner engagement, and use data to improve training effectiveness.',
    category: 'system'
  }
]; 