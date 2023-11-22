import { IHash, IReference, IReadableWritable, IFree } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { getSlice } from './utils.js'
import { BaseView } from '@views/base-view.js'
import { int8, Int8Literal } from '@literals/int8-literal.js'

export class Int8View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Int8Literal>
         , IFree {
  static readonly byteLength: number = Int8Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, Int8View.byteLength)
  }

  get(): Int8Literal {
    return int8(this.view.getInt8(this.byteOffset))
  }

  set(value: Int8Literal): void {
    this.view.setInt8(this.byteOffset, value.get())
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Int8View.byteLength)

    hasher.write(slice)
  }
}
