import { IReference, IReadable, IWritable } from '@src/types'

export class Uint8View implements IReference, IReadable<number>, IWritable<number> {
  static readonly byteLength = Uint8Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  ) {
    this.view = new DataView(buffer)
  }

  get(): number {
    return this.view.getUint8(this.byteOffset)
  }

  set(value: number): void {
    this.view.setUint8(this.byteOffset, value)
  }
}
