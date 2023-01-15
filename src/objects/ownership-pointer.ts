import { IHash, IFree, IClone, IDestroy } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { ViewConstructor } from '@views/pointer-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { BaseView } from '@views/base-view'
import { NULL } from '@src/null'
import { uint32 } from '@literals/uint32-literal'

export class OwnershipPointer<View extends BaseView & IHash & IFree>
extends BaseObject
implements IClone<OwnershipPointer<View>>
         , IHash
         , IDestroy {
  readonly _view: OwnershipPointerView<View>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>

  static create<View extends BaseView & IHash & IFree>(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , valueByteOffset: number
  ): OwnershipPointer<View> {
    return new this(ConstructorType.Create, allocator, viewConstructor, valueByteOffset)
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , valueByteOffset: number
  )
  private constructor(
    type: ConstructorType.Clone
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
      type: ConstructorType.Clone
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
      case ConstructorType.Clone: {
        const [, allocator, viewConstructor, byteOffset, counter] = args
        this.allocator = allocator
        this.viewConstructor = viewConstructor

        const view = new OwnershipPointerView(allocator.buffer, byteOffset, viewConstructor)
        this._view = view

        counter.increment()
        this._counter = counter

        return
      }
    }
  }

  hash(hasher: IHasher): void {
    const view = this._view.deref()
    if (view) {
      view.hash(hasher)
    } else {
      hasher.write(NULL)
    }
  }

  clone(): OwnershipPointer<View> {
    this.fsm.assertAllocated()

    return new OwnershipPointer(
      ConstructorType.Clone
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
