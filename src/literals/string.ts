import { IReadableWritable, IHash, IHasher } from '@src/types'

export function string(val: string): StringLiteral {
  return new StringLiteral(val)
}

export class StringLiteral implements IReadableWritable<string>, IHash {
  constructor(private value: string) {}

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
