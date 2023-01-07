import { IReadableWritable, IHash, IHasher } from '@src/types'

export function uint8(val: number): Uint8Literal {
  return new Uint8Literal(val)
}

export class Uint8Literal implements IReadableWritable<number>, IHash {
  constructor(private value: number) {}

  hash(hasher: IHasher): void {
    const buffer = new ArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
    const view = new DataView(buffer)
    view.setUint8(0, this.value)

    hasher.write(buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
