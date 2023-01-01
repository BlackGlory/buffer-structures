import { IReference, IReadable, IWritable } from '@src/types'

export class Int32View implements IReference, IReadable<number>, IWritable<number> {
  static readonly byteLength = Int32Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    this.view = new DataView(buffer)
  }

  get(): number {
    return this.view.getInt32(this.byteOffset)
  }

  set(value: number): void {
    this.view.setInt32(this.byteOffset, value)
  }
}
