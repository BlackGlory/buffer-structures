import { IReadableWritable, IHash, IHasher } from '@src/types'
import { BaseLiteral } from '@literals/base-literal'

export function uint16(val: number): Uint16Literal {
  return new Uint16Literal(val)
}

export class Uint16Literal
extends BaseLiteral
implements IReadableWritable<number>
         , IHash {
  constructor(private value: number) {
    super()
  }

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
