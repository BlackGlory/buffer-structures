import { IAllocator, IHash, IHasher, IReference, IReadableWritable } from '@src/types'
import { getSlice } from '@utils/get-slice'
import { BaseView } from '@views/base-view'

export class Int32View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<number> {
  static readonly byteLength = Int32Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, Int32View.byteLength)
  }

  get(): number {
    return this.view.getInt32(this.byteOffset)
  }

  set(value: number): void {
    this.view.setInt32(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Int32View.byteLength)

    hasher.write(slice)
  }
}
