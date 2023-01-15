import { IHash, IReference, IReadableWritable } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { getSlice } from './utils'
import { BaseView } from '@views/base-view'
import { int32, Int32Literal } from '@literals/int32-literal'

export class Int32View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Int32Literal> {
  static readonly byteLength: number = Int32Array.BYTES_PER_ELEMENT

  private view: DataView

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, Int32View.byteLength)
  }

  get(): Int32Literal {
    return int32(this.view.getInt32(this.byteOffset))
  }

  set(value: Int32Literal): void {
    this.view.setInt32(this.byteOffset, value.get())
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(this.view.buffer, this.byteOffset, Int32View.byteLength)

    hasher.write(slice)
  }
}
