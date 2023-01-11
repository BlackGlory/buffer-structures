import { IReadableWritable, IHash } from '@src/traits'
import { IHasher } from '@src/interfaces'
import { BaseLiteral } from '@literals/base-literal'
import { lazy } from 'extra-lazy'

export function float64(val: number): Float64Literal {
  return new Float64Literal(val)
}

const getView = lazy(() => {
  // 创建ArrayBuffer是主要的性能瓶颈.
  const buffer = new ArrayBuffer(Float64Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  return view
})

export class Float64Literal
extends BaseLiteral
implements IReadableWritable<number>, IHash {
  constructor(private value: number) {
    super()
  }

  hash(hasher: IHasher): void {
    const view = getView()
    view.setFloat64(0, this.value)

    hasher.write(view.buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
