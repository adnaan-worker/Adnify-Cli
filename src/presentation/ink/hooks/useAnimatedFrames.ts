import { useEffect, useState } from 'react'

export interface UseAnimatedFramesOptions {
  active?: boolean
  intervalMs?: number
}

/**
 * 轻量帧动画 Hook。
 * 用固定占位的短帧序列制造动态感，避免大范围重渲染和布局抖动。
 */
export function useAnimatedFrames<T>(
  frames: readonly T[],
  options: UseAnimatedFramesOptions = {},
): T {
  const { active = true, intervalMs = 100 } = options
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!active || frames.length <= 1) {
      setIndex(0)
      return
    }

    const timer = setInterval(() => {
      setIndex((previous) => (previous + 1) % frames.length)
    }, intervalMs)

    return () => clearInterval(timer)
  }, [active, frames, intervalMs])

  return frames[index] ?? frames[0]
}
