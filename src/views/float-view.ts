import { IReference, IReadable, IWritable } from '@src/types'

export class FloatView implements IReference, IReadable<number>, IWritable<number> {
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
}
