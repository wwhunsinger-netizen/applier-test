import { LucideIcon, Briefcase, CheckCircle, Clock, DollarSign, FileText, Trophy, User, XCircle, Zap } from "lucide-react";

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
    name: "Alex D.",
    email: "alex@jumpseat.com",
    role: "Reviewer",
    avatar: "https://i.pravatar.cc/150?u=alex"
  },
  {
    id: "user-2",
    name: "Sarah M.",
    email: "sarah@jumpseat.com",
    role: "Applier",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    id: "user-3",
    name: "Admin User",
    email: "admin@jumpseat.com",
    role: "Admin",
    avatar: "https://i.pravatar.cc/150?u=admin"
  }
];

export const CURRENT_USER = MOCK_USERS[0];

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
