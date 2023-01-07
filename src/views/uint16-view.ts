import { IAllocator, IHash, IHasher, IReference, IReadableWritable, IFree } from '@src/types'
import { getSlice } from '@utils/get-slice'

export class Uint16View implements IHash
                                 , IReference
                                 , IReadableWritable<number>
                                 , IFree {
  static readonly byteLength = Uint16Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  ) {
    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset)
  }

  get(): number {
    return this.view.getUint16(this.byteOffset)
  }

  set(value: number): void {
    this.view.setUint16(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Uint16View.byteLength)

    hasher.write(slice)
  }
}
