import { IAllocator, IHash, IHasher, IReference, IReadableWritable, IFree } from '@src/types'
import { readBytes } from '@utils/read-bytes'

export class Uint8View implements IHash
                                , IReference
                                , IReadableWritable<number>
                                , IFree {
  static readonly byteLength = Uint8Array.BYTES_PER_ELEMENT

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
    return this.view.getUint8(this.byteOffset)
  }

  set(value: number): void {
    this.view.setUint8(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const bytes = readBytes(this.view.buffer, this.byteOffset, Uint8View.byteLength)
    hasher.write(bytes)
  }
}
