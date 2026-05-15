import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      profile: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      clearAuth: () => set({ user: null, profile: null }),
    }),
    { name: 'polymath-auth' }
  )
)

export const useProgressStore = create(
  persist(
    (set, get) => ({
      streakDays: 0,
      totalXP: 0,
      level: 1,
      todayCompleted: false,
      lastActivityDate: null,
      domainProgress: {},
      achievements: [],
      // Spaced repetition: { [cardId]: { easeFactor, interval, repetitions, nextReview, lastReview } }
      reviewRecords: {},

      setStreak: (days) => set({ streakDays: days }),
      setTotalXP: (xp) => set({ totalXP: xp, level: Math.floor(xp / 500) + 1 }),
      setTodayCompleted: (val) => set({ todayCompleted: val }),
      setLastActivityDate: (date) => set({ lastActivityDate: date }),
      setDomainProgress: (progress) => set({ domainProgress: progress }),

      addAchievement: (achievement) => {
        if (!achievement) return
        const current = get().achievements
        if (!current.find(a => a.id === achievement.id)) {
          set({ achievements: [...current, achievement] })
        }
      },

      addXP: (amount) => {
        const current = get().totalXP
        const newXP = current + amount
        set({ totalXP: newXP, level: Math.floor(newXP / 500) + 1 })
      },

      // Update a single card's SR record
      updateReviewRecord: (cardId, record) => {
        const current = get().reviewRecords
        set({ reviewRecords: { ...current, [cardId]: record } })
      },

      // Bulk set (from Supabase sync)
      setReviewRecords: (records) => set({ reviewRecords: records }),
    }),
    { name: 'polymath-progress' }
  )
)

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  activeModal: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveModal: (modal) => set({ activeModal: modal }),
}))

export const useAdminStore = create(
  persist(
    (set) => ({
      isAdmin: false,
      setIsAdmin: (val) => set({ isAdmin: val }),
    }),
    { name: 'polymath-admin' }
  )
)
