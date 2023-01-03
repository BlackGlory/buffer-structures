import { IHash, IHasher, IReference, IReadable, IWritable } from '@src/types'
import { isntNull } from '@blackglory/prelude'

export class PointerView<View extends IHash> implements IHash
                                                      , IReference
                                                      , IReadable<number | null>
                                                      , IWritable<number | null> {
  static readonly byteLength = Uint32Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private viewConstruct: new (buffer: ArrayBufferLike, offset: number) => View
  ) {
    this.view = new DataView(buffer)
  }

  hash(hasher: IHasher): void {
    const view = this.deref()
    if (view) {
      view.hash(hasher)
    } else {
      hasher.write([0])
    }
  }

  set(value: number | null): void {
    this.view.setUint32(this.byteOffset, value ?? 0)
  }

  get(): number | null {
    const pointer = this.view.getUint32(this.byteOffset)
    return pointer === 0
         ? null
         : pointer
  }

  deref(): View | null {
    const value = this.get()
    return isntNull(value)
         ? new this.viewConstruct(this.view.buffer, value)
         : null
  }
}
