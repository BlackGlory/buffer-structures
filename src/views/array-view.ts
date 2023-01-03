import { IHash, IHasher, IReference, ISized, IReadable, IWritable } from '@src/types'
import { FixedLengthArray } from 'justypes'

export type ViewConstructor<T> =
  ISized
& (new (buffer: ArrayBufferLike, offset: number) => IReadable<T> & IWritable<T> & IHash)

export class ArrayView<
  Value
, Length extends number
> implements IHash
           , IReference
           , IReadable<FixedLengthArray<Value, Length>>
           , IWritable<FixedLengthArray<Value, Length>>
           , ISized {
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
  , private viewConstructor: ViewConstructor<Value>
  , private length: Length
  ) {}

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
    if (index < this.length) {
      const constructor = this.viewConstructor
      const view = new constructor(this.buffer, this.getOffsetByIndex(index))
      return view.get()
    } else {
      throw new Error('out of bounds')
    }
  }

  setByIndex(index: number, value: Value): void {
    if (index < this.length) {
      const constructor = this.viewConstructor
      const view = new constructor(this.buffer, this.getOffsetByIndex(index))
      view.set(value)
    } else {
      throw new Error('out of bounds')
    }
  }

  private getOffsetByIndex(index: number): number {
    return this.byteOffset
         + this.viewConstructor.byteLength * index
  }
}
