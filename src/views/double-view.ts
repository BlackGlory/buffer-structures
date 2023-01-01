import { IReference, IReadable, IWritable } from '@src/types'

export class DoubleView implements IReference, IReadable<number>, IWritable<number> {
  static readonly byteLength = Float64Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    this.view = new DataView(buffer)
  }

  get(): number {
    return this.view.getFloat64(this.byteOffset)
  }

  set(value: number): void {
    this.view.setFloat64(this.byteOffset, value)
  }
}
