import { ReferenceCountedOwnershipPointerView } from '@views/reference-counted-ownership-pointer-view.js'
import { PointerView } from '@views/pointer-view.js'
import { Uint8View } from '@views/uint8-view.js'
import { Uint32View } from '@views/uint32-view.js'
import { uint8ToBuffer } from '@test/utils.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { BaseView } from '@views/base-view.js'
import { NULL } from '@src/null.js'
import { uint8 } from '@literals/uint8-literal.js'
import { uint32 } from '@literals/uint32-literal.js'

describe('ReferenceCountedOwnershipPointerView', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new ReferenceCountedOwnershipPointerView(buffer, 0, Uint8View)

    expect(result).toBeInstanceOf(BaseView)
  })

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
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const byteOffset = 1
      const pointerView = new ReferenceCountedOwnershipPointerView(
        allocator.buffer
      , byteOffset
      , Uint8View
      )
      pointerView.setCount(uint32(1))

      pointerView.free(allocator)

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(
        byteOffset
      , ReferenceCountedOwnershipPointerView.byteLength
      )
    })

    test('value: non-null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const uint8View = new Uint8View(allocator.buffer, 1)
      uint8View.set(uint8(10))
      const pointerView = new ReferenceCountedOwnershipPointerView(
        allocator.buffer
      , 50
      , Uint8View
      )
      pointerView.set([uint32(1), uint32(1)])

      pointerView.free(allocator)

      expect(allocator.free).toBeCalledTimes(2)
      expect(allocator.free).nthCalledWith(1, 1, Uint8View.byteLength)
      expect(allocator.free).nthCalledWith(2, 50, ReferenceCountedOwnershipPointerView.byteLength)
    })
  })

  describe('freePointed', () => {
    test('value: null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const byteOffset = 1
      const pointerView = new ReferenceCountedOwnershipPointerView(
        allocator.buffer
      , byteOffset
      , Uint8View
      )
      pointerView.setCount(uint32(1))

      pointerView.freePointed(allocator)

      expect(allocator.free).not.toBeCalled()
    })

    test('value: non-null', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const uint8View = new Uint8View(allocator.buffer, 1)
      uint8View.set(uint8(10))
      const pointerView = new ReferenceCountedOwnershipPointerView(
        allocator.buffer
      , 50
      , Uint8View
      )
      pointerView.set([uint32(1), uint32(10)])

      pointerView.freePointed(allocator)

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(10, Uint8View.byteLength)
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

      expect(result).toStrictEqual([uint32(count), null])
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

      expect(result).toStrictEqual([uint32(count), uint32(value)])
    })
  })

  describe('set', () => {
    test('value: null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = uint32(1)
      const value = null
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      pointerView.set([count, value])

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(1)
      expect(dataView.getUint32(byteOffset + Uint32View.byteLength)).toBe(0)
    })

    test('value: non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = uint32(1)
      const value = uint32(1000000)
      const pointerView = new ReferenceCountedOwnershipPointerView(
        buffer
      , byteOffset
      , Uint8View
      )

      pointerView.set([count, value])

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(1)
      expect(dataView.getUint32(byteOffset + Uint32View.byteLength)).toBe(1000000)
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

    expect(result).toStrictEqual(uint32(count))
  })

  test('setCount', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const count = uint32(1)
    const pointerView = new ReferenceCountedOwnershipPointerView(
      buffer
    , byteOffset
    , Uint8View
    )

    pointerView.setCount(count)

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(1)
  })

  test('incrementCount', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const count = uint32(1)
    const pointerView = new ReferenceCountedOwnershipPointerView(
      buffer
    , byteOffset
    , Uint8View
    )
    pointerView.setCount(count)

    pointerView.incrementCount(uint32(1))

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
    pointerView.setCount(uint32(count))

    pointerView.decrementCount(uint32(1))

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

      expect(result).toStrictEqual(uint32(value))
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

      pointerView.setValue(uint32(value))

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
      expect(result!.get()).toStrictEqual(uint8(100))
    })
  })

  describe('hash', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const pointerView = new ReferenceCountedOwnershipPointerView(buffer, 50, Uint8View)
      pointerView.set([uint32(1), null])
      const hasher = {
        write: vi.fn()
      } satisfies IHasher

      pointerView.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).toBeCalledWith(NULL)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const dataView = new Uint8View(buffer, 1)
      dataView.set(uint8(10))
      const pointerView = new ReferenceCountedOwnershipPointerView(buffer, 50, Uint8View)
      pointerView.set([uint32(1), uint32(1)])
      const hasher = {
        write: vi.fn()
      } satisfies IHasher

      pointerView.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).toBeCalledWith(uint8ToBuffer(10))
    })
  })
})
