import { IHash, IHasher, IReference, ISized, IReadable, IWritable } from '@src/types'
import { NonEmptyArray } from '@blackglory/prelude'
import { ReturnTypeOfConstructor } from 'hotypes'

export type ViewConstructor<T> =
  ISized
& (new (buffer: ArrayBufferLike, offset: number) => IReadable<T> & IWritable<T> & IHash)

export type MapStructureToValue<T extends NonEmptyArray<ViewConstructor<any>>> = {
  [Index in keyof T]:
    ReturnTypeOfConstructor<T[Index]> extends IReadable<infer U>
    ? U
    : never
}

export class TupleView<
  T extends NonEmptyArray<ViewConstructor<unknown>>
> implements IReference
           , IReadable<MapStructureToValue<T>>
           , IWritable<MapStructureToValue<T>>
           , ISized
           , IHash {
  static getByteLength(structure: NonEmptyArray<ViewConstructor<unknown>>): number {
    return structure.reduce((acc, cur) => acc + cur.byteLength, 0)
  }

  readonly byteLength = TupleView.getByteLength(this.structure)

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private structure: T
  ) {}

  hash(hasher: IHasher): void {
    let offset: number = this.byteOffset
    for (const constructor of this.structure) {
      const view = new constructor(this.buffer, offset)
      view.hash(hasher)
      offset += constructor.byteLength
    }
  }

  get(): MapStructureToValue<T> {
    const results: any[] = []

    let offset: number = this.byteOffset
    for (const constructor of this.structure) {
      const view = new constructor(this.buffer, offset)
      const value = view.get()
      results.push(value)
      offset += constructor.byteLength
    }

    return results as MapStructureToValue<T>
  }

  set(values: MapStructureToValue<T>): void {
    let offset: number = this.byteOffset
    for (let i = 0; i < this.structure.length; i++) {
      const constructor = this.structure[i]
      const view = new constructor(this.buffer, offset)
      const value = values[i]
      view.set(value)
      offset += constructor.byteLength
    }
  }

  getByIndex<U extends number & keyof T>(index: U): MapStructureToValue<T>[U] {
    const constructor = this.structure[index]
    if (constructor) {
      const view = new constructor(this.buffer, this.getOffsetByIndex(index))
      return view.get() as MapStructureToValue<T>[U]
    } else {
      throw new Error('out of bounds')
    }
  }

  setByIndex<U extends number & keyof T>(
    index: U
  , value: MapStructureToValue<T>[U]
  ): void {
    const constructor = this.structure[index]
    if (constructor) {
      const view = new constructor(this.buffer, this.getOffsetByIndex(index))
      view.set(value)
    } else {
      throw new Error('out of bounds')
    }
  }

  private getOffsetByIndex<U extends number & keyof T>(index: U): number {
    return this.byteOffset
         + this.structure
             .slice(0, index)
             .reduce((acc, cur) => acc + cur.byteLength, 0)
  }
}
