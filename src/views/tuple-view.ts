import { IAllocator, IHash, IHasher, IReference, ISized, IReadableWritable, IFree, UnpackedReadableWritable } from '@src/types'
import { NonEmptyArray } from '@blackglory/prelude'
import { ReturnTypeOfConstructor } from 'hotypes'
import { isOwnershiptPointer } from '@utils/is-ownership-pointer'
import { each } from 'iterable-operator'
import { BaseView } from '@views/base-view'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

export type MapStructureToValue<
  T extends NonEmptyArray<ViewConstructor<IReadableWritable<unknown> & IHash>>
> = {
  [Index in keyof T]: UnpackedReadableWritable<ReturnTypeOfConstructor<T[Index]>>
}

export class TupleView<
  Structure extends NonEmptyArray<ViewConstructor<IReadableWritable<unknown> & IHash>>
>
extends BaseView
implements IReference
         , IReadableWritable<MapStructureToValue<Structure>>
         , ISized
         , IHash
         , IFree {
  static getByteLength(structure: NonEmptyArray<ViewConstructor<unknown>>): number {
    return structure.reduce((acc, cur) => acc + cur.byteLength, 0)
  }

  readonly byteLength = TupleView.getByteLength(this.structure)

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private structure: Structure
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

  get(): MapStructureToValue<Structure> {
    const results: any[] = []

    for (const view of this.iterate()) {
      const value = view.get()
      results.push(value)
    }

    return results as MapStructureToValue<Structure>
  }

  set(values: MapStructureToValue<Structure>): void {
    each(this.iterate(), (view, i) => {
      const value = values[i]
      view.set(value)
    })
  }

  getByIndex<U extends number & keyof Structure>(
    index: U
  ): MapStructureToValue<Structure>[U] {
    const view = this.getViewByIndex(index)
    return view.get() as MapStructureToValue<Structure>[U]
  }

  setByIndex<U extends number & keyof Structure>(
    index: U
  , value: MapStructureToValue<Structure>[U]
  ): void {
    const view = this.getViewByIndex(index)
    view.set(value)
  }

  getViewByIndex<U extends number & keyof Structure>(
    index: U
  ): ReturnTypeOfConstructor<Structure[U]> {
    const constructor = this.structure[index]
    if (constructor) {
      const view = new constructor(this.buffer, this.getOffsetByIndex(index))
      return view as ReturnTypeOfConstructor<Structure[U]>
    } else {
      throw new Error('out of bounds')
    }
  }

  private getOffsetByIndex<U extends number & keyof Structure>(index: U): number {
    return this.byteOffset
         + this.structure
             .slice(0, index)
             .reduce((acc, cur) => acc + cur.byteLength, 0)
  }

  private * iterate(): IterableIterator<IReadableWritable<unknown> & IHash> {
    let offset: number = this.byteOffset
    for (const constructor of this.structure) {
      const view = new constructor(this.buffer, offset)
      yield view
      offset += constructor.byteLength
    }
  }
}
