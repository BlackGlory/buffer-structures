import { OwnershipPointerView } from '@views/ownership-pointer-view.js'
import { PointerView } from '@views/pointer-view.js'
import { Uint8View } from '@views/uint8-view.js'
import { uint8ToBuffer } from '@test/utils.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { BaseView } from '@views/base-view.js'
import { uint8 } from '@literals/uint8-literal.js'
import { uint32 } from '@literals/uint32-literal.js'

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
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const pointerView = new OwnershipPointerView(allocator.buffer, 50, Uint8View)
      pointerView.set(null)

      pointerView.free(allocator)

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(50, OwnershipPointerView.byteLength)
    })

    test('non-null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const dataView = new Uint8View(allocator.buffer, 1)
      dataView.set(uint8(10))
      const pointerView = new OwnershipPointerView(allocator.buffer, 50, Uint8View)
      pointerView.set(uint32(1))

      pointerView.free(allocator)

      expect(allocator.free).toBeCalledTimes(2)
      expect(allocator.free).nthCalledWith(1, 1, Uint8View.byteLength)
      expect(allocator.free).nthCalledWith(2, 50, OwnershipPointerView.byteLength)
    })
  })

  describe('freePointed', () => {
    test('null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const pointerView = new OwnershipPointerView(allocator.buffer, 50, Uint8View)
      pointerView.set(null)

      pointerView.freePointed(allocator)

      expect(allocator.free).not.toBeCalled()
    })

    test('non-null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const dataView = new Uint8View(allocator.buffer, 1)
      dataView.set(uint8(10))
      const pointerView = new OwnershipPointerView(allocator.buffer, 50, Uint8View)
      pointerView.set(uint32(10))

      pointerView.freePointed(allocator)

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(10, Uint8View.byteLength)
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

      expect(result).toStrictEqual(uint32(value))
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
      const value = uint32(1000000)
      const pointerView = new OwnershipPointerView(buffer, byteOffset, Uint8View)

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
      expect(result!.get()).toStrictEqual(uint8(100))
    })
  })

  describe('hash', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const dataView = new Uint8View(buffer, 1)
      dataView.set(uint8(10))
      const pointerView = new OwnershipPointerView(buffer, 50, Uint8View)
      pointerView.set(uint32(1))
      const hasher = {
        write: vi.fn()
      } satisfies IHasher

      pointerView.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).toBeCalledWith(uint8ToBuffer(10))
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const pointerView = new OwnershipPointerView(buffer, 50, Uint8View)
      pointerView.set(uint32(1))
      const hasher = {
        write: vi.fn()
      } satisfies IHasher

      pointerView.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).toBeCalledWith(uint8ToBuffer(0))
    })
  })
})
