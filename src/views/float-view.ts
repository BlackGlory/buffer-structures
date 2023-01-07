import { IAllocator, IHash, IHasher, IReference, IReadableWritable, IFree } from '@src/types'
import { readBytes } from '@utils/read-bytes'

export class FloatView implements IHash
                                , IReference
                                , IReadableWritable<number>
                                , IFree {
  static readonly byteLength = Float32Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator) {
    allocator.free(this.byteOffset)
  }

  get(): number {
    return this.view.getFloat32(this.byteOffset)
  }

  set(value: number): void {
    this.view.setFloat32(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const bytes = readBytes(this.view.buffer, this.byteOffset, FloatView.byteLength)
    hasher.write(bytes)
  }
}
