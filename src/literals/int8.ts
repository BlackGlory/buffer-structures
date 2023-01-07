import { IReadableWritable, IHash, IHasher } from '@src/types'

export function int8(val: number): Int8Literal {
  return new Int8Literal(val)
}

export class Int8Literal implements IReadableWritable<number>, IHash {
  constructor(private value: number) {}

  hash(hasher: IHasher): void {
    const buffer = new ArrayBuffer(Int8Array.BYTES_PER_ELEMENT)
    const view = new DataView(buffer)
    view.setInt8(0, this.value)

    hasher.write(buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
