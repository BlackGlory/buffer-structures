import { Uint16View } from '@views/uint16-view.js'
import { uint16ToBuffer } from '@test/utils.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { BaseView } from '@views/base-view.js'
import { uint16 } from '@literals/uint16-literal.js'

describe('Uint16View', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new Uint16View(buffer, 0)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('byteLength', () => {
    const result = Uint16View.byteLength

    expect(result).toBe(Uint16Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Uint16View(buffer, byteOffset)

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
    const view = new Uint16View(allocator.buffer, byteOffset)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, Uint16View.byteLength)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 10000
    const dataView = new DataView(buffer)
    dataView.setUint16(byteOffset, value)
    const doubleView = new Uint16View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toStrictEqual(uint16(value))
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = uint16(10000)
    const doubleView = new Uint16View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getUint16(byteOffset)).toBe(10000)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = uint16(10000)
    const view = new Uint16View(buffer, byteOffset)
    view.set(value)
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(uint16ToBuffer(10000))
  })
})
