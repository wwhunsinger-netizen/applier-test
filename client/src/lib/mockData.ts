import { LucideIcon, Briefcase, CheckCircle, Clock, DollarSign, FileText, Trophy, User, XCircle, Zap } from "lucide-react";

export type ApplicationStatus = "Pending" | "Applied" | "Interview" | "Offer" | "Rejected";
export type QAStatus = "None" | "Approved" | "Rejected";

export interface Job {
  id: string;
  role: string;
  company: string;
  location: string;
  postedTime: string;
  matchScore: number;
  requirements: { text: string; met: boolean }[];
  description: string;
  client: string;
}

export interface Application {
  id: string;
  jobId: string;
  applierId: string;
  status: ApplicationStatus;
  qaStatus: QAStatus;
  appliedDate: string;
  flaggedIssue?: string; // If populated, it appears in Admin Review
}

export interface ApplierStats {
  dailyApps: number;
  dailyGoal: number;
  timeWorked: string;
  avgTimePerApp: string;
  projectedFinish: string;
  weeklyEarnings: number;
  interviewRate: number;
  qaErrorRate: number;
  streakDays: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  apps: number;
  interviewRate: string;
  earnings: string;
  isCurrentUser?: boolean;
}

export const MOCK_USERS = [
  {
    id: "user-1",
    name: "Sarah M.",
    email: "sarah@jumpseat.com",
    role: "Applier",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    id: "user-2",
    name: "Michael B.",
    email: "michael@jumpseat.com",
    role: "Applier",
    avatar: "https://i.pravatar.cc/150?u=michael"
  },
  {
    id: "user-3",
    name: "Jessica T.",
    email: "jessica@jumpseat.com",
    role: "Applier",
    avatar: "https://i.pravatar.cc/150?u=jessica"
  },
  {
    id: "user-4",
    name: "David K.",
    email: "david@jumpseat.com",
    role: "Applier",
    avatar: "https://i.pravatar.cc/150?u=david"
  },
  {
    id: "user-5",
    name: "Admin User",
    email: "admin@jumpseat.com",
    role: "Admin",
    avatar: "https://i.pravatar.cc/150?u=admin"
  },
  {
    id: "user-6",
    name: "Client User",
    email: "client@jumpseat.com",
    role: "Client",
    avatar: "https://i.pravatar.cc/150?u=client"
  }
];

export const CURRENT_USER = MOCK_USERS[0];

export const MOCK_CLIENT_STATS = {
  totalApps: 142,
  weeklyApps: 12,
  dailyApps: 3,
  rejections: 45,
  interviews: 8
};

export const MOCK_CLIENT_INTERVIEWS = [
  {
    id: "int-1",
    company: "Google",
    role: "Senior UX Designer",
    date: "2024-05-25T14:00:00",
    format: "Video",
    prepDocComplete: true,
  },
  {
    id: "int-2",
    company: "Netflix",
    role: "Product Designer",
    date: "2024-05-28T10:00:00",
    format: "Panel",
    prepDocComplete: false,
  }
];

export interface Client {
  id: string;
  name: string;
  email: string;
  username: string;
  created: string;
  status: "active" | "action_needed";
  commentsCount?: number;
}

export const MOCK_CLIENTS_LIST: Client[] = [
  { id: "client-1", name: "John Smith", email: "john@email.com", username: "john.smith", created: "Dec 15, 2024", status: "action_needed", commentsCount: 2 },
  { id: "client-2", name: "Sarah Connor", email: "sarah@connor.com", username: "sarah.c", created: "Jan 10, 2025", status: "active" },
  { id: "client-3", name: "Michael Ross", email: "mike@ross.com", username: "mike.ross", created: "Feb 2, 2025", status: "active" },
];


export const MOCK_CLIENT_PERFORMANCE_SUMMARY = [
  {
    clientId: "client-1",
    name: "John Smith",
    avatar: "https://i.pravatar.cc/150?u=john",
    plan: "Premium",
    status: "Active",
    totalApps: 142,
    interviews: 8,
    offers: 1,
    lastActivity: "2h ago"
  },
  {
    clientId: "client-2",
    name: "Sarah Connor",
    avatar: "https://i.pravatar.cc/150?u=sarah_c",
    plan: "Standard",
    status: "Active",
    totalApps: 89,
    interviews: 4,
    offers: 0,
    lastActivity: "1d ago"
  },
  {
    clientId: "client-3",
    name: "Michael Ross",
    avatar: "https://i.pravatar.cc/150?u=mike",
    plan: "Premium",
    status: "Onboarding",
    totalApps: 12,
    interviews: 0,
    offers: 0,
    lastActivity: "30m ago"
  },
  {
    clientId: "client-4",
    name: "Emily Blunt",
    avatar: "https://i.pravatar.cc/150?u=emily",
    plan: "Standard",
    status: "Active",
    totalApps: 215,
    interviews: 14,
    offers: 2,
    lastActivity: "5h ago"
  }
];

export const MOCK_STATS: ApplierStats = {
  dailyApps: 47,
  dailyGoal: 100,
  timeWorked: "1.2h",
  avgTimePerApp: "1.5m",
  projectedFinish: "1.3h",
  weeklyEarnings: 342,
  interviewRate: 6.2,
  qaErrorRate: 1.1,
  streakDays: 7,
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Maria R.", apps: 523, interviewRate: "8.1%", earnings: "$1,842" },
  { rank: 2, name: "Carlos M.", apps: 501, interviewRate: "7.4%", earnings: "$1,721" },
  { rank: 3, name: "Ana S.", apps: 498, interviewRate: "6.9%", earnings: "$1,650" },
  { rank: 4, name: "Alex D. (You)", apps: 487, interviewRate: "6.2%", earnings: "$1,340", isCurrentUser: true },
  { rank: 5, name: "Jose P.", apps: 512, interviewRate: "3.8%", earnings: "$1,215" },
];

export const MOCK_JOBS: Job[] = [
  {
    id: "job-1",
    role: "Senior React Engineer",
    company: "TechCorp Inc.",
    location: "Remote (US)",
    postedTime: "2 hours ago",
    matchScore: 94,
    client: "John Smith",
    description: "Looking for a senior frontend engineer with deep React experience...",
    requirements: [
      { text: "React, Node.js", met: true },
      { text: "5+ years experience", met: true },
      { text: "Java preferred", met: false },
    ],
  },
  {
    id: "job-2",
    role: "Frontend Developer",
    company: "StartUp Flow",
    location: "Remote (EU)",
    postedTime: "4 hours ago",
    matchScore: 88,
    client: "John Smith",
    description: "Join our fast paced team...",
    requirements: [
      { text: "TypeScript", met: true },
      { text: "3+ years experience", met: true },
      { text: "AWS knowledge", met: false },
    ],
  },
  {
    id: "job-3",
    role: "Full Stack Engineer",
    company: "Enterprise Co",
    location: "New York, NY",
    postedTime: "1 day ago",
    matchScore: 72,
    client: "John Smith",
    description: "Legacy migration project...",
    requirements: [
      { text: "Java, Spring Boot", met: false },
      { text: "10+ years experience", met: true },
    ],
  },
  {
    id: "job-4",
    role: "Backend Developer",
    company: "Cloud Systems",
    location: "Austin, TX",
    postedTime: "3 hours ago",
    matchScore: 85,
    client: "Jane Doe",
    description: "Building scalable microservices...",
    requirements: [
      { text: "Go, Kubernetes", met: true },
      { text: "Cloud Native", met: true },
    ],
  },
  {
    id: "job-5",
    role: "Product Designer",
    company: "Creative Studio",
    location: "Remote",
    postedTime: "5 hours ago",
    matchScore: 78,
    client: "Jane Doe",
    description: "Leading design initiatives...",
    requirements: [
      { text: "Figma", met: true },
      { text: "UI/UX", met: true },
    ],
  },
  {
    id: "job-6",
    role: "DevOps Engineer",
    company: "Infra Inc",
    location: "Remote",
    postedTime: "1 day ago",
    matchScore: 92,
    client: "John Smith",
    description: "Automating deployment pipelines...",
    requirements: [
      { text: "CI/CD", met: true },
      { text: "Terraform", met: true },
    ],
  }
];

// Initial mock applications
export const MOCK_APPLICATIONS: Application[] = [
  { id: "app-1", jobId: "job-1", applierId: "user-1", status: "Applied", qaStatus: "None", appliedDate: "2024-05-20" },
  { id: "app-2", jobId: "job-2", applierId: "user-1", status: "Interview", qaStatus: "Approved", appliedDate: "2024-05-19" },
  { id: "app-3", jobId: "job-3", applierId: "user-2", status: "Applied", qaStatus: "None", appliedDate: "2024-05-20" },
  { id: "app-4", jobId: "job-4", applierId: "user-2", status: "Pending", qaStatus: "None", appliedDate: "2024-05-20", flaggedIssue: "Resume formatting error" },
  { id: "app-5", jobId: "job-5", applierId: "user-1", status: "Offer", qaStatus: "Approved", appliedDate: "2024-05-15" },
  { id: "app-6", jobId: "job-6", applierId: "user-2", status: "Applied", qaStatus: "None", appliedDate: "2024-05-18" },
];

export const RESUME_COMPARISON = {
  original: `John Smith
Software Engineer
San Francisco, CA

Experience:
- Developer at OldCorp (2018-2023)
  - Worked on web apps
  - Used JS and HTML
  
Skills:
- JavaScript, HTML, CSS
`,
  ai_tailored: `John Smith
Senior Software Engineer
San Francisco, CA | Remote Open

Experience:
- Senior Developer at OldCorp (2018-2023)
  - Architected scalable web applications using React and Node.js
  - Led frontend modernization initiatives
  
Skills:
- JavaScript (ES6+), React, Node.js, AWS, HTML5, CSS3
`
};
