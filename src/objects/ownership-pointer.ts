import { IHash, IFree, IClone, IDestroy, IReference } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { ViewConstructor } from '@views/pointer-view.js'
import { OwnershipPointerView } from '@views/ownership-pointer-view.js'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils.js'
import { BaseObject } from '@objects/base-object.js'
import { BaseView } from '@views/base-view.js'
import { NULL } from '@src/null.js'
import { uint32 } from '@literals/uint32-literal.js'

export class OwnershipPointer<View extends BaseView & IHash & IFree>
extends BaseObject
implements IClone<OwnershipPointer<View>>
         , IHash
         , IDestroy
         , IReference {
  static create<View extends BaseView & IHash & IFree>(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , valueByteOffset: number
  ): OwnershipPointer<View> {
    return new this(ConstructorType.Create, allocator, viewConstructor, valueByteOffset)
  }

  static from<View extends BaseView & IHash & IFree>(
    allocator: IAllocator
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  ): OwnershipPointer<View> {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , viewConstructor
    , byteOffset
    , new ReferenceCounter()
    )
  }

  readonly _view: OwnershipPointerView<View>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  readonly viewConstructor: ViewConstructor<View>

  get byteOffset(): number {
    this.fsm.assertAllocated()

    return this._view.byteOffset
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , valueByteOffset: number
  )
  private constructor(
    type: ConstructorType.Reproduce
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , byteOffset: number
  , counter: ReferenceCounter
  )
  private constructor(...args:
  | [
      type: ConstructorType.Create
    , allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , valueByteOffset: number
    ]
  | [
      type: ConstructorType.Reproduce
    , allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

    const [type] = args
    switch (type) {
      case ConstructorType.Create: {
        const [, allocator, viewConstructor, valueByteOffset] = args
        this.allocator = allocator
        this.viewConstructor = viewConstructor
        this._counter = new ReferenceCounter()

        const byteOffset = allocator.allocate(OwnershipPointerView.byteLength)
        const view = new OwnershipPointerView(
          allocator.buffer
        , byteOffset
        , viewConstructor
        )
        view.set(uint32(valueByteOffset))
        this._view = view

        return
      }
      case ConstructorType.Reproduce: {
        const [, allocator, viewConstructor, byteOffset, counter] = args
        this.allocator = allocator
        this.viewConstructor = viewConstructor
        this._counter = counter

        const view = new OwnershipPointerView(allocator.buffer, byteOffset, viewConstructor)
        this._view = view

        return
      }
    }
  }

  hash(hasher: IHasher): void {
    this.fsm.assertAllocated()

    const view = this._view.deref()
    if (view) {
      view.hash(hasher)
    } else {
      hasher.write(NULL)
    }
  }

  clone(): OwnershipPointer<View> {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new OwnershipPointer(
      ConstructorType.Reproduce
    , this.allocator
    , this.viewConstructor
    , this._view.byteOffset
    , this._counter
    )
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this._view.free(this.allocator)
    }
  }

  deref(): View | null {
    this.fsm.assertAllocated()

    return this._view.deref()
  }
}
