import { IReadableWritable, IHash, IHasher } from '@src/types'
import { BaseLiteral } from '@literals/base-literal'

export function int16(val: number): Int16Literal {
  return new Int16Literal(val)
}

export class Int16Literal
extends BaseLiteral
implements IReadableWritable<number>
         , IHash {
  constructor(private value: number) {
    super()
  }

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
