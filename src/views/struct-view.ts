import { IHash, IReference, ISized, IReadableWritable, IFree } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { UnpackedReadableWritable } from '@src/types.js'
import { pipe } from 'extra-utils'
import { ReturnTypeOfConstructor } from 'hotypes'
import * as Iter from 'iterable-operator'
import { isOwnershiptPointer } from './utils.js'
import { BaseView } from '@views/base-view.js'
import { lazy } from 'extra-lazy'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

export type MapStructureToValue<
  Structure extends Record<
    string
  , ViewConstructor<IReadableWritable<unknown> & IHash>
  >
> = {
  [Key in keyof Structure]: UnpackedReadableWritable<
    ReturnTypeOfConstructor<Structure[Key]>
  >
}

export class StructView<
  Structure extends Record<string, ViewConstructor<IReadableWritable<unknown> & IHash>>
>
extends BaseView
implements IReference
         , IReadableWritable<MapStructureToValue<Structure>>
         , ISized
         , IHash
         , IFree {
  static getByteLength(structure: Record<string, ViewConstructor<unknown>>): number {
    return Object
      .values(structure)
      .reduce((acc, cur) => acc + cur.byteLength, 0)
  }

  readonly byteLength = StructView.getByteLength(this.structure)

  private getEntries = lazy(() => Object.entries(this.structure))

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private structure: Structure
  ) {
    super()
  }

  free(allocator: IAllocator): void {
    for (const [, view] of this.iterate()) {
      if (isOwnershiptPointer(view)) {
        view.freePointed(allocator)
      }
    }

    allocator.free(this.byteOffset, this.byteLength)
  }

  hash(hasher: IHasher): void {
    for (const [, view] of this.iterate()) {
      view.hash(hasher)
    }
  }

  get(): MapStructureToValue<Structure> {
    const results: Record<string, unknown> = {}

    for (const [key, view] of this.iterate()) {
      const value = view.get()
      results[key] = value
    }

    return results as MapStructureToValue<Structure>
  }

  set(values: MapStructureToValue<Structure>): void {
    for (const [key, view] of this.iterate()) {
      const value = values[key]
      view.set(value)
    }
  }

  getByKey<U extends string & keyof Structure>(key: U): MapStructureToValue<Structure>[U] {
    const view = this.getViewByKey(key)
    return view.get() as MapStructureToValue<Structure>[U]
  }

  setByKey<U extends string & keyof Structure>(
    key: U
  , value: MapStructureToValue<Structure>[U]
  ): void {
    const view = this.getViewByKey(key)
    view.set(value)
  }

  getViewByKey<U extends string & keyof Structure>(
    key: U
  ): ReturnTypeOfConstructor<Structure[U]> {
    const constructor = this.structure[key]
    if (constructor) {
      const view = new constructor(this.buffer, this.getOffsetByIndex(key))
      return view as ReturnTypeOfConstructor<Structure[U]>
    } else {
      throw new Error('out of bounds')
    }
  }

  private getOffsetByIndex<U extends string & keyof Structure>(key: U): number {
    return this.byteOffset
         + pipe(
             this.getEntries()
           , iter => Iter.takeUntil(iter, ([entryKey]) => entryKey === key)
           , iter => Iter.map(iter, ([, constructor]) => constructor)
           , iter => Iter.reduce(iter, (acc, cur) => acc + cur.byteLength, 0)
           )
  }

  private * iterate(): IterableIterator<[
    key: string
  , view: IReadableWritable<unknown> & IHash
  ]> {
    let offset: number = this.byteOffset
    for (const [key, constructor] of this.getEntries()) {
      const view = new constructor(this.buffer, offset)
      yield [key, view]
      offset += constructor.byteLength
    }
  }
}
