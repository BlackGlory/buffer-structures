import { Int8View } from '@views/int8-view.js'
import { int8ToBuffer } from '@test/utils.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { BaseView } from '@views/base-view.js'
import { int8 } from '@literals/int8-literal.js'

describe('Int8View', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new Int8View(buffer, 0)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('byteLength', () => {
    const result = Int8View.byteLength

    expect(result).toBe(Int8Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Int8View(buffer, byteOffset)

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
    const view = new Int8View(allocator.buffer, byteOffset)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, Int8View.byteLength)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -127
    const dataView = new DataView(buffer)
    dataView.setInt8(byteOffset, value)
    const doubleView = new Int8View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toStrictEqual(int8(value))
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -127
    const doubleView = new Int8View(buffer, byteOffset)

    doubleView.set(int8(value))

    const dataView = new DataView(buffer)
    expect(dataView.getInt8(byteOffset)).toBe(value)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -127
    const view = new Int8View(buffer, byteOffset)
    view.set(int8(value))
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(int8ToBuffer(-127))
  })
})
