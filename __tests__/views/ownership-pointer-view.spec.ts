import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { PointerView } from '@views/pointer-view'
import { Uint8View } from '@views/uint8-view'
import { uint8ToBuffer } from '@test/utils'
import { IAllocator, IHasher } from '@src/types'
import { BaseView } from '@views/base-view'

describe('OwnershipPointerView', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new OwnershipPointerView(buffer, 0, Uint8View)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('byteLength', () => {
    const result = OwnershipPointerView.byteLength

    expect(result).toBe(PointerView.byteLength)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new OwnershipPointerView(buffer, byteOffset, Uint8View)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  describe('free', () => {
    test('null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const pointerView = new OwnershipPointerView(allocator.buffer, 50, Uint8View)
      pointerView.set(null)

      pointerView.free(allocator)

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(50)
    })

    test('non-null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const dataView = new Uint8View(allocator.buffer, 1)
      dataView.set(10)
      const pointerView = new OwnershipPointerView(allocator.buffer, 50, Uint8View)
      pointerView.set(1)

      pointerView.free(allocator)

      expect(allocator.free).toBeCalledTimes(2)
      expect(allocator.free).nthCalledWith(1, 1)
      expect(allocator.free).nthCalledWith(2, 50)
    })
  })

  describe('freePointed', () => {
    test('null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const pointerView = new OwnershipPointerView(allocator.buffer, 50, Uint8View)
      pointerView.set(null)

      pointerView.freePointed(allocator)

      expect(allocator.free).not.toBeCalled()
    })

    test('non-null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const dataView = new Uint8View(allocator.buffer, 1)
      dataView.set(10)
      const pointerView = new OwnershipPointerView(allocator.buffer, 50, Uint8View)
      pointerView.set(10)

      pointerView.freePointed(allocator)

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(10)
    })
  })

  describe('get', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 0
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, value)
      const pointerView = new OwnershipPointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.get()

      expect(result).toBe(null)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 1000000
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, value)
      const pointerView = new OwnershipPointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.get()

      expect(result).toBe(value)
    })
  })

  describe('set', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = null
      const pointerView = new OwnershipPointerView(buffer, byteOffset, Uint8View)

      pointerView.set(value)

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(0)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 1000000
      const pointerView = new OwnershipPointerView(buffer, byteOffset, Uint8View)

      pointerView.set(value)

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(value)
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
      const pointerView = new OwnershipPointerView(buffer, byteOffset, Uint8View)

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
      const pointerView = new OwnershipPointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.deref()

      expect(result).toBeInstanceOf(Uint8View)
      expect(result!.byteOffset).toBe(value)
      expect(result!.get()).toBe(100)
    })
  })

  describe('hash', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const dataView = new Uint8View(buffer, 1)
      dataView.set(10)
      const pointerView = new OwnershipPointerView(buffer, 50, Uint8View)
      pointerView.set(1)
      const hasher = {
        write: jest.fn()
      } satisfies IHasher

      pointerView.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).toBeCalledWith(uint8ToBuffer(10))
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const pointerView = new OwnershipPointerView(buffer, 50, Uint8View)
      pointerView.set(1)
      const hasher = {
        write: jest.fn()
      } satisfies IHasher

      pointerView.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).toBeCalledWith(uint8ToBuffer(0))
    })
  })
})
