import { IHash, IReference, IReadableWritable, IFree } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { getSlice } from './utils.js'
import { BaseView } from '@views/base-view.js'
import { uint32, Uint32Literal } from '@literals/uint32-literal.js'

export class Uint32View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Uint32Literal>
         , IFree {
  static readonly byteLength: number = Uint32Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, Uint32View.byteLength)
  }

  get(): Uint32Literal {
    return uint32(this.view.getUint32(this.byteOffset))
  }

  set(value: Uint32Literal): void {
    this.view.setUint32(this.byteOffset, value.get())
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Uint32View.byteLength)

    hasher.write(slice)
  }
}
