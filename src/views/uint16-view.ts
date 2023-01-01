import { IReference, IReadable, IWritable } from '@src/types'

export class Uint16View implements IReference, IReadable<number>, IWritable<number> {
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
}
