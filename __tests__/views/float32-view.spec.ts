import { Float32View } from '@views/float32-view'
import { float32ToBuffer } from '@test/utils'
import { IAllocator, IHasher } from '@src/interfaces'
import { BaseView } from '@views/base-view'

describe('Float32View', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new Float32View(buffer, 0)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('byteLength', () => {
    const result = Float32View.byteLength

    expect(result).toBe(Float32Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Float32View(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('free', () => {
    const allocator = {
      buffer: new ArrayBuffer(100)
    , allocate: jest.fn()
    , free: jest.fn()
    } satisfies IAllocator
    const byteOffset = 1
    const view = new Float32View(allocator.buffer, byteOffset)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, Float32View.byteLength)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -3
    const dataView = new DataView(buffer)
    dataView.setFloat32(byteOffset, value)
    const doubleView = new Float32View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -3
    const doubleView = new Float32View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getFloat32(byteOffset)).toBe(value)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -3
    const view = new Float32View(buffer, byteOffset)
    view.set(value)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(float32ToBuffer(-3))
  })
})
