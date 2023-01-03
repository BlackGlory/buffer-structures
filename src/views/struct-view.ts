import { IHash, IHasher, IReference, ISized, IReadable, IWritable } from '@src/types'
import { pipe } from 'extra-utils'
import { ReturnTypeOfConstructor } from 'hotypes'
import * as Iter from 'iterable-operator'

export type ViewConstructor<T> =
  ISized
& (new (buffer: ArrayBufferLike, offset: number) => IReadable<T> & IWritable<T> & IHash)

export type MapStructureToValue<T extends Record<string, ViewConstructor<any>>> = {
  [Key in keyof T]:
    ReturnTypeOfConstructor<T[Key]> extends IReadable<infer U>
    ? U
    : never
}

export class StructView<
  T extends Record<string, ViewConstructor<unknown>>
> implements IReference
           , IReadable<MapStructureToValue<T>>
           , IWritable<MapStructureToValue<T>>
           , ISized
           , IHash {
  static getByteLength(structure: Record<string, ViewConstructor<unknown>>): number {
    return Object
      .values(structure)
      .reduce((acc, cur) => acc + cur.byteLength, 0)
  }

  readonly byteLength = StructView.getByteLength(this.structure)

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private structure: T
  ) {}

  hash(hasher: IHasher): void {
    let offset: number = this.byteOffset
    for (const constructor of Object.values(this.structure)) {
      const view = new constructor(this.buffer, offset)
      view.hash(hasher)
      offset += constructor.byteLength
    }
  }

  get(): MapStructureToValue<T> {
    const results: Record<string, any> = {}

    let offset: number = this.byteOffset
    for (const [key, constructor] of Object.entries(this.structure)) {
      const view = new constructor(this.buffer, offset)
      const value = view.get()
      results[key] = value
      offset += constructor.byteLength
    }

    return results as MapStructureToValue<T>
  }

  set(values: MapStructureToValue<T>): void {
    let offset: number = this.byteOffset
    for (const [key, constructor] of Object.entries(this.structure)) {
      const view = new constructor(this.buffer, offset)
      const value = values[key]
      view.set(value)
      offset += constructor.byteLength
    }
  }

  getByKey<U extends string & keyof T>(key: U): MapStructureToValue<T>[U] {
    const constructor = this.structure[key]
    if (constructor) {
      const view = new constructor(this.buffer, this.getOffsetByIndex(key))
      return view.get() as MapStructureToValue<T>[U]
    } else {
      throw new Error('out of bounds')
    }
  }

  getViewByKey<U extends string & keyof T>(key: U): ReturnTypeOfConstructor<T[U]> {
    const constructor = this.structure[key]
    if (constructor) {
      const view = new constructor(this.buffer, this.getOffsetByIndex(key))
      return view as ReturnTypeOfConstructor<T[U]>
    } else {
      throw new Error('out of bounds')
    }
  }

  setByKey<U extends string & keyof T>(key: U, value: MapStructureToValue<T>[U]): void {
    const constructor = this.structure[key]
    if (constructor) {
      const view = new constructor(this.buffer, this.getOffsetByIndex(key))
      view.set(value)
    } else {
      throw new Error('out of bounds')
    }
  }

  private getOffsetByIndex<U extends string & keyof T>(key: U): number {
    return this.byteOffset
         + pipe(
             Object.entries(this.structure)
           , iter => Iter.takeUntil(iter, ([entryKey]) => entryKey === key)
           , iter => Iter.map(iter, ([, constructor]) => constructor)
           , iter => Iter.reduce(iter, (acc, cur) => acc + cur.byteLength, 0)
           )
  }
}
