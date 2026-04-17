import { Text } from 'ink'
import { memo } from 'react'
import { adnifyTheme } from '../theme'

export interface InputCursorProps {
  visible?: boolean
  busy?: boolean
}

export const InputCursor = memo(function InputCursor(props: InputCursorProps) {
  return (
    <Text color={props.busy ? adnifyTheme.brand : adnifyTheme.brandStrong}>
      {props.visible ? '_' : ' '}
    </Text>
  )
})
