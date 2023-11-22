import { IHash, IReference, IReadableWritable, IFree } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { getSlice } from './utils.js'
import { BaseView } from '@views/base-view.js'
import { float32, Float32Literal } from '@literals/float32-literal.js'

export class Float32View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Float32Literal>
         , IFree {
  static readonly byteLength: number = Float32Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator) {
    allocator.free(this.byteOffset, Float32View.byteLength)
  }

  get(): Float32Literal {
    return float32(this.view.getFloat32(this.byteOffset))
  }

  set(value: Float32Literal): void {
    this.view.setFloat32(this.byteOffset, value.get())
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Float32View.byteLength)

    hasher.write(slice)
  }
}
