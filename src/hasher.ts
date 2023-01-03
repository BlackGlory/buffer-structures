import { IHasher } from './types'
import { Xxh32 } from '@node-rs/xxhash'

export class Hasher implements IHasher {
  hasher = new Xxh32(0)

  write(bytes: ArrayLike<number> | ArrayBufferLike): void {
    const typedArray = new Uint8Array(bytes)
    const buffer = Buffer.from(typedArray)
    this.hasher.update(buffer)

    // 将0作为分隔符, 防止因前后数据串连起来恰好一致导致的冲突.
    this.hasher.update(Buffer.from([0]))
  }

  finish(): number {
    return this.hasher.digest()
  }
}
