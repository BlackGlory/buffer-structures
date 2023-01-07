import { IAllocator, IHash, IHasher, IReference, IReadableWritable, IFree } from '@src/types'
import { readBytes } from '@utils/read-bytes'

export class Int8View implements IHash
                               , IReference
                               , IReadableWritable<number>
                               , IFree {
  static readonly byteLength = Int8Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset)
  }

  get(): number {
    return this.view.getInt8(this.byteOffset)
  }

  set(value: number): void {
    this.view.setInt8(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const bytes = readBytes(this.view.buffer, this.byteOffset, Int8View.byteLength)
    hasher.write(bytes)
  }
}
