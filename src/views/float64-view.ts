import { IHash, IReference, IReadableWritable, IFree } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { getSlice } from './utils.js'
import { BaseView } from '@views/base-view.js'
import { float64, Float64Literal } from '@literals/float64-literal.js'

export class Float64View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Float64Literal>
         , IFree {
  static readonly byteLength: number = Float64Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, Float64View.byteLength)
  }

  get(): Float64Literal {
    return float64(this.view.getFloat64(this.byteOffset))
  }

  set(value: Float64Literal): void {
    this.view.setFloat64(this.byteOffset, value.get())
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Float64View.byteLength)

    hasher.write(slice)
  }
}
