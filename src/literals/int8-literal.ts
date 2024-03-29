import { IReadable, IHash } from '@src/traits.js'
import { IHasher } from '@src/interfaces.js'
import { BaseLiteral } from '@literals/base-literal.js'
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
implements IReadable<number>
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
}
