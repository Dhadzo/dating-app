import { create } from 'zustand';

interface UIState {
  // Tab management
  activeTab: string;

  // Modal states
  showEditProfile: boolean;
  showSettings: boolean;
  showNotifications: boolean;
  showSearch: boolean;
  showFilter: boolean;
  showVideoCall: boolean;
  showLikes: boolean;

  // Selected items
  selectedProfile: any | null;
  selectedChatMatch: any | null;
  selectedMatch: any | null;

  // Search and filters
  searchQuery: string;
  activeFilters: any | null;

  // Actions
  setActiveTab: (tab: string) => void;
  setShowEditProfile: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
  setShowFilter: (show: boolean) => void;
  setShowVideoCall: (show: boolean) => void;
  setShowLikes: (show: boolean) => void;
  setSelectedProfile: (profile: any | null) => void;
  setSelectedChatMatch: (match: any | null) => void;
  setSelectedMatch: (match: any | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: any | null) => void;
  resetUI: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  activeTab: 'discover',
  showEditProfile: false,
  showSettings: false,
  showNotifications: false,
  showSearch: false,
  showFilter: false,
  showVideoCall: false,
  showLikes: false,
  selectedProfile: null,
  selectedChatMatch: null,
  selectedMatch: null,
  searchQuery: '',
  activeFilters: null,

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  setShowEditProfile: (show) => set({ showEditProfile: show }),
  setShowSettings: (show) => set({ showSettings: show }),
  setShowNotifications: (show) => set({ showNotifications: show }),
  setShowSearch: (show) => set({ showSearch: show }),
  setShowFilter: (show) => set({ showFilter: show }),
  setShowVideoCall: (show) => set({ showVideoCall: show }),
  setShowLikes: (show) => set({ showLikes: show }),

  setSelectedProfile: (profile) => set({ selectedProfile: profile }),
  setSelectedChatMatch: (match) => set({ selectedChatMatch: match }),
  setSelectedMatch: (match) => set({ selectedMatch: match }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilters: (filters) => set({ activeFilters: filters }),

  resetUI: () =>
    set({
      showEditProfile: false,
      showSettings: false,
      showNotifications: false,
      showSearch: false,
      showFilter: false,
      showVideoCall: false,
      showLikes: false,
      selectedProfile: null,
      selectedChatMatch: null,
      selectedMatch: null,
      searchQuery: '',
      activeFilters: null
    })
}));
