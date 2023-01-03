import { IHash, IHasher, IReference, IReadableWritable } from '@src/types'
import { readBytes } from '@utils/read-bytes'

export class FloatView implements IHash
                                , IReference
                                , IReadableWritable<number> {
  static readonly byteLength = Float32Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    this.view = new DataView(buffer)
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
