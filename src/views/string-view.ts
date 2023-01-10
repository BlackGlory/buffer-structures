import { IHash, ISized, IReference, IReadableWritable, IFree } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { Uint32View } from '@views/uint32-view'
import { getSlice } from '@utils/get-slice'
import { BaseView } from '@views/base-view'

export class StringView
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<string>
         , ISized
         , IFree {
  static getByteLength(value: string): number {
    const encoder = new TextEncoder()
    const valueLength = encoder.encode(value).byteLength
    return Uint32View.byteLength + valueLength
  }

  private lengthView: Uint32View
  private valueView: DataView

  get byteLength(): number {
    const byteLenght = this.valueView.getUint32(this.byteOffset)
    return Uint32View.byteLength + byteLenght
  }

  constructor(buffer: ArrayBufferLike, public readonly byteOffset: number) {
    super()

    this.lengthView = new Uint32View(buffer, byteOffset)
    this.valueView = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, this.byteLength)
  }

  get(): string {
    const byteLength = this.lengthView.get()

    const text = this.valueView.buffer.slice(
      this.byteOffset + Uint32View.byteLength
    , this.byteOffset + Uint32View.byteLength + byteLength
    )

    const decoder = new TextDecoder()
    return decoder.decode(text)
  }

  /**
   * 注意, 由于字符串是变长的, **该操作有可能错误地覆盖掉其他数据**.
   */
  set(value: string): void {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(value)

    this.lengthView.set(bytes.byteLength)

    for (let i = 0; i < bytes.length; i++) {
      this.valueView.setUint8(
        this.byteOffset + Uint32View.byteLength + i
      , bytes[i]
      )
    }
  }

  hash(hasher: IHasher): void {
    const slice = getSlice(
      this.valueView.buffer
    , this.byteOffset + Uint32View.byteLength
    , this.lengthView.get()
    )

    hasher.write(slice)
  }
}
