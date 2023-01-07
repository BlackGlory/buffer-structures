import { IAllocator, IHash, IHasher, IReference, ISized, IReadableWritable, IFree } from '@src/types'
import { FixedLengthArray } from 'justypes'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

export class ArrayView<
  View extends IReadableWritable<Value> & IHash
, Length extends number
, Value = View extends IReadableWritable<infer T> ? T : never
> implements IHash
           , IReference
           , IReadableWritable<FixedLengthArray<Value, Length>>
           , ISized
           , IFree {
  static getByteLength(
    viewConstructor: ViewConstructor<unknown>
  , length: number
  ): number {
    return viewConstructor.byteLength * length
  }

  readonly byteLength = ArrayView.getByteLength(this.viewConstructor, this.length)

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private viewConstructor: ViewConstructor<View>
  , private length: Length
  ) {}

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset)
  }

  hash(hasher: IHasher): void {
    for (
      let i = 0, offset = this.byteOffset
    ; i < this.length
    ; i++, offset += this.viewConstructor.byteLength
    ) {
      const view = new this.viewConstructor(this.buffer, offset)
      view.hash(hasher)
    }
  }

  get(): FixedLengthArray<Value, Length> {
    const results: any[] = []

    for (
      let i = 0, offset = this.byteOffset
    ; i < this.length
    ; i++, offset += this.viewConstructor.byteLength
    ) {
      const view = new this.viewConstructor(this.buffer, offset)
      results.push(view.get())
    }

    return results as FixedLengthArray<Value, Length>
  }

  set(values: FixedLengthArray<Value, Length>): void {
    for (
      let i = 0, offset = this.byteOffset
    ; i < this.length
    ; i++, offset += this.viewConstructor.byteLength
    ) {
      const view = new this.viewConstructor(this.buffer, offset)
      view.set((values as Value[])[i])
    }
  }

  getByIndex(index: number): Value {
    const view = this.getViewByIndex(index)
    return view.get()
  }

  setByIndex(index: number, value: Value): void {
    const view = this.getViewByIndex(index)
    view.set(value)
  }

  getViewByIndex(index: number): View {
    if (index < this.length) {
      const constructor = this.viewConstructor
      const view = new constructor(this.buffer, this.getOffsetByIndex(index))
      return view
    } else {
      throw new Error('out of bounds')
    }
  }

  private getOffsetByIndex(index: number): number {
    return this.byteOffset
         + this.viewConstructor.byteLength * index
  }
}
