import { Box, Text } from 'ink'
import { useAnimatedFrames } from '../hooks/useAnimatedFrames'
import { adnifyTheme } from '../theme'

type MascotPose = 'idle' | 'look-left' | 'look-right' | 'blink'

type MascotSegments = {
  r1L: string
  r1E: string
  r1R: string
  r2L: string
  r2E: string
  r2R: string
  r3: string
}

const MASCOT_POSES: Record<MascotPose, MascotSegments> = {
  idle: {
    r1L: ' ▗',
    r1E: '•   •',
    r1R: '▖ ',
    r2L: '▐ ',
    r2E: '▅▅▅▅▅',
    r2R: ' ▌',
    r3: '  ▝▘ ▝▘  ',
  },
  'look-left': {
    r1L: ' ▗',
    r1E: '◐   ◐',
    r1R: '▖ ',
    r2L: '▐ ',
    r2E: '▅▅▅▅▅',
    r2R: ' ▌',
    r3: '  ▝▘ ▝▘  ',
  },
  'look-right': {
    r1L: ' ▗',
    r1E: '◑   ◑',
    r1R: '▖ ',
    r2L: '▐ ',
    r2E: '▅▅▅▅▅',
    r2R: ' ▌',
    r3: '  ▝▘ ▝▘  ',
  },
  blink: {
    r1L: ' ▗',
    r1E: '─   ─',
    r1R: '▖ ',
    r2L: '▐ ',
    r2E: '▅▅▅▅▅',
    r2R: ' ▌',
    r3: '  ▝▘ ▝▘  ',
  },
}

const IDLE_SEQUENCE: readonly MascotPose[] = [
  'idle',
  'idle',
  'look-left',
  'idle',
  'blink',
  'idle',
  'look-right',
  'idle',
] as const

const ACTIVE_SEQUENCE: readonly MascotPose[] = [
  'look-left',
  'idle',
  'look-right',
  'idle',
] as const

export interface MascotGlyphProps {
  active?: boolean
}

/**
 * 终端吉祥物采用固定尺寸字形拼装。
 * 只切换眼神等局部片段，避免布局抖动，同时保留终端原生的精致感。
 */
export function MascotGlyph(props: MascotGlyphProps) {
  const pose = useAnimatedFrames(props.active ? ACTIVE_SEQUENCE : IDLE_SEQUENCE, {
    active: props.active ?? false,
    intervalMs: props.active ? 160 : 260,
  })
  const mascot = MASCOT_POSES[pose]

  return (
    <Box flexDirection="column" flexShrink={0}>
      <Text>
        <Text color={adnifyTheme.mascotShell}>{mascot.r1L}</Text>
        <Text color={adnifyTheme.textPrimary} backgroundColor={adnifyTheme.mascotVisor}>
          {mascot.r1E}
        </Text>
        <Text color={adnifyTheme.mascotShell}>{mascot.r1R}</Text>
      </Text>
      <Text>
        <Text color={adnifyTheme.mascotShell}>{mascot.r2L}</Text>
        <Text color={adnifyTheme.mascotCore} backgroundColor={adnifyTheme.surfaceSoft}>
          {mascot.r2E}
        </Text>
        <Text color={adnifyTheme.mascotShell}>{mascot.r2R}</Text>
      </Text>
      <Text color={adnifyTheme.mascotShell}>{mascot.r3}</Text>
    </Box>
  )
}
