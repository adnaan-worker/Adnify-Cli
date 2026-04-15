import type { LoggerPort } from '../../application/ports/LoggerPort'

/**
 * 控制台日志适配器。
 * Ink 交互界面运行时默认静默，避免日志输出破坏终端 UI 的重绘。
 */
export class ConsoleLogger implements LoggerPort {
  constructor(private readonly enabled = process.env.ADNIFY_DEBUG === 'true') {}

  debug(message: string, context?: Record<string, unknown>): void {
    this.write('DEBUG', message, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write('INFO', message, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('WARN', message, context)
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('ERROR', message, context)
  }

  private write(level: string, message: string, context?: Record<string, unknown>): void {
    if (!this.enabled) {
      return
    }

    const contextSuffix = context ? ` ${JSON.stringify(context)}` : ''
    console.error(`[${level}] ${message}${contextSuffix}`)
  }
}
