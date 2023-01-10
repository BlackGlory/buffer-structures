import { IHash, IReference, IReadableWritable, IFree } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { getSlice } from '@utils/get-slice'
import { BaseView } from '@views/base-view'

export class Int16View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<number>
         , IFree {
  static readonly byteLength: number = Int16Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, Int16View.byteLength)
  }

  get(): number {
    return this.view.getInt16(this.byteOffset)
  }

  set(value: number): void {
    this.view.setInt16(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Int16View.byteLength)

    hasher.write(slice)
  }
}
