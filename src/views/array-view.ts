import { IAllocator, IHash, IHasher, IReference, ISized, IReadableWritable, IFree, UnpackedReadableWritable } from '@src/types'
import { FixedLengthArray } from 'justypes'
import { isOwnershiptPointer } from '@utils/is-ownership-pointer'
import { each } from 'iterable-operator'
import { BaseView } from '@views/base-view'

export type ViewConstructor<View extends BaseView> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

export class ArrayView<
  View extends BaseView & IReadableWritable<unknown> & IHash
, Length extends number
>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<FixedLengthArray<UnpackedReadableWritable<View>, Length>>
         , ISized
         , IFree {
  static getByteLength(
    viewConstructor: ViewConstructor<BaseView>
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
  ) {
    super()
  }

  free(allocator: IAllocator): void {
    for (const view of this.iterate()) {
      if (isOwnershiptPointer(view)) {
        view.freePointed(allocator)
      }
    }

    allocator.free(this.byteOffset)
  }

  hash(hasher: IHasher): void {
    for (const view of this.iterate()) {
      view.hash(hasher)
    }
  }

  get(): FixedLengthArray<UnpackedReadableWritable<View>, Length> {
    const results: any[] = []

    for (const view of this.iterate()) {
      results.push(view.get())
    }

    return results as FixedLengthArray<UnpackedReadableWritable<View>, Length>
  }

  set(values: FixedLengthArray<UnpackedReadableWritable<View>, Length>): void {
    each(this.iterate(), (view, i) => {
      const value = (values as Array<UnpackedReadableWritable<View>>)[i]
      view.set(value)
    })
  }

  getByIndex(index: number): UnpackedReadableWritable<View> {
    const view = this.getViewByIndex(index)
    return view.get() as UnpackedReadableWritable<View>
  }

  setByIndex(index: number, value: UnpackedReadableWritable<View>): void {
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

  private * iterate(): IterableIterator<View> {
    for (
      let i = 0, offset = this.byteOffset
    ; i < this.length
    ; i++, offset += this.viewConstructor.byteLength
    ) {
      const view = new this.viewConstructor(this.buffer, offset)
      yield view
    }
  }
}
