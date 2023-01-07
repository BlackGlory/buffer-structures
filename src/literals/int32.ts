import { IReadableWritable, IHash, IHasher } from '@src/types'

export function int32(val: number): Int32Literal {
  return new Int32Literal(val)
}

export class Int32Literal implements IReadableWritable<number>, IHash {
  constructor(private value: number) {}

  hash(hasher: IHasher): void {
    const buffer = new ArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
    const view = new DataView(buffer)
    view.setInt32(0, this.value)

    hasher.write(buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
