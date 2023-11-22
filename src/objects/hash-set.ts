import { IHash, IReadableWritable, IClone, IDestroy, IReference } from '@src/traits.js'
import { IAllocator } from '@src/interfaces.js'
import { UnpackedReadableWritable } from '@src/types.js'
import { HashSetView, ViewConstructor } from '@views/hash-set-view.js'
import { HashBucketsView } from '@views/hash-buckets-view.js'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils.js'
import { BaseObject } from '@objects/base-object.js'
import { BaseView } from '@views/base-view.js'
import { uint32 } from '@literals/uint32-literal.js'

/**
 * 在向HashSet添加新的项目后, HashSet可能会尝试对内部数组进行扩容, 从而确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
export class HashSet<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseObject
implements IClone<HashSet<View>>
         , IDestroy
         , IReference {
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

  static from<View extends BaseView & IReadableWritable<unknown> & IHash>(
    allocator: IAllocator
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  , options: {
      capacity: number
      loadFactor: number
      growthFactor: number
    }
  ): HashSet<View> {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , viewConstructor
    , options
    , byteOffset
    , new ReferenceCounter()
    )
  }

  _view: HashSetView<View>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  readonly viewConstructor: ViewConstructor<View>

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
  , viewConstructor: ViewConstructor<View>
  , options?: {
      capacity?: number
      loadFactor?: number
      growthFactor?: number
    }
  )
  private constructor(
    type: ConstructorType.Reproduce
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
      type: ConstructorType.Reproduce
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

        const bucketsByteOffset = allocator.allocate(
          HashBucketsView.getByteLength(viewConstructor, capacity)
        )
        const bucketsView = new HashBucketsView(
          allocator.buffer
        , bucketsByteOffset
        , viewConstructor
        , capacity
        )
        // 初始化buckets中的每一个指针, 防止指向错误的位置.
        for (let i = 0; i < capacity; i++) {
          bucketsView.setByIndex(i, null)
        }

        const byteOffset = allocator.allocate(HashSetView.byteLength)
        const view = new HashSetView(
          this.allocator.buffer
        , byteOffset
        , viewConstructor
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
        const [, allocator, viewConstructor, options, byteOffset, counter] = args
        this.allocator = allocator
        this.viewConstructor = viewConstructor
        this._counter = counter

        this._view = new HashSetView(
          this.allocator.buffer
        , byteOffset
        , viewConstructor
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

  clone(): HashSet<View> {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new HashSet(
      ConstructorType.Reproduce
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

    return this._view.itemValues()
  }

  has(value: IHash): boolean {
    this.fsm.assertAllocated()

    return this._view.hasItem(value)
  }

  add(value: UnpackedReadableWritable<View> & IHash): void {
    this.fsm.assertAllocated()

    this._view.addItem(this.allocator, value)
  }

  delete(value: IHash): void {
    this.fsm.assertAllocated()

    this._view.deleteItem(this.allocator, value)
  }
}
