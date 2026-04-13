import { randomUUID } from 'node:crypto'
import type { IdGeneratorPort } from '../../application/ports/IdGeneratorPort'

export class CryptoIdGenerator implements IdGeneratorPort {
  next(): string {
    return randomUUID()
  }
}

