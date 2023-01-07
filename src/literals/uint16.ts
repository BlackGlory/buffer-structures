import { IReadableWritable, IHash, IHasher } from '@src/types'

export function uint16(val: number): Uint16Literal {
  return new Uint16Literal(val)
}

export class Uint16Literal implements IReadableWritable<number>, IHash {
  constructor(private value: number) {}

  hash(hasher: IHasher): void {
    const buffer = new ArrayBuffer(Uint16Array.BYTES_PER_ELEMENT)
    const view = new DataView(buffer)
    view.setUint16(0, this.value)

    hasher.write(buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
