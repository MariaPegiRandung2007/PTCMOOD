import { Type } from "@google/genai";

export enum MoodType {
  HAPPY = "happy",
  SAD = "sad",
  NEUTRAL = "neutral",
  ANGRY = "angry",
  ANXIOUS = "anxious"
}

export interface MoodEntry {
  id: number;
  student_id: number;
  date: string;
  mood_type: MoodType;
  reason: string;
  category?: string;
  student_name?: string;
}

export interface User {
  id: number;
  username: string;
  role: 'student' | 'teacher';
  name: string;
}

export const MOOD_CONFIG = {
  [MoodType.HAPPY]: { emoji: "😊", label: "Bahagia", color: "#4ade80", bg: "bg-green-100", text: "text-green-700" },
  [MoodType.SAD]: { emoji: "😔", label: "Sedih", color: "#60a5fa", bg: "bg-blue-100", text: "text-blue-700" },
  [MoodType.NEUTRAL]: { emoji: "😐", label: "Biasa saja", color: "#94a3b8", bg: "bg-slate-100", text: "text-slate-700" },
  [MoodType.ANGRY]: { emoji: "😠", label: "Marah", color: "#f87171", bg: "bg-red-100", text: "text-red-700" },
  [MoodType.ANXIOUS]: { emoji: "😟", label: "Cemas", color: "#fbbf24", bg: "bg-amber-100", text: "text-amber-700" },
};
