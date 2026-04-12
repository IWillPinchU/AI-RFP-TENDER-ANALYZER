import { create } from 'zustand';

const SIDEBAR_KEY = 'rfp_sidebar_collapsed';

interface SidebarState {
  collapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: localStorage.getItem(SIDEBAR_KEY) === 'true',

  toggleSidebar: () => {
    set((state) => {
      const next = !state.collapsed;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return { collapsed: next };
    });
  },

  setCollapsed: (collapsed) => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
    set({ collapsed });
  },
}));
