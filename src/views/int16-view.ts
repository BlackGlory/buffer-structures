import { IHash, IHasher, IReference, IReadable, IWritable } from '@src/types'
import { readBytes } from '@utils/read-bytes'

export class Int16View implements IHash
                                , IReference
                                , IReadable<number>
                                , IWritable<number> {
  static readonly byteLength = Int16Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    this.view = new DataView(buffer)
  }

  get(): number {
    return this.view.getInt16(this.byteOffset)
  }

  set(value: number): void {
    this.view.setInt16(this.byteOffset, value)
  }

  hash(hasher: IHasher): void {
    const bytes = readBytes(this.view.buffer, this.byteOffset, Int16View.byteLength)
    hasher.write(bytes)
  }
}
