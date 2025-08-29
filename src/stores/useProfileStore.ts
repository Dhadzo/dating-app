import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  city: string;
  state: string;
  bio: string;
  interests: string[];
  photos: string[];
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileState {
  // Current user profile
  currentProfile: Profile | null;
  profileLoading: boolean;
  profileError: string | null;

  // Discovered profiles
  discoveredProfiles: Profile[];
  discoveredLoading: boolean;
  discoveredError: string | null;

  // Actions
  setCurrentProfile: (profile: Profile | null) => void;
  setProfileLoading: (loading: boolean) => void;
  setProfileError: (error: string | null) => void;

  setDiscoveredProfiles: (profiles: Profile[]) => void;
  setDiscoveredLoading: (loading: boolean) => void;
  setDiscoveredError: (error: string | null) => void;

  addDiscoveredProfile: (profile: Profile) => void;
  updateDiscoveredProfile: (
    profileId: string,
    updates: Partial<Profile>
  ) => void;
  removeDiscoveredProfile: (profileId: string) => void;

  clearProfiles: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProfile: null,
      profileLoading: false,
      profileError: null,
      discoveredProfiles: [],
      discoveredLoading: false,
      discoveredError: null,

      // Actions
      setCurrentProfile: (profile) => set({ currentProfile: profile }),
      setProfileLoading: (loading) => set({ profileLoading: loading }),
      setProfileError: (error) => set({ profileError: error }),

      setDiscoveredProfiles: (profiles) =>
        set({ discoveredProfiles: profiles }),
      setDiscoveredLoading: (loading) => set({ discoveredLoading: loading }),
      setDiscoveredError: (error) => set({ discoveredError: error }),

      addDiscoveredProfile: (profile) => {
        const { discoveredProfiles } = get();
        if (!discoveredProfiles.find((p) => p.id === profile.id)) {
          set({ discoveredProfiles: [...discoveredProfiles, profile] });
        }
      },

      updateDiscoveredProfile: (profileId, updates) => {
        const { discoveredProfiles } = get();
        set({
          discoveredProfiles: discoveredProfiles.map((profile) =>
            profile.id === profileId ? { ...profile, ...updates } : profile
          )
        });
      },

      removeDiscoveredProfile: (profileId) => {
        const { discoveredProfiles } = get();
        set({
          discoveredProfiles: discoveredProfiles.filter(
            (profile) => profile.id !== profileId
          )
        });
      },

      clearProfiles: () =>
        set({
          discoveredProfiles: [],
          discoveredLoading: false,
          discoveredError: null
        })
    }),
    {
      name: 'profile-storage',
      partialize: (state) => ({
        currentProfile: state.currentProfile,
        discoveredProfiles: state.discoveredProfiles
      })
    }
  )
);
