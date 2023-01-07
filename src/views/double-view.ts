import { IAllocator, IHash, IHasher, IReference, IReadableWritable, IFree } from '@src/types'
import { getSlice } from '@utils/get-slice'

export class DoubleView implements IHash
                                 , IReference
                                 , IReadableWritable<number>
                                 , IFree {
  static readonly byteLength = Float64Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset)
  }

  get(): number {
    return this.view.getFloat64(this.byteOffset)
  }

  set(value: number): void {
    this.view.setFloat64(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, DoubleView.byteLength)

    hasher.write(slice)
  }
}
