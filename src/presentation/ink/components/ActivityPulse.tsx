import { Text } from 'ink'
import { useAnimatedFrames } from '../hooks/useAnimatedFrames'

const PULSE_FRAMES = ['.  ', '.. ', '...', ' ..', '  .'] as const

export interface ActivityPulseProps {
  active?: boolean
  animated?: boolean
  color?: string
  idleFrame?: string
}

/**
 * 小体积状态脉冲。
 * 默认使用静态占位，只有显式开启动画时才做帧切换，避免运行态抖动。
 */
export function ActivityPulse(props: ActivityPulseProps) {
  const frame = useAnimatedFrames(PULSE_FRAMES, {
    active: props.active && props.animated,
    intervalMs: 140,
  })

  return (
    <Text color={props.color ?? 'cyanBright'}>
      {props.active && props.animated ? frame : props.idleFrame ?? '.  '}
    </Text>
  )
}
