export interface IHasher {
  write(bytes: ArrayBufferLike): void
}

export interface IAllocator {
  readonly buffer: ArrayBufferLike

  allocate(byteLength: number): number
  free(byteOffset: number, byteLength: number): void
}
