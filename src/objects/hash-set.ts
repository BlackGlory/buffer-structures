import { IHash, IReadableWritable, IClone, IDestroy } from '@src/traits'
import { IAllocator } from '@src/interfaces'
import { UnpackedReadableWritable } from '@src/types'
import { Uint32View } from '@views/uint32-view'
import { HashSetView, createInternalViews, ViewConstructor } from '@views/hash-set-view'
import { TupleView } from '@views/tuple-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { BaseView } from '@views/base-view'
import { uint32 } from '@literals/uint32-literal'

/**
 * 在向HashSet添加新的项目后, HashSet可能会尝试对内部数组进行扩容, 从而确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
export class HashSet<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseObject
implements IClone<HashSet<View>>
         , IDestroy {
  _view: HashSetView<View>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>

  get capacity(): number {
    this.fsm.assertAllocated()

    return this._view.capacity
  }

  get size(): number {
    this.fsm.assertAllocated()

    return this._view.getSize()
  }

  static create<View extends BaseView & IReadableWritable<unknown> & IHash>(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , options?: {
      capacity?: number
      loadFactor?: number
      growthFactor?: number
    }
  ): HashSet<View> {
    return new this(ConstructorType.Create, allocator, viewConstructor, options)
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , options?: {
      capacity?: number
      loadFactor?: number
      growthFactor?: number
    }
  )
  private constructor(
    type: ConstructorType.Clone
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
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
    , valueViewConstructor: ViewConstructor<View>
    , options?: {
        capacity?: number
        loadFactor?: number
        growthFactor?: number
      }
    ]
  | [
      type: ConstructorType.Clone
    , allocator: IAllocator
    , valueViewConstructor: ViewConstructor<View>
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
        , viewConstructor
        , {
            capacity = 1
          , loadFactor = 0.75
          , growthFactor = 2
          } = {}
        ] = args
        this.allocator = allocator
        this.viewConstructor = viewConstructor
        this._counter = new ReferenceCounter()

        const {
          InternalBucketsOwnershipPointerView
        , InternalBucketsView
        } = createInternalViews(viewConstructor, capacity)

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

        this._view = new HashSetView(
          this.allocator.buffer
        , rootByteOffset
        , viewConstructor
        , { loadFactor, capacity, growthFactor }
        )

        return
      }
      case ConstructorType.Clone: {
        const [, allocator, viewConstructor, options, byteOffset, counter] = args
        this.allocator = allocator
        this.viewConstructor = viewConstructor

        this._view = new HashSetView(
          this.allocator.buffer
        , byteOffset
        , viewConstructor
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

  clone(): HashSet<View> {
    this.fsm.assertAllocated()

    return new HashSet(
      ConstructorType.Clone
    , this.allocator
    , this.viewConstructor
    , {
        capacity: this._view.capacity
      , growthFactor: this._view.growthFactor
      , loadFactor: this._view.loadFactor
      }
    , this._view.byteOffset
    , this._counter
    )
  }

  values(): IterableIterator<View> {
    this.fsm.assertAllocated()

    return this._view.values()
  }

  has(value: IHash): boolean {
    this.fsm.assertAllocated()

    return this._view.has(value)
  }

  add(value: UnpackedReadableWritable<View> & IHash): void {
    this.fsm.assertAllocated()

    this._view.add(this.allocator, value)
  }

  delete(value: IHash): void {
    this.fsm.assertAllocated()

    this._view.delete(this.allocator, value)
  }
}
