import { IHasher } from './types'
import { Xxh32 } from '@node-rs/xxhash'
import { NULL } from '@utils/null'

// 出于性能原因, 共享实例.
const hasher = new Xxh32(0)

/**
 * **由于性能优化, 不能同时存在多个Hasher实例, 否则会导致结果出错.**
 */
export class Hasher implements IHasher {
  constructor() {
    hasher.reset()
  }

  write(bytes: ArrayBufferLike): void {
    const buffer = Buffer.from(bytes)
    hasher.update(buffer)

    // 将0作为分隔符, 防止因前后数据串连起来恰好一致导致的冲突.
    hasher.update(Buffer.from(NULL))
  }

  finish(): number {
    return hasher.digest()
  }
}
