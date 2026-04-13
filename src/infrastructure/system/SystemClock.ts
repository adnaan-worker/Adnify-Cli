import type { ClockPort } from '../../application/ports/ClockPort'

export class SystemClock implements ClockPort {
  now(): Date {
    return new Date()
  }
}

