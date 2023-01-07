import { IReadableWritable, IHash, IHasher } from '@src/types'

export function uint32(val: number): Uint32Literal {
  return new Uint32Literal(val)
}

export class Uint32Literal implements IReadableWritable<number>, IHash {
  constructor(private value: number) {}

  hash(hasher: IHasher): void {
    const buffer = new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT)
    const view = new DataView(buffer)
    view.setUint32(0, this.value)

    hasher.write(buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
