import { Text } from 'ink'
import { useAnimatedFrames } from '../hooks/useAnimatedFrames'

const PULSE_FRAMES = ['·  ', '·· ', '···', ' ··', '  ·'] as const

export interface ActivityPulseProps {
  active?: boolean
  color?: string
  idleFrame?: string
}

/**
 * 小体积状态脉冲，用于输入区、状态栏、流式输出等场景。
 */
export function ActivityPulse(props: ActivityPulseProps) {
  const frame = useAnimatedFrames(PULSE_FRAMES, {
    active: props.active ?? true,
    intervalMs: 120,
  })

  return <Text color={props.color ?? 'cyanBright'}>{props.active ? frame : props.idleFrame ?? '·'}</Text>
}
