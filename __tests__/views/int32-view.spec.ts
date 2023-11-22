import { Int32View } from '@views/int32-view.js'
import { int32ToBuffer } from '@test/utils.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { BaseView } from '@views/base-view.js'
import { int32 } from '@literals/int32-literal.js'

describe('Int32View', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new Int32View(buffer, 0)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('byteLength', () => {
    const result = Int32View.byteLength

    expect(result).toBe(Int32Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Int32View(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('free', () => {
    const allocator = {
      buffer: new ArrayBuffer(100)
    , allocate: vi.fn()
    , free: vi.fn()
    } satisfies IAllocator
    const byteOffset = 1
    const view = new Int32View(allocator.buffer, byteOffset)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, Int32View.byteLength)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -1000000
    const dataView = new DataView(buffer)
    dataView.setInt32(byteOffset, value)
    const doubleView = new Int32View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toStrictEqual(int32(value))
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = int32(-1000000)
    const doubleView = new Int32View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getInt32(byteOffset)).toBe(-1000000)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = int32(-1000000)
    const view = new Int32View(buffer, byteOffset)
    view.set(value)
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(int32ToBuffer(-1000000))
  })
})
