import { createContext, useContext, useState, type ReactNode } from "react";

export type PregnancyStatus = "pregnant" | "postpartum" | null;
export type Trimester = "1st" | "2nd" | "3rd" | null;
export type Experience = "first" | "after_loss" | "high_anxiety" | "general" | null;
export type FitnessLevel = "beginner" | "moderate" | "active" | null;

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
  anxiety: number;
  confidence: number;
}

const defaultProfile: UserProfile = {
  firstName: "Emma",
  username: "",
  email: "",
  pregnancyStatus: "pregnant",
  trimester: "2nd",
  experience: "general",
  fitnessLevel: "moderate",
  doctorCleared: true,
  weeksPregnant: 18,
  anxiety: 5,
  confidence: 5,
};

interface Ctx {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
}

const UserProfileContext = createContext<Ctx | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const updateProfile = (patch: Partial<UserProfile>) =>
    setProfile((p) => ({ ...p, ...patch }));
  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}
