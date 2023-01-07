import { IAllocator, IHash, IHasher, IReference, IReadableWritable, IFree } from '@src/types'
import { getSlice } from '@utils/get-slice'

export class Int16View implements IHash
                                , IReference
                                , IReadableWritable<number>
                                , IFree {
  static readonly byteLength = Int16Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset)
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
