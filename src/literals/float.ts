import { IReadableWritable, IHash, IHasher } from '@src/types'
import { BaseLiteral } from '@literals/base-literal'

export function float(val: number): FloatLiteral {
  return new FloatLiteral(val)
}

export class FloatLiteral
extends BaseLiteral
implements IReadableWritable<number>
         , IHash {
  constructor(private value: number) {
    super()
  }

  hash(hasher: IHasher): void {
    const buffer = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT)
    const view = new DataView(buffer)
    view.setFloat32(0, this.value)

    hasher.write(buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
