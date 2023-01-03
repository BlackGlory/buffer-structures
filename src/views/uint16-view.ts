import { IHash, IHasher, IReference, IReadableWritable } from '@src/types'
import { readBytes } from '@utils/read-bytes'

export class Uint16View implements IHash
                                 , IReference
                                 , IReadableWritable<number> {
  static readonly byteLength = Uint16Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  ) {
    this.view = new DataView(buffer)
  }

  get(): number {
    return this.view.getUint16(this.byteOffset)
  }

  set(value: number): void {
    this.view.setUint16(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const bytes = readBytes(this.view.buffer, this.byteOffset, Uint16View.byteLength)
    hasher.write(bytes)
  }
}
