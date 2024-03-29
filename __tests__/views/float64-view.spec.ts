import { Float64View } from '@views/float64-view.js'
import { float64ToBuffer } from '@test/utils.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { BaseView } from '@views/base-view.js'
import { float64 } from '@literals/float64-literal.js'

describe('Float64View', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new Float64View(buffer, 0)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('byteLength', () => {
    const result = Float64View.byteLength

    expect(result).toBe(Float64Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Float64View(buffer, byteOffset)

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
    const view = new Float64View(allocator.buffer, byteOffset)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, Float64View.byteLength)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 3.14
    const dataView = new DataView(buffer)
    dataView.setFloat64(byteOffset, value)
    const doubleView = new Float64View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toStrictEqual(float64(3.14))
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = float64(3.14)
    const doubleView = new Float64View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getFloat64(byteOffset)).toBe(3.14)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = float64(3.14)
    const view = new Float64View(buffer, byteOffset)
    view.set(value)
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(float64ToBuffer(3.14))
  })
})
