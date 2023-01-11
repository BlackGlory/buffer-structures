import { IHasher } from '@src/interfaces'
import { NULL } from '@utils/null'
import { h32 } from 'xxhashjs'

// 当前采用纯JavaScript实现, 等待`@node-rs/xxhash`解决内存泄漏问题:
// https://github.com/napi-rs/node-rs/issues/655
export class Hasher implements IHasher {
  private hasher = h32(0)

  write(bytes: ArrayBufferLike): void {
    this.hasher.update(bytes)
    this.hasher.update(NULL)
  }

  finish(): number {
    return this.hasher.digest().toNumber()
  }
}
