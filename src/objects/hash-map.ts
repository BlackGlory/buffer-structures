import { IHash, IReadableWritable, IClone, IDestroy, IReference } from '@src/traits'
import { IAllocator } from '@src/interfaces'
import { UnpackedReadableWritable } from '@src/types'
import { HashMapView, ViewConstructor, createInternalViews } from '@views/hash-map-view'
import { HashBucketsView } from '@views/hash-buckets-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { BaseView } from '@views/base-view'
import { uint32 } from '@literals/uint32-literal'

/**
 * 在向HashMap添加新的项目后, HashMap可能会尝试对内部数组进行扩容, 从而确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
export class HashMap<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
>
extends BaseObject
implements IClone<HashMap<KeyView, ValueView>>
         , IDestroy
         , IReference {
  static create<
    KeyView extends BaseView & IReadableWritable<unknown> & IHash
  , ValueView extends BaseView & IReadableWritable<unknown> & IHash
  >(
    allocator: IAllocator
  , keyViewConstructor: ViewConstructor<KeyView>
  , valueViewConstructor: ViewConstructor<ValueView>
  , options?: {
      capacity?: number
      loadFactor?: number
      growthFactor?: number
    }
  ): HashMap<KeyView, ValueView> {
    return new this(
      ConstructorType.Create
    , allocator
    , keyViewConstructor
    , valueViewConstructor
    , options
    )
  }

  static from<
    KeyView extends BaseView & IReadableWritable<unknown> & IHash
  , ValueView extends BaseView & IReadableWritable<unknown> & IHash
  >(
    allocator: IAllocator
  , byteOffset: number
  , keyViewConstructor: ViewConstructor<KeyView>
  , valueViewConstructor: ViewConstructor<ValueView>
  , options: {
      capacity: number
      loadFactor: number
      growthFactor: number
    }
  ): HashMap<KeyView, ValueView> {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , keyViewConstructor
    , valueViewConstructor
    , options
    , byteOffset
    , new ReferenceCounter()
    )
  }

  _view: HashMapView<KeyView, ValueView>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  readonly keyViewConstructor: ViewConstructor<KeyView>
  readonly valueViewConstructor: ViewConstructor<ValueView>

  get byteOffset(): number {
    this.fsm.assertAllocated()

    return this._view.byteOffset
  }

  get capacity(): number {
    this.fsm.assertAllocated()

    return this._view.capacity
  }

  get loadFactor(): number {
    this.fsm.assertAllocated()

    return this._view.loadFactor
  }

  get growthFactor(): number {
    this.fsm.assertAllocated()

    return this._view.growthFactor
  }

  get size(): number {
    this.fsm.assertAllocated()

    return this._view.getSize()
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , keyViewConstructor: ViewConstructor<KeyView>
  , valueViewConstructor: ViewConstructor<ValueView>
  , options?: {
      capacity?: number
      loadFactor?: number
      growthFactor?: number
    }
  )
  private constructor(
    type: ConstructorType.Reproduce
  , allocator: IAllocator
  , keyViewConstructor: ViewConstructor<KeyView>
  , valueViewConstructor: ViewConstructor<ValueView>
  , options: {
      capacity: number
      loadFactor: number
      growthFactor: number
    }
  , byteOffset: number
  , counter: ReferenceCounter
  )
  private constructor(...args:
  | [
      type: ConstructorType.Create
    , allocator: IAllocator
    , keyViewConstructor: ViewConstructor<KeyView>
    , valueViewConstructor: ViewConstructor<ValueView>
    , options?: {
        capacity?: number
        loadFactor?: number
        growthFactor?: number
      }
    ]
  | [
      type: ConstructorType.Reproduce
    , allocator: IAllocator
    , keyViewConstructor: ViewConstructor<KeyView>
    , valueViewConstructor: ViewConstructor<ValueView>
    , options: {
        capacity: number
        loadFactor: number
        growthFactor: number
      }
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

    const [type] = args
    switch (type) {
      case ConstructorType.Create: {
        const [
        , allocator
        , keyViewConstructor
        , valueViewConstructor
        , {
            capacity = 1
          , loadFactor = 0.75
          , growthFactor = 2
          } = {}
        ] = args
        this.allocator = allocator
        this.keyViewConstructor = keyViewConstructor
        this.valueViewConstructor = valueViewConstructor
        this._counter = new ReferenceCounter()

        const { InternalTupleView } = createInternalViews(
          keyViewConstructor
        , valueViewConstructor
        , capacity
        )
        const bucketsByteOffset = allocator.allocate(
          HashBucketsView.getByteLength(
            InternalTupleView
          , capacity
          )
        )
        const bucketsView = new HashBucketsView(
          allocator.buffer
        , bucketsByteOffset
        , InternalTupleView
        , capacity
        )
        // 初始化buckets中的每一个指针, 防止指向错误的位置.
        for (let i = 0; i < capacity; i++) {
          bucketsView.setByIndex(i, null)
        }

        const byteOffset = allocator.allocate(HashMapView.byteLength)
        const view = new HashMapView(
          this.allocator.buffer
        , byteOffset
        , keyViewConstructor
        , valueViewConstructor
        , { loadFactor, capacity, growthFactor }
        )
        view.set([
          uint32(0)
        , uint32(bucketsByteOffset)
        ])
        this._view = view

        return
      }
      case ConstructorType.Reproduce: {
        const [
        , allocator
        , keyViewConstructor
        , valueViewConstructor
        , options
        , byteOffset
        , counter
        ] = args
        this.allocator = allocator
        this.keyViewConstructor = keyViewConstructor
        this.valueViewConstructor = valueViewConstructor
        this._counter = counter

        this._view = new HashMapView(
          this.allocator.buffer
        , byteOffset
        , keyViewConstructor
        , valueViewConstructor
        , options
        )

        return
      }
    }
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this._view.free(this.allocator)
    }
  }

  clone(): HashMap<KeyView, ValueView> {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new HashMap(
      ConstructorType.Reproduce
    , this.allocator
    , this.keyViewConstructor
    , this.valueViewConstructor
    , {
        capacity: this._view.capacity
      , growthFactor: this._view.growthFactor
      , loadFactor: this._view.loadFactor
      }
    , this._view.byteOffset
    , this._counter
    )
  }

  entries(): IterableIterator<[KeyView, ValueView]> {
    this.fsm.assertAllocated()

    return this._view.itemEntries()
  }

  keys(): IterableIterator<KeyView> {
    this.fsm.assertAllocated()

    return this._view.itemKeys()
  }

  values(): IterableIterator<ValueView> {
    this.fsm.assertAllocated()

    return this._view.itemValues()
  }

  has(key: IHash): boolean {
    this.fsm.assertAllocated()

    return this._view.hasItem(key)
  }

  get(key: IHash): ValueView | null {
    this.fsm.assertAllocated()

    return this._view.getItem(key)
  }

  set(
    key: IHash & UnpackedReadableWritable<KeyView>
  , value: UnpackedReadableWritable<ValueView>
  ): void {
    this.fsm.assertAllocated()

    return this._view.setItem(this.allocator, key, value)
  }

  delete(key: IHash): void {
    this.fsm.assertAllocated()

    return this._view.deleteItem(this.allocator, key)
  }
}
