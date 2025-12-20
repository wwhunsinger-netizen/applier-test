
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
    name: "Sarah M.",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    dailyApps: 82,
    dailyGoal: 100,
    weeklyApps: 512,
    weeklyGoal: 700,
    interviewRate: 7.8,
    qaScore: 92,
    status: "Active",
    lastActive: "Now"
  },
  {
    userId: "user-2",
    name: "Michael B.",
    avatar: "https://i.pravatar.cc/150?u=michael",
    dailyApps: 47,
    dailyGoal: 100,
    weeklyApps: 340,
    weeklyGoal: 700,
    interviewRate: 4.5,
    qaScore: 88,
    status: "Active",
    lastActive: "2m ago"
  },
  {
    userId: "user-3",
    name: "Jessica T.",
    avatar: "https://i.pravatar.cc/150?u=jessica",
    dailyApps: 95,
    dailyGoal: 100,
    weeklyApps: 620,
    weeklyGoal: 700,
    interviewRate: 8.5,
    qaScore: 99,
    status: "Idle",
    lastActive: "15m ago"
  },
  {
    userId: "user-4",
    name: "David K.",
    avatar: "https://i.pravatar.cc/150?u=david",
    dailyApps: 15,
    dailyGoal: 100,
    weeklyApps: 120,
    weeklyGoal: 700,
    interviewRate: 2.1,
    qaScore: 78,
    status: "Offline",
    lastActive: "3h ago"
  }
];
