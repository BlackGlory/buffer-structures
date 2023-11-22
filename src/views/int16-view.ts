import { IHash, IReference, IReadableWritable, IFree } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { getSlice } from './utils.js'
import { BaseView } from '@views/base-view.js'
import { int16, Int16Literal } from '@literals/int16-literal.js'

export class Int16View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Int16Literal>
         , IFree {
  static readonly byteLength: number = Int16Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, Int16View.byteLength)
  }

  get(): Int16Literal {
    return int16(this.view.getInt16(this.byteOffset))
  }

  set(value: Int16Literal): void {
    this.view.setInt16(this.byteOffset, value.get())
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Int16View.byteLength)

    hasher.write(slice)
  }
}
