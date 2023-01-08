import { IReadableWritable, IHash, IHasher } from '@src/types'
import { BaseLiteral } from './base-literal'

export function string(val: string): StringLiteral {
  return new StringLiteral(val)
}

export class StringLiteral
extends BaseLiteral
implements IReadableWritable<string>
         , IHash {
  constructor(private value: string) {
    super()
  }

  hash(hasher: IHasher): void {
    const encoder = new TextEncoder()
    const arr = encoder.encode(this.value)
    hasher.write(arr.buffer)
  }

  get(): string {
    return this.value
  }

  set(value: string): void {
    this.value = value
  }
}
