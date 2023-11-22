import { IHasher } from '@src/interfaces.js'
import { NULL } from '@src/null.js'
import { h32 } from 'xxhashjs'

// 在本项目的基准测试里,
// 基于纯JavaScript实现xxhashjs的Hasher比基于本机插件@node-rs/xxhash的Hasher要快得多.
// 这与直觉以及单独测试这两个库的结果不符, 猜测可能是JIT优化巧合地影响了基准测试.
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
