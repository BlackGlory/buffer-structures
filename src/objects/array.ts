import { IAllocator, ICopy, IReferenceCounted, IReadableWritable, IHash, IHasher } from '@src/types'
import { ViewConstructor, ArrayView } from '@views/array-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'
import { FixedLengthArray } from 'justypes'

export class Array<
  View extends IReadableWritable<Value> & IHash
, Length extends number
, Value = View extends IReadableWritable<infer T> ? T : never
> implements ICopy<Array<View, Length, Value>>
           , IReferenceCounted<Array<View, Length, Value>>
           , IReadableWritable<FixedLengthArray<View, Length>>
           , IHash {
  readonly _view: ArrayView<View, Length, Value>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>
  private length: Length

  constructor(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , length: Length
  , values?: FixedLengthArray<Value, Length>
  )
  constructor(
    _allocator: IAllocator
  , _viewConstructor: ViewConstructor<View>
  , _length: Length
  , _offset: number
  , _counter: ReferenceCounter
  )
  constructor(...args:
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , length: Length
    , values?: FixedLengthArray<View, Length>
    ]
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , length: Length
    , offset: number
    , counter: ReferenceCounter
    ]
  ) {
    if (args.length === 5) {
      const [allocator, viewConstructor, length, offset, counter] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this.length = length

      const view = new ArrayView<View, Length, Value>(
        allocator.buffer
      , offset
      , viewConstructor
      , length
      )
      this._view = view

      counter.increment()
      this._counter = counter
    } else {
      const [allocator, viewConstructor, length, values] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this.length = length
      this._counter = new ReferenceCounter()

      const offset = allocator.allocate(ArrayView.getByteLength(viewConstructor, length))
      const view = new ArrayView<View, Length, Value>(
        allocator.buffer
      , offset
      , viewConstructor
      , length
      )
      if (values) {
        view.set(values)
      }
      this._view = view
    }
  }

  hash(hasher: IHasher): void {
    this._view.hash(hasher)
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this.allocator.free(this._view.byteOffset)
    }
  }

  clone(): Array<View, Length, Value> {
    this.fsm.assertAllocated()

    return new Array(
      this.allocator
    , this.viewConstructor
    , this.length
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Array<View, Length, Value> {
    this.fsm.assertAllocated()

    return new Array(this.allocator, this.viewConstructor, this.length, this.get())
  }

  get(): FixedLengthArray<Value, Length> {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(values: FixedLengthArray<Value, Length>): void {
    this.fsm.assertAllocated()

    this._view.set(values)
  }

  getByIndex(index: number): Value {
    return this._view.getByIndex(index)
  }

  setByIndex(index: number, value: Value): void {
    this._view.setByIndex(index, value)
  }
}
