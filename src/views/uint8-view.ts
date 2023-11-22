import { IAllocator, IHasher } from '@src/interfaces.js'
import { IHash, IReference, IReadableWritable, IFree } from '@src/traits.js'
import { getSlice } from './utils.js'
import { BaseView } from '@views/base-view.js'
import { uint8, Uint8Literal } from '@literals/uint8-literal.js'

export class Uint8View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Uint8Literal>
         , IFree {
  static readonly byteLength: number = Uint8Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, Uint8View.byteLength)
  }

  get(): Uint8Literal {
    return uint8(this.view.getUint8(this.byteOffset))
  }

  set(value: Uint8Literal): void {
    this.view.setUint8(this.byteOffset, value.get())
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Uint8View.byteLength)

    hasher.write(slice)
  }
}
