import { create } from "zustand"
import { type UserProfile, mockProfile } from "@/lib/mock-data"

interface ProfileState {
  profile: UserProfile
  toggleSource: (index: number) => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: mockProfile,
  toggleSource: (index) =>
    set((state) => {
      const sources = [...state.profile.sources]
      sources[index] = { ...sources[index], enabled: !sources[index].enabled }
      return { profile: { ...state.profile, sources } }
    }),
  updateProfile: (updates) =>
    set((state) => ({ profile: { ...state.profile, ...updates } })),
}))
