import { IAllocator, IHash, IHasher, IReference, ISized, IReadableWritable, IFree } from '@src/types'
import { NonEmptyArray } from '@blackglory/prelude'
import { ReturnTypeOfConstructor } from 'hotypes'
import { isOwnershiptPointer } from '@utils/is-ownership-pointer'

export type ViewConstructor<Value> =
  ISized
& (
    new (buffer: ArrayBufferLike, byteOffset: number) =>
      IReadableWritable<Value>
    & IHash
  )

export type MapStructureToValue<T extends NonEmptyArray<ViewConstructor<unknown>>> = {
  [Index in keyof T]:
    ReturnTypeOfConstructor<T[Index]> extends IReadableWritable<infer U>
    ? U
    : never
}

export class TupleView<
  Structure extends NonEmptyArray<ViewConstructor<unknown>>
> implements IReference
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
  ) {}

  free(allocator: IAllocator): void {
    let offset: number = this.byteOffset
    for (const constructor of this.structure) {
      const view = new constructor(this.buffer, offset)
      if (isOwnershiptPointer(view)) {
        view.freePointed(allocator)
      }
      offset += constructor.byteLength
    }

    allocator.free(this.byteOffset)
  }

  hash(hasher: IHasher): void {
    let offset: number = this.byteOffset
    for (const constructor of this.structure) {
      const view = new constructor(this.buffer, offset)
      view.hash(hasher)
      offset += constructor.byteLength
    }
  }

  get(): MapStructureToValue<Structure> {
    const results: any[] = []

    let offset: number = this.byteOffset
    for (const constructor of this.structure) {
      const view = new constructor(this.buffer, offset)
      const value = view.get()
      results.push(value)
      offset += constructor.byteLength
    }

    return results as MapStructureToValue<Structure>
  }

  set(values: MapStructureToValue<Structure>): void {
    let offset: number = this.byteOffset
    for (let i = 0; i < this.structure.length; i++) {
      const constructor = this.structure[i]
      const view = new constructor(this.buffer, offset)
      const value = values[i]
      view.set(value)
      offset += constructor.byteLength
    }
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
}
