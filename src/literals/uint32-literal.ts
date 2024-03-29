import { IReadable, IHash } from '@src/traits.js'
import { IHasher } from '@src/interfaces.js'
import { BaseLiteral } from '@literals/base-literal.js'
import { lazy } from 'extra-lazy'

export function uint32(val: number): Uint32Literal {
  return new Uint32Literal(val)
}

const getView = lazy(() => {
  const buffer = new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  return view
})

export class Uint32Literal
extends BaseLiteral
implements IReadable<number>
         , IHash {
  constructor(private value: number) {
    super()
  }

  hash(hasher: IHasher): void {
    const view = getView()
    view.setUint32(0, this.value)

    hasher.write(view.buffer)
  }

  get(): number {
    return this.value
  }
}
