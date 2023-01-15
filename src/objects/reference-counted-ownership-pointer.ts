import { IHash, IFree, IClone, IDestroy } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { ViewConstructor } from '@views/pointer-view'
import { ReferenceCountedOwnershipPointerView } from '@views/reference-counted-ownership-pointer-view'
import { ObjectStateMachine, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { BaseView } from '@views/base-view'
import { NULL } from '@src/null'
import { uint32 } from '@literals/uint32-literal'

export class ReferenceCountedOwnershipPointer<View extends BaseView & IHash & IFree>
extends BaseObject
implements IClone<ReferenceCountedOwnershipPointer<View>>
         , IHash
         , IDestroy {
  readonly _view: ReferenceCountedOwnershipPointerView<View>
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>

  static create<View extends BaseView & IHash & IFree>(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , valueByteOffset: number
  ): ReferenceCountedOwnershipPointer<View> {
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
    ]
  ) {
    super()

    const [type] = args
    switch (type) {
      case ConstructorType.Create: {
        const [, allocator, viewConstructor, valueByteOffset] = args
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
        view.set([uint32(1), uint32(valueByteOffset)])
        this._view = view

        return
      }
      case ConstructorType.Clone: {
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

  clone(): ReferenceCountedOwnershipPointer<View> {
    this.fsm.assertAllocated()

    return new ReferenceCountedOwnershipPointer(
      ConstructorType.Clone
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
