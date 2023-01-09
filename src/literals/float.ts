import { IReadableWritable, IHash, IHasher } from '@src/types'
import { BaseLiteral } from '@literals/base-literal'
import { lazy } from 'extra-lazy'

export function float(val: number): FloatLiteral {
  return new FloatLiteral(val)
}

const getView = lazy(() => {
  // 创建ArrayBuffer是主要的性能瓶颈.
  const buffer = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  return view
})

export class FloatLiteral
extends BaseLiteral
implements IReadableWritable<number>
         , IHash {
  constructor(private value: number) {
    super()
  }

  hash(hasher: IHasher): void {
    const view = getView()
    view.setFloat32(0, this.value)

    hasher.write(view.buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
