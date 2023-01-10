import { Uint32View } from '@views/uint32-view'
import { uint32ToBuffer } from '@test/utils'
import { IAllocator, IHasher } from '@src/interfaces'
import { BaseView } from '@views/base-view'

describe('Uint32View', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new Uint32View(buffer, 0)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('byteLength', () => {
    const result = Uint32View.byteLength

    expect(result).toBe(Uint32Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Uint32View(buffer, byteOffset)

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
    const view = new Uint32View(allocator.buffer, byteOffset)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, Uint32View.byteLength)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1000000
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, value)
    const doubleView = new Uint32View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1000000
    const doubleView = new Uint32View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(value)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1000000
    const view = new Uint32View(buffer, byteOffset)
    view.set(value)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(uint32ToBuffer(1000000))
  })
})
