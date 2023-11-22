import { IReadable, IHash } from '@src/traits.js'
import { IHasher } from '@src/interfaces.js'
import { BaseLiteral } from '@literals/base-literal.js'

export function string(val: string): StringLiteral {
  return new StringLiteral(val)
}

export class StringLiteral
extends BaseLiteral
implements IReadable<string>
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
}
