import { IReference, ISized, IReadable, IWritable } from '@src/types'
import { FixedLengthArray } from 'justypes'

export type ViewConstructor<T> =
  ISized
& (new (buffer: ArrayBufferLike, offset: number) => IReadable<T> & IWritable<T>)

export class ArrayView<
  T
, Length extends number
> implements IReference
           , IReadable<FixedLengthArray<T, Length>>
           , IWritable<FixedLengthArray<T, Length>>
           , ISized {
  static getByteLength(viewConstructor: ViewConstructor<unknown>, length: number): number {
    return viewConstructor.byteLength * length
  }

  readonly byteLength = ArrayView.getByteLength(this.viewConstructor, this.length)

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private viewConstructor: ViewConstructor<T>
  , private length: Length
  ) {}

  get(): FixedLengthArray<T, Length> {
    const results: any[] = []

    for (
      let i = 0, offset = this.byteOffset
    ; i < this.length
    ; i++, offset += this.viewConstructor.byteLength
    ) {
      const view = new this.viewConstructor(this.buffer, offset)
      results.push(view.get())
    }

    return results as FixedLengthArray<T, Length>
  }

  set(values: FixedLengthArray<T, Length>): void {
    for (
      let i = 0, offset = this.byteOffset
    ; i < this.length
    ; i++, offset += this.viewConstructor.byteLength
    ) {
      const view = new this.viewConstructor(this.buffer, offset)
      view.set((values as T[])[i])
    }
  }

  getByIndex(index: number): T {
    if (index < this.length) {
      const constructor = this.viewConstructor
      const view = new constructor(this.buffer, this.getOffsetByIndex(index))
      return view.get()
    } else {
      throw new Error('out of bounds')
    }
  }

  setByIndex(index: number, value: T): void {
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

// import { IReference, ISized, IReadable, IWritable } from '@src/types'
// import { ReturnTypeOfConstructor } from 'hotypes'
// import { FixedLengthArray } from 'justypes'

// export type ViewConstructor<T> =
//   ISized
// & (new (buffer: ArrayBufferLike, offset: number) => IReadable<T> & IWritable<T>)

// export type ValueOfViewConstructor<T extends ViewConstructor<any>> =
//   ReturnTypeOfConstructor<T> extends IReadable<infer U>
//   ? U
//   : never

// export type MapViewConstructorToValue<
//   View extends ViewConstructor<any>
// , Length extends number
// > = FixedLengthArray<ValueOfViewConstructor<View>, Length>

// export class ArrayView<
//   T extends ViewConstructor<unknown>
// , Length extends number
// > implements IReference
//            , IReadable<MapViewConstructorToValue<T, Length>>
//            , IWritable<MapViewConstructorToValue<T, Length>>
//            , ISized {
//   static getByteLength(viewConstructor: ViewConstructor<unknown>, length: number): number {
//     return viewConstructor.byteLength * length
//   }

//   readonly byteLength = ArrayView.getByteLength(this.viewConstructor, this.length)

//   constructor(
//     private buffer: ArrayBufferLike
//   , public readonly byteOffset: number
//   , private viewConstructor: T
//   , private length: Length
//   ) {}

//   get(): MapViewConstructorToValue<T, Length> {
//     const results: any[] = []

//     for (
//       let i = 0, offset = this.byteOffset
//     ; i < this.length
//     ; i++, offset += this.byteOffset
//     ) {
//       const view = new this.viewConstructor(this.buffer, offset)
//       results.push(view.get())
//     }

//     return results as MapViewConstructorToValue<T, Length>
//   }

//   set(values: MapViewConstructorToValue<T, Length>): void {
//     for (
//       let i = 0, offset = this.byteOffset
//     ; i < this.length
//     ; i++, offset += this.byteOffset
//     ) {
//       const view = new this.viewConstructor(this.buffer, offset)
//       view.set((values as Array<ValueOfViewConstructor<T>>)[i])
//     }
//   }

//   getByIndex(index: number): ValueOfViewConstructor<T> {
//     if (index < this.length) {
//       const constructor = this.viewConstructor
//       const view = new constructor(this.buffer, this.getOffsetByIndex(index))
//       return view.get() as ValueOfViewConstructor<T>
//     } else {
//       throw new Error('out of bounds')
//     }
//   }

//   setByIndex(index: number, value: ValueOfViewConstructor<T>): void {
//     if (index < this.length) {
//       const constructor = this.viewConstructor
//       const view = new constructor(this.buffer, this.getOffsetByIndex(index))
//       view.set(value)
//     } else {
//       throw new Error('out of bounds')
//     }
//   }

//   private getOffsetByIndex(index: number): number {
//     return this.byteOffset
//          + this.viewConstructor.byteLength * index
//   }
// }
