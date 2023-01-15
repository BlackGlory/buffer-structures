import { IHash, IReadableWritable, IClone, IDestroy } from '@src/traits'
import { IAllocator } from '@src/interfaces'
import { UnpackedReadableWritable } from '@src/types'
import { Uint32View } from '@views/uint32-view'
import { HashMapView, createInternalViews, ViewConstructor } from '@views/hash-map-view'
import { TupleView } from '@views/tuple-view'
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
         , IDestroy {
  _view: HashMapView<KeyView, ValueView>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private keyViewConstructor: ViewConstructor<KeyView>
  private valueViewConstructor: ViewConstructor<ValueView>

  get capacity(): number {
    this.fsm.assertAllocated()

    return this._view.capacity
  }

  get size(): number {
    this.fsm.assertAllocated()

    return this._view.getSize()
  }

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
    type: ConstructorType.Clone
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
      type: ConstructorType.Clone
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

        const {
          InternalBucketsOwnershipPointerView
        , InternalBucketsView
        } = createInternalViews(keyViewConstructor, valueViewConstructor, capacity)

        const bucketsByteOffset = allocator.allocate(InternalBucketsView.byteLength)
        const bucketsView = new InternalBucketsView(allocator.buffer, bucketsByteOffset)
        // 初始化buckets中的每一个指针, 防止指向错误的位置.
        for (let i = 0; i < capacity; i++) {
          bucketsView.setByIndex(i, null)
        }

        const rootByteOffset = allocator.allocate(
          TupleView.getByteLength([
            Uint32View
          , InternalBucketsOwnershipPointerView
          ])
        )
        const rootView = new TupleView(
          allocator.buffer
        , rootByteOffset
        , [
            Uint32View
          , InternalBucketsOwnershipPointerView
          ]
        )
        rootView.set([
          uint32(0)
        , uint32(bucketsByteOffset)
        ])

        this._view = new HashMapView(
          this.allocator.buffer
        , rootByteOffset
        , keyViewConstructor
        , valueViewConstructor
        , { loadFactor, capacity, growthFactor }
        )

        return
      }
      case ConstructorType.Clone: {
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

        this._view = new HashMapView(
          this.allocator.buffer
        , byteOffset
        , keyViewConstructor
        , valueViewConstructor
        , options
        )

        counter.increment()
        this._counter = counter

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

    return new HashMap(
      ConstructorType.Clone
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

    return this._view.entries()
  }

  keys(): IterableIterator<KeyView> {
    this.fsm.assertAllocated()

    return this._view.keys()
  }

  values(): IterableIterator<ValueView> {
    this.fsm.assertAllocated()

    return this._view.values()
  }

  has(key: IHash): boolean {
    this.fsm.assertAllocated()

    return this._view.has(key)
  }

  get(key: IHash): ValueView | undefined {
    this.fsm.assertAllocated()

    return this._view.get(key)
  }

  set(
    key: IHash & UnpackedReadableWritable<KeyView>
  , value: UnpackedReadableWritable<ValueView>
  ): void {
    this.fsm.assertAllocated()

    return this._view.set(this.allocator, key, value)
  }

  delete(key: IHash): void {
    this.fsm.assertAllocated()

    return this._view.delete(this.allocator, key)
  }
}
