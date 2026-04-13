import type { LoggerPort } from '../../application/ports/LoggerPort'

/**
 * 控制台日志适配器。
 * 后续可以替换为文件日志、遥测、结构化日志平台。
 */
export class ConsoleLogger implements LoggerPort {
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
    const contextSuffix = context ? ` ${JSON.stringify(context)}` : ''
    console.error(`[${level}] ${message}${contextSuffix}`)
  }
}

