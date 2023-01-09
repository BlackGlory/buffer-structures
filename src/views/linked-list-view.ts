import { IAllocator, IHash, IHasher, ISized, IReference, IReadableWritable, IFree } from '@src/types'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { isntNull } from '@blackglory/prelude'
import { StructView, MapStructureToValue } from '@views/struct-view'
import { BaseView } from '@views/base-view'
import { withLazyStatic, lazyStatic } from 'extra-lazy'
import { NULL } from '@utils/null'

export type ViewConstructor<View extends BaseView> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

type OwnershipPointerViewConstructor<View extends BaseView & IHash & IFree> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => OwnershipPointerView<View>)

export type Structure<View extends BaseView & IHash & IReadableWritable<unknown>> = {
  next: OwnershipPointerViewConstructor<LinkedListView<View>>
  value: ViewConstructor<View>
}

const createOwnershipPointerView = withLazyStatic(<
  View extends BaseView & IReadableWritable<unknown> & IHash
>(viewConstructor: ViewConstructor<View>) => {
  return lazyStatic(() => {
    class InternalLinkedListView extends LinkedListView<View> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, viewConstructor)
      }
    }

    class InternalOwnershipPointerView extends OwnershipPointerView<LinkedListView<View>> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalLinkedListView)
      }
    }

    return InternalOwnershipPointerView
  }, [viewConstructor])
})

export class LinkedListView<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<MapStructureToValue<Structure<View>>>
         , ISized
         , IFree {
  static getByteLength(
    viewConstructor: ViewConstructor<
      BaseView
    & IReadableWritable<unknown>
    & IHash
    >
  ) {
    return viewConstructor.byteLength + OwnershipPointerView.byteLength
  }

  readonly byteLength = LinkedListView.getByteLength(this.viewConstructor)

  private view: StructView<Structure<View>>

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private viewConstructor: ViewConstructor<View>
  ) {
    super()

    this.view = new StructView(buffer, byteOffset, {
      next: createOwnershipPointerView(viewConstructor)
    , value: viewConstructor
    })
  }

  free(allocator: IAllocator): void {
    this.view.free(allocator)
  }

  hash(hasher: IHasher): void {
    const valueView = this.view.getViewByKey('value')
    valueView.hash(hasher)

    const nextView = this.derefNext()
    if (isntNull(nextView)) {
      nextView.hash(hasher)
    } else {
      hasher.write(NULL)
    }
  }

  get(): MapStructureToValue<Structure<View>> {
    return this.view.get()
  }

  set(value: MapStructureToValue<Structure<View>>): void {
    this.view.set(value)
  }

  setNext(value: MapStructureToValue<Structure<View>>['next']): void {
    this.view.setByKey('next', value)
  }

  getNext(): MapStructureToValue<Structure<View>>['next'] {
    return this.view.getByKey('next')
  }

  setValue(value: MapStructureToValue<Structure<View>>['value']): void {
    this.view.setByKey('value', value)
  }

  getValue(): MapStructureToValue<Structure<View>>['value'] {
    return this.view.getByKey('value')
  }

  getViewOfValue(): View {
    return this.view.getViewByKey('value')
  }

  getViewOfNext(): OwnershipPointerView<LinkedListView<View>> {
    return this.view.getViewByKey('next')
  }

  derefNext(): LinkedListView<View> | null {
    const offset = this.getNext()
    if (isntNull(offset)) {
      return new LinkedListView(this.buffer, offset, this.viewConstructor)
    } else {
      return null
    }
  }
}
