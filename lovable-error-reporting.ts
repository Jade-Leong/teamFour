import { createContext, useContext, useState, type ReactNode } from "react";

export type PregnancyStatus = "pregnant" | "postpartum" | null;
export type Trimester = "1st" | "2nd" | "3rd" | null;
export type Experience = "first" | "after_loss" | "high_anxiety" | "general" | null;
export type FitnessLevel = "beginner" | "moderate" | "active" | null;

export interface SessionStats {
  workoutsCompleted: number;
  minutesActive: number;
  streakDays: number;
  confidence: number;          // 0-100
  weeklyMinutes: number[];     // length 7, M..S
}

export interface LastSession {
  name: string;
  durationSec: number;
  reps: number;
  setsCompleted: number;
  totalSets: number;
  formScore: number;           // 0-100
  feedback: {
    kneeAlignment: "good" | "great" | "needs";
    backPosture: "good" | "great" | "needs";
    depth: "good" | "great" | "needs";
    coreEngagement: "good" | "great" | "needs";
  };
}

export interface UserProfile {
  firstName: string;
  username: string;
  email: string;
  pregnancyStatus: PregnancyStatus;
  trimester: Trimester;
  experience: Experience;
  fitnessLevel: FitnessLevel;
  doctorCleared: boolean | null;
  weeksPregnant: number;
  isReturningUser: boolean;
  stats: SessionStats;
  lastSession: LastSession | null;
}

const emptyStats: SessionStats = {
  workoutsCompleted: 0,
  minutesActive: 0,
  streakDays: 0,
  confidence: 0,
  weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
};

const defaultProfile: UserProfile = {
  firstName: "Friend",
  username: "",
  email: "",
  pregnancyStatus: null,
  trimester: null,
  experience: null,
  fitnessLevel: null,
  doctorCleared: null,
  weeksPregnant: 0,
  isReturningUser: false,
  stats: emptyStats,
  lastSession: null,
};

interface Ctx {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  recordSession: (session: LastSession) => void;
}

const UserProfileContext = createContext<Ctx | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const updateProfile = (patch: Partial<UserProfile>) =>
    setProfile((p) => ({ ...p, ...patch }));

  const recordSession = (session: LastSession) => {
    setProfile((p) => {
      const minutes = Math.max(1, Math.round(session.durationSec / 60));
      const today = (new Date().getDay() + 6) % 7; // Mon=0..Sun=6
      const weeklyMinutes = [...p.stats.weeklyMinutes];
      weeklyMinutes[today] = (weeklyMinutes[today] || 0) + minutes;
      return {
        ...p,
        lastSession: session,
        stats: {
          workoutsCompleted: p.stats.workoutsCompleted + 1,
          minutesActive: p.stats.minutesActive + minutes,
          streakDays: Math.max(1, p.stats.streakDays + (p.stats.streakDays === 0 ? 1 : 0)),
          confidence: session.formScore,
          weeklyMinutes,
        },
      };
    });
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, recordSession }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}
