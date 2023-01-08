import { IReadableWritable, IHash, IHasher } from '@src/types'
import { BaseLiteral } from '@literals/base-literal'

export function double(val: number): DoubleLiteral {
  return new DoubleLiteral(val)
}

export class DoubleLiteral
extends BaseLiteral
implements IReadableWritable<number>, IHash {
  constructor(private value: number) {
    super()
  }

  hash(hasher: IHasher): void {
    const buffer = new ArrayBuffer(Float64Array.BYTES_PER_ELEMENT)
    const view = new DataView(buffer)
    view.setFloat64(0, this.value)

    hasher.write(buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
