import { IReadableWritable, IHash, IHasher } from '@src/types'
import { BaseLiteral } from '@literals/base-literal'
import { lazy } from 'extra-lazy'

export function int8(val: number): Int8Literal {
  return new Int8Literal(val)
}

const getView = lazy(() => {
  // 创建ArrayBuffer是主要的性能瓶颈.
  const buffer = new ArrayBuffer(Int8Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  return view
})

export class Int8Literal
extends BaseLiteral
implements IReadableWritable<number>
         , IHash {
  constructor(private value: number) {
    super()
  }

  hash(hasher: IHasher): void {
    const view = getView()
    view.setInt8(0, this.value)

    hasher.write(view.buffer)
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}
