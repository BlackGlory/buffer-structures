import { Uint8View } from '@views/uint8-view.js'
import { uint8ToBuffer } from '@test/utils.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { BaseView } from '@views/base-view.js'
import { uint8 } from '@literals/uint8-literal.js'

describe('Uint8View', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new Uint8View(buffer, 0)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('byteLength', () => {
    const result = Uint8View.byteLength

    expect(result).toBe(Uint8Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Uint8View(buffer, byteOffset)

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
    const view = new Uint8View(allocator.buffer, byteOffset)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, Uint8View.byteLength)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 255
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, value)
    const doubleView = new Uint8View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toStrictEqual(uint8(value))
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = uint8(255)
    const doubleView = new Uint8View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getUint8(byteOffset)).toBe(255)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = uint8(255)
    const view = new Uint8View(buffer, byteOffset)
    view.set(value)
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(uint8ToBuffer(255))
  })
})
