import { ReferenceCountedOwnershipPointerView } from '@views/reference-counted-ownership-pointer-view'
import { PointerView } from '@views/pointer-view'
import { Uint8View } from '@views/uint8-view'
import { Uint32View } from '@views/uint32-view'
import { uint8ToBuffer } from '@test/utils'
import { IAllocator, IHasher } from '@src/types'

describe('ReferenceCountedOwnershipPointerView', () => {
  test('byteLength', () => {
    const result = ReferenceCountedOwnershipPointerView.byteLength

    expect(result).toBe(Uint32View.byteLength + PointerView.byteLength)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const pointerView = new ReferenceCountedOwnershipPointerView(
      buffer
    , byteOffset
    , Uint8View
    )

    const result = pointerView.byteOffset

    expect(result).toBe(byteOffset)
  })

  describe('free', () => {
    test('value: null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const byteOffset = 1
      const pointerView = new ReferenceCountedOwnershipPointerView(
        allocator.buffer
      , byteOffset
      , Uint8View
      )
      pointerView.setCount(1)

      pointerView.free(allocator)

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(byteOffset)
    })

    test('value: non-null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const uint8View = new Uint8View(allocator.buffer, 1)
      uint8View.set(10)
      const pointerView = new ReferenceCountedOwnershipPointerView(
        allocator.buffer
      , 50
      , Uint8View
      )
      pointerView.set({
        count: 1
      , value: 1
      })

      pointerView.free(allocator)

      expect(allocator.free).toBeCalledTimes(2)
      expect(allocator.free).nthCalledWith(1, 1)
      expect(allocator.free).nthCalledWith(2, 50)
    })
  })

  describe('freePointed', () => {
    test('value: null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const byteOffset = 1
      const pointerView = new ReferenceCountedOwnershipPointerView(
        allocator.buffer
      , byteOffset
      , Uint8View
      )
      pointerView.setCount(1)

      pointerView.freePointed(allocator)

      expect(allocator.free).not.toBeCalled()
    })

    test('value: non-null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const uint8View = new Uint8View(allocator.buffer, 1)
      uint8View.set(10)
      const pointerView = new ReferenceCountedOwnershipPointerView(
        allocator.buffer
      , 50
      , Uint8View
      )
      pointerView.set({
        count: 1
      , value: 10
      })

      pointerView.freePointed(allocator)

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(10)
    })
  })

  describe('get', () => {
    test('value: null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = 0
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, count)
      dataView.setUint32(byteOffset + Uint32View.byteLength, value)
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      const result = pointerView.get()

      expect(result).toStrictEqual({
        count
      , value: null
      })
    })

    test('value: non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = 1000000
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, count)
      dataView.setUint32(byteOffset + Uint32View.byteLength, value)
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      const result = pointerView.get()

      expect(result).toStrictEqual({ count, value })
    })
  })

  describe('set', () => {
    test('value: null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = null
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      pointerView.set({ count, value })

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(count)
      expect(dataView.getUint32(byteOffset + Uint32View.byteLength)).toBe(0)
    })

    test('value: non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = 1000000
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      pointerView.set({ count, value })

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(count)
      expect(dataView.getUint32(byteOffset + Uint32View.byteLength)).toBe(value)
    })
  })

  test('getCount', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const count = 1
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, count)
    const pointerView = new ReferenceCountedOwnershipPointerView(
      buffer
    , byteOffset
    , Uint8View
    )

    const result = pointerView.getCount()

    expect(result).toBe(count)
  })

  test('setCount', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const count = 1
    const pointerView = new ReferenceCountedOwnershipPointerView(
      buffer
    , byteOffset
    , Uint8View
    )

    pointerView.setCount(count)

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(count)
  })

  test('incrementCount', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const count = 1
    const pointerView = new ReferenceCountedOwnershipPointerView(
      buffer
    , byteOffset
    , Uint8View
    )
    pointerView.setCount(count)

    pointerView.incrementCount(1)

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(2)
  })

  test('decrementCount', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const count = 1
    const pointerView = new ReferenceCountedOwnershipPointerView(
      buffer
    , byteOffset
    , Uint8View
    )
    pointerView.setCount(count)

    pointerView.decrementCount(1)

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(0)
  })

  describe('getValue', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 0
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset + Uint32View.byteLength, value)
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      const result = pointerView.getValue()

      expect(result).toBe(null)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 1000000
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset + Uint32View.byteLength, value)
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      const result = pointerView.getValue()

      expect(result).toBe(value)
    })
  })

  describe('setValue', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = null
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      pointerView.setValue(value)

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset + Uint32View.byteLength)).toBe(0)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 1000000
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      pointerView.setValue(value)

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset + Uint32View.byteLength)).toBe(value)
    })
  })

  describe('deref', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = 0
      const dataView = new DataView(buffer)
      dataView.setUint8(value, 100)
      dataView.setUint32(byteOffset, count)
      dataView.setUint32(byteOffset + Uint32View.byteLength, value)
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      const result = pointerView.deref()

      expect(result).toBe(null)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = 50
      const dataView = new DataView(buffer)
      dataView.setUint8(value, 100)
      dataView.setUint32(byteOffset, count)
      dataView.setUint32(byteOffset + Uint32View.byteLength, value)
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      const result = pointerView.deref()

      expect(result).toBeInstanceOf(Uint8View)
      expect(result!.byteOffset).toBe(value)
      expect(result!.get()).toBe(100)
    })
  })

  describe('hash', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const pointerView = new ReferenceCountedOwnershipPointerView(buffer, 50, Uint8View)
      pointerView.set({ count: 1, value: null })
      const hasher = {
        write: jest.fn()
      } satisfies IHasher

      pointerView.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).toBeCalledWith([0])
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const dataView = new Uint8View(buffer, 1)
      dataView.set(10)
      const pointerView = new ReferenceCountedOwnershipPointerView(buffer, 50, Uint8View)
      pointerView.set({ count: 1, value: 1 })
      const hasher = {
        write: jest.fn()
      } satisfies IHasher

      pointerView.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).toBeCalledWith(uint8ToBuffer(10))
    })
  })
})
