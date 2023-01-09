import { IAllocator, IHash, IFree, IHasher, IClone, IDestroy } from '@src/types'
import { ViewConstructor } from '@views/pointer-view'
import { ReferenceCountedOwnershipPointerView } from '@views/reference-counted-ownership-pointer-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { BaseObject } from '@objects/base-object'
import { BaseView } from '@views/base-view'
import { NULL } from '@utils/null'

const internalOverrideSymbol = Symbol()

export class ReferenceCountedOwnershipPointer<View extends BaseView & IHash & IFree>
extends BaseObject
implements IClone<ReferenceCountedOwnershipPointer<View>>
         , IHash
         , IDestroy {
  readonly _view: ReferenceCountedOwnershipPointerView<View>
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>

  constructor(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , valueByteOffset: number
  )
  constructor(
    symbol: typeof internalOverrideSymbol
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , byteOffset: number
  )
  constructor(...args:
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , valueByteOffset: number
    ]
  | [
      internalOverride: typeof internalOverrideSymbol
    , allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , byteOffset: number
    ]
  ) {
    super()

    if (args.length === 3) {
      const [allocator, viewConstructor, valueByteOffset] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor

      const byteOffset = allocator.allocate(
        ReferenceCountedOwnershipPointerView.byteLength
      )
      const view = new ReferenceCountedOwnershipPointerView(
        allocator.buffer
      , byteOffset
      , viewConstructor
      )
      view.set({ count: 1, value: valueByteOffset })
      this._view = view
    } else {
      const [, allocator, viewConstructor, byteOffset] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor

      const view = new ReferenceCountedOwnershipPointerView(
        allocator.buffer
      , byteOffset
      , viewConstructor
      )
      view.incrementCount()
      this._view = view
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

  clone(): ReferenceCountedOwnershipPointer<View> {
    this.fsm.assertAllocated()

    return new ReferenceCountedOwnershipPointer(
      internalOverrideSymbol
    , this.allocator
    , this.viewConstructor
    , this._view.byteOffset
    )
  }

  destroy(): void {
    this.fsm.free()

    this._view.free(this.allocator)
  }

  deref(): View | null {
    this.fsm.assertAllocated()

    return this._view.deref()
  }
}
