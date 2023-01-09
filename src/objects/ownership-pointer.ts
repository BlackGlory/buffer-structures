import { IAllocator, IHash, IFree, IHasher, IClone, IDestroy } from '@src/types'
import { ViewConstructor } from '@views/pointer-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'
import { BaseObject } from '@objects/base-object'
import { BaseView } from '@views/base-view'
import { NULL } from '@utils/null'

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

  constructor(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , valueByteOffset: number
  )
  constructor(
    _allocator: IAllocator
  , _viewConstructor: ViewConstructor<View>
  , _byteOffset: number
  , _counter: ReferenceCounter
  )
  constructor(...args:
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , valueByteOffset: number
    ]
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

    if (args.length === 3) {
      const [allocator, viewConstructor, valueByteOffset] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this._counter = new ReferenceCounter()

      const byteOffset = allocator.allocate(OwnershipPointerView.byteLength)
      const view = new OwnershipPointerView(
        allocator.buffer
      , byteOffset
      , viewConstructor
      )
      view.set(valueByteOffset)
      this._view = view
    } else {
      const [allocator, viewConstructor, byteOffset, counter] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor

      const view = new OwnershipPointerView(allocator.buffer, byteOffset, viewConstructor)
      this._view = view

      counter.increment()
      this._counter = counter
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
      this.allocator
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
