import { Box, Text } from 'ink'
import { adnifyTheme } from '../theme'

export interface MascotGlyphProps {
  active?: boolean
  large?: boolean
}

/**
 * 终端吉祥物采用固定尺寸字形拼装。
 * 纯静态渲染，仅通过 active 状态改变“眼神”和颜色，避免高频动画带来的终端闪烁和性能开销。
 */
export function MascotGlyph(props: MascotGlyphProps) {
  const isBusy = props.active ?? false

  const face = (
    <Box flexDirection="column" flexShrink={0} alignItems="center">
      <Text>
        <Text color={adnifyTheme.mascotShell}> ▗</Text>
        <Text
          color={isBusy ? adnifyTheme.brandStrong : adnifyTheme.textPrimary}
          backgroundColor={adnifyTheme.mascotVisor}
        >
          {isBusy ? '〰   〰' : '•   •'}
        </Text>
        <Text color={adnifyTheme.mascotShell}>▖ </Text>
      </Text>
      <Text>
        <Text color={adnifyTheme.mascotShell}>▐ </Text>
        <Text color={isBusy ? adnifyTheme.brand : adnifyTheme.mascotCore} backgroundColor={adnifyTheme.surfaceSoft}>
          ▅▅▅▅▅
        </Text>
        <Text color={adnifyTheme.mascotShell}> ▌</Text>
      </Text>
      <Text color={adnifyTheme.mascotShell}>  ▝▘ ▝▘  </Text>
    </Box>
  )

  if (props.large) {
    return (
      <Box padding={1} borderStyle="round" borderColor={adnifyTheme.borderMuted} marginBottom={1}>
        {face}
      </Box>
    )
  }

  return face
}
