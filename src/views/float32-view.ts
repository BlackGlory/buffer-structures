import { IHash, IReference, IReadableWritable, IFree } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { getSlice } from '@utils/get-slice'
import { BaseView } from '@views/base-view'

export class Float32View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<number>
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

  get(): number {
    return this.view.getFloat32(this.byteOffset)
  }

  set(value: number): void {
    this.view.setFloat32(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Float32View.byteLength)

    hasher.write(slice)
  }
}
