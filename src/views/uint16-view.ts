import { IHash, IReference, IReadableWritable, IFree } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { getSlice } from './utils.js'
import { BaseView } from '@views/base-view.js'
import { uint16, Uint16Literal } from '@literals/uint16-literal.js'

export class Uint16View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Uint16Literal>
         , IFree {
  static readonly byteLength: number = Uint16Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, Uint16View.byteLength)
  }

  get(): Uint16Literal {
    return uint16(this.view.getUint16(this.byteOffset))
  }

  set(value: Uint16Literal): void {
    this.view.setUint16(this.byteOffset, value.get())
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Uint16View.byteLength)

    hasher.write(slice)
  }
}
