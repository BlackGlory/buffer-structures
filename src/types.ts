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

export interface IDestroyable {
  destroy(): void
}

export interface IReferenceCounted<T> extends IDestroyable {
  clone(): T
}

export interface ICopy<T> {
  copy(): T
}

export interface IAllocator {
  readonly buffer: ArrayBufferLike

  allocate(size: number): number
  free(offset: number): void
}
