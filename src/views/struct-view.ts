import { IAllocator, IHash, IHasher, IReference, ISized, IReadableWritable, IFree } from '@src/types'
import { pipe } from 'extra-utils'
import { ReturnTypeOfConstructor } from 'hotypes'
import * as Iter from 'iterable-operator'

export type ViewConstructor<Value> =
  ISized
& (
    new (buffer: ArrayBufferLike, byteOffset: number) =>
      IReadableWritable<Value>
    & IHash
  )

export type MapStructureToValue<T extends Record<string, ViewConstructor<unknown>>> = {
  [Key in keyof T]:
    ReturnTypeOfConstructor<T[Key]> extends IReadableWritable<infer U>
    ? U
    : never
}

export class StructView<
  Structure extends Record<string, ViewConstructor<unknown>>
> implements IReference
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

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private structure: Structure
  ) {}

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset)
  }

  hash(hasher: IHasher): void {
    let offset: number = this.byteOffset
    for (const constructor of Object.values(this.structure)) {
      const view = new constructor(this.buffer, offset)
      view.hash(hasher)
      offset += constructor.byteLength
    }
  }

  get(): MapStructureToValue<Structure> {
    const results: Record<string, any> = {}

    let offset: number = this.byteOffset
    for (const [key, constructor] of Object.entries(this.structure)) {
      const view = new constructor(this.buffer, offset)
      const value = view.get()
      results[key] = value
      offset += constructor.byteLength
    }

    return results as MapStructureToValue<Structure>
  }

  set(values: MapStructureToValue<Structure>): void {
    let offset: number = this.byteOffset
    for (const [key, constructor] of Object.entries(this.structure)) {
      const view = new constructor(this.buffer, offset)
      const value = values[key]
      view.set(value)
      offset += constructor.byteLength
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
             Object.entries(this.structure)
           , iter => Iter.takeUntil(iter, ([entryKey]) => entryKey === key)
           , iter => Iter.map(iter, ([, constructor]) => constructor)
           , iter => Iter.reduce(iter, (acc, cur) => acc + cur.byteLength, 0)
           )
  }
}
