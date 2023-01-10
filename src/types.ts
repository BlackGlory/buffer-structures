import { IReadableWritable } from './traits'

export type UnpackedReadableWritable<T extends IReadableWritable<unknown>> =
  T extends IReadableWritable<infer U>
  ? U
  : never

export type PickReadableWritable<T extends IReadableWritable<unknown>> =
  IReadableWritable<UnpackedReadableWritable<T>>
