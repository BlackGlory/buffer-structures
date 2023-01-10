import { IHash, IReference, IReadableWritable, IFree } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { getSlice } from '@utils/get-slice'
import { BaseView } from '@views/base-view'

export class Int8View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<number>
         , IFree {
  static readonly byteLength: number = Int8Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, Int8View.byteLength)
  }

  get(): number {
    return this.view.getInt8(this.byteOffset)
  }

  set(value: number): void {
    this.view.setInt8(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Int8View.byteLength)

    hasher.write(slice)
  }
}
