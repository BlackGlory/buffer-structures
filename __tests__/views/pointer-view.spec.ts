import { PointerView } from '@views/pointer-view'
import { Uint8View } from '@views/uint8-view'
import { uint8ToBuffer } from '@test/utils'
import { IAllocator, IHasher } from '@src/interfaces'
import { BaseView } from '@views/base-view'
import { uint8 } from '@literals/uint8-literal'
import { uint32 } from '@literals/uint32-literal'

describe('PointerView', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new PointerView(buffer, 0, Uint8View)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('byteLength', () => {
    const result = PointerView.byteLength

    expect(result).toBe(Uint32Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new PointerView(buffer, byteOffset, Uint8View)

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
    const view = new PointerView(allocator.buffer, byteOffset, Uint8View)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, PointerView.byteLength)
  })

  describe('get', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 0
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, value)
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.get()

      expect(result).toBe(null)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 1000000
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, value)
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.get()

      expect(result).toStrictEqual(uint32(value))
    })
  })

  describe('set', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = null
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      pointerView.set(value)

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(0)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = uint32(1000000)
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      pointerView.set(value)

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(1000000)
    })
  })

  describe('deref', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 0
      const dataView = new DataView(buffer)
      dataView.setUint8(value, 100)
      dataView.setUint32(byteOffset, value)
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.deref()

      expect(result).toBe(null)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 50
      const dataView = new DataView(buffer)
      dataView.setUint8(value, 100)
      dataView.setUint32(byteOffset, value)
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.deref()

      expect(result).toBeInstanceOf(Uint8View)
      expect(result!.byteOffset).toBe(value)
      expect(result!.get()).toStrictEqual(uint8(100))
    })
  })

  describe('hash', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const pointerView = new PointerView(buffer, 50, Uint8View)
      pointerView.set(uint32(1))
      const hasher = {
        write: jest.fn()
      } satisfies IHasher

      pointerView.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).toBeCalledWith(uint8ToBuffer(0))
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const dataView = new Uint8View(buffer, 1)
      dataView.set(uint8(10))
      const pointerView = new PointerView(buffer, 50, Uint8View)
      pointerView.set(uint32(1))
      const hasher = {
        write: jest.fn()
      } satisfies IHasher

      pointerView.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).toBeCalledWith(uint8ToBuffer(10))
    })
  })
})
