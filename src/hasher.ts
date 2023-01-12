import { IHasher } from '@src/interfaces'
import { NULL } from '@utils/null'
import { h32 } from 'xxhashjs'

// 一个令人惊讶的事实是, 在JIT的帮助下,
// `xxhashjs`这个纯JavaScript实现比本机插件`@node-rs/xxhash`要快.
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
