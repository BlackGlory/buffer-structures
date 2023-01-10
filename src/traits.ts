import { IAllocator, IHasher } from './interfaces'

export interface ISized {
  readonly byteLength: number
}

export interface IReference {
  readonly byteOffset: number
}

export interface IReadable<T> {
  get(): T
}

export interface IWritable<T> {
  set(value: T): void
}

export interface IReadableWritable<T> extends IReadable<T>, IWritable<T> {}

/**
 * 一个Hash对象应该满足下列条件:
 * - 类型相同, 但具有不同数据的对象, 其哈希值不同.
 * - 类型不同, 但具有相同数据的对象, 其哈希值不同.
 */
export interface IHash {
  hash(hasher: IHasher): void
}

export interface IDestroy {
  destroy(): void
}

export interface IFree {
  /**
   * 释放该视图相关的数据.
   * 
   * 如果视图拥有其他数据的所有权, 则调用该函数时应能实现级联释放.
   */
  free(allocator: IAllocator): void
}

export interface IOwnershipPointer {
  /**
   * 释放指向的数据.
   */
  freePointed(allocator: IAllocator): void
}

export interface IClone<T> {
  clone(): T
}

export interface ICopy<T> {
  copy(): T
}
