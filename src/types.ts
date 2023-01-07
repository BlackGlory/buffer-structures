export interface IHasher {
  write(bytes: ArrayLike<number> | ArrayBufferLike): void
}

export interface IAllocator {
  readonly buffer: ArrayBufferLike

  allocate(size: number): number
  free(offset: number): void
}

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
  free(allocator: IAllocator): void
}

export interface IClone<T> {
  clone(): T
}

export interface ICopy<T> {
  copy(): T
}
