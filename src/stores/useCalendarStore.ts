import { create } from 'zustand'

interface CalendarState {
  year: number
  month: number
  selectedDate: string | null // YYYY-MM-DD
  setMonth: (year: number, month: number) => void
  nextMonth: () => void
  prevMonth: () => void
  selectDate: (dateKey: string | null) => void
}

const now = new Date()

export const useCalendarStore = create<CalendarState>((set) => ({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  selectedDate: null,

  setMonth: (year, month) => set({ year, month, selectedDate: null }),

  nextMonth: () =>
    set((state) => {
      if (state.month === 12) {
        return { year: state.year + 1, month: 1, selectedDate: null }
      }
      return { month: state.month + 1, selectedDate: null }
    }),

  prevMonth: () =>
    set((state) => {
      if (state.month === 1) {
        return { year: state.year - 1, month: 12, selectedDate: null }
      }
      return { month: state.month - 1, selectedDate: null }
    }),

  selectDate: (dateKey) => set({ selectedDate: dateKey }),
}))
