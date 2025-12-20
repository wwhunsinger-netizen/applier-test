
export interface UserPerformance {
  userId: string;
  name: string;
  avatar: string;
  dailyApps: number;
  dailyGoal: number;
  weeklyApps: number;
  weeklyGoal: number;
  interviewRate: number;
  qaScore: number;
  status: "Active" | "Idle" | "Offline";
  lastActive: string;
}

export const MOCK_USER_PERFORMANCE: UserPerformance[] = [
  {
    userId: "user-1",
    name: "Alex D.",
    avatar: "https://i.pravatar.cc/150?u=alex",
    dailyApps: 47,
    dailyGoal: 100,
    weeklyApps: 487,
    weeklyGoal: 700,
    interviewRate: 6.2,
    qaScore: 98,
    status: "Active",
    lastActive: "Now"
  },
  {
    userId: "user-2",
    name: "Sarah M.",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    dailyApps: 82,
    dailyGoal: 100,
    weeklyApps: 512,
    weeklyGoal: 700,
    interviewRate: 7.8,
    qaScore: 92,
    status: "Idle",
    lastActive: "15m ago"
  },
  {
    userId: "user-4", // New mock user
    name: "Michael B.",
    avatar: "https://i.pravatar.cc/150?u=michael",
    dailyApps: 24,
    dailyGoal: 100,
    weeklyApps: 340,
    weeklyGoal: 700,
    interviewRate: 4.5,
    qaScore: 88,
    status: "Active",
    lastActive: "2m ago"
  },
  {
    userId: "user-5", // New mock user
    name: "Jessica T.",
    avatar: "https://i.pravatar.cc/150?u=jessica",
    dailyApps: 95,
    dailyGoal: 100,
    weeklyApps: 620,
    weeklyGoal: 700,
    interviewRate: 8.5,
    qaScore: 99,
    status: "Offline",
    lastActive: "3h ago"
  }
];
