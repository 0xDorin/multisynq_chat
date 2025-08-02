import { create } from 'zustand'

interface CountStore {
  /** key-별 카운트 */
  count: Record<number, number>
  /** key에 해당하는 카운트 +1 */
  increment: (key: number) => void
}

export const useCountStore = create<CountStore>()((set) => ({
  count: {},                                  // 최초엔 빈 객체
  increment: (key) =>                         // ✅ set 안에서 이전 state 접근
    set((state) => ({
      count: {                                //   얕은 복사 후 원하는 key만 변경
        ...state.count,
        [key]: (state.count[key] ?? 0) + 1,
      },
    })),
}))
