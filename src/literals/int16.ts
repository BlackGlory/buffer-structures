import { IReadableWritable, IHash, IHasher } from '@src/types'

export function int16(val: number): Int16Literal {
  return new Int16Literal(val)
}

export class Int16Literal implements IReadableWritable<number>, IHash {
  constructor(private value: number) {}

  hash(hasher: IHasher): void {
    const buffer = new ArrayBuffer(Int16Array.BYTES_PER_ELEMENT)
    const view = new DataView(buffer)
    view.setInt16(0, this.value)

    hasher.write(buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
