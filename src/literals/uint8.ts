import { IReadableWritable, IHash, IHasher } from '@src/types'
import { BaseLiteral } from '@literals/base-literal'

export function uint8(val: number): Uint8Literal {
  return new Uint8Literal(val)
}

export class Uint8Literal
extends BaseLiteral
implements IReadableWritable<number>
         , IHash {
  constructor(private value: number) {
    super()
  }

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
