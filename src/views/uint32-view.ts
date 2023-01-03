import { IHash, IHasher, IReference, IReadable, IWritable } from '@src/types'
import { readBytes } from '@utils/read-bytes'

export class Uint32View implements IHash
                                 , IReference
                                 , IReadable<number>
                                 , IWritable<number> {
  static readonly byteLength = Uint32Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  ) {
    this.view = new DataView(buffer)
  }

  get(): number {
    return this.view.getUint32(this.byteOffset)
  }

  set(value: number): void {
    this.view.setUint32(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const bytes = readBytes(this.view.buffer, this.byteOffset, Uint32View.byteLength)
    hasher.write(bytes)
  }
}
