import { IReadableWritable } from './traits'

export type UnpackedReadableWritable<T extends IReadableWritable<unknown>> =
  T extends IReadableWritable<infer U>
  ? U
  : never
