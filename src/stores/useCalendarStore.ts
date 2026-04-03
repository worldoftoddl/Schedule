import { create } from 'zustand'

type ViewMode = 'monthly' | 'weekly'

interface CalendarState {
  year: number
  month: number
  selectedDate: string | null // YYYY-MM-DD
  viewMode: ViewMode
  weekIndex: number
  setMonth: (year: number, month: number) => void
  nextMonth: () => void
  prevMonth: () => void
  selectDate: (dateKey: string | null) => void
  setViewMode: (mode: ViewMode) => void
  nextWeek: () => void
  prevWeek: () => void
}

const now = new Date()

export const useCalendarStore = create<CalendarState>((set) => ({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  selectedDate: null,
  viewMode: 'monthly',
  weekIndex: 0,

  setMonth: (year, month) => set({ year, month, selectedDate: null }),

  nextMonth: () =>
    set((state) => {
      if (state.month === 12) {
        return { year: state.year + 1, month: 1, selectedDate: null, weekIndex: 0 }
      }
      return { month: state.month + 1, selectedDate: null, weekIndex: 0 }
    }),

  prevMonth: () =>
    set((state) => {
      if (state.month === 1) {
        return { year: state.year - 1, month: 12, selectedDate: null, weekIndex: 0 }
      }
      return { month: state.month - 1, selectedDate: null, weekIndex: 0 }
    }),

  selectDate: (dateKey) => set({ selectedDate: dateKey }),

  setViewMode: (mode) => set({ viewMode: mode }),

  nextWeek: () =>
    set((state) => {
      // Max 5 weeks (index 0-4) for most months, 6 for some
      if (state.weekIndex >= 5) {
        // Move to next month, week 0
        if (state.month === 12) {
          return { year: state.year + 1, month: 1, weekIndex: 0, selectedDate: null }
        }
        return { month: state.month + 1, weekIndex: 0, selectedDate: null }
      }
      return { weekIndex: state.weekIndex + 1 }
    }),

  prevWeek: () =>
    set((state) => {
      if (state.weekIndex <= 0) {
        // Move to prev month, last week
        if (state.month === 1) {
          return { year: state.year - 1, month: 12, weekIndex: 4, selectedDate: null }
        }
        return { month: state.month - 1, weekIndex: 4, selectedDate: null }
      }
      return { weekIndex: state.weekIndex - 1 }
    }),
}))
