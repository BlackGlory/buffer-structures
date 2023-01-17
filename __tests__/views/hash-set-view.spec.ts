import { HashSetView } from '@views/hash-set-view'
import { Uint8View } from '@views/uint8-view'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { HashBucketsView } from '@views/hash-buckets-view'
import { BaseView } from '@views/base-view'
import { uint32 } from '@literals/uint32-literal'
import { IAllocator } from '@src/interfaces'
import { Allocator } from '@src/allocator'
import { uint8 } from '@literals/uint8-literal'
import { toArray } from '@blackglory/prelude'

describe('HashSetView', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2

    const result = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })

    expect(result).toBeInstanceOf(BaseView)
  })

  test('byteLength', () => {
    const result = HashSetView.byteLength

    expect(result).toBe(Uint32View.byteLength + OwnershipPointerView.byteLength)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('loadFactor', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })

    const result = view.loadFactor

    expect(result).toBe(loadFactor)
  })

  test('growthFactor', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })

    const result = view.growthFactor

    expect(result).toBe(growthFactor)
  })

  test('capacity', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })
    view.setBuckets(uint32(50))

    const result = view.capacity

    expect(result).toBe(capacity)
  })

  test('free', () => {
    const allocator = {
      buffer: new ArrayBuffer(100)
    , allocate: jest.fn()
    , free: jest.fn()
    } satisfies IAllocator
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(allocator.buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, HashSetView.byteLength)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })

    view.set([uint32(10), uint32(50)])

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(10)
    expect(dataView.getUint32(byteOffset + Uint32View.byteLength)).toBe(50)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, 10)
    dataView.setUint32(byteOffset + Uint32View.byteLength, 50)

    const result = view.get()

    expect(result).toStrictEqual([
      uint32(10)
    , uint32(50)
    ])
  })

  test('setSize', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })

    view.setSize(uint32(10))

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(10)
  })

  test('getSize', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, 10)

    const result = view.getSize()

    expect(result).toBe(10)
  })

  test('setBuckets', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })

    view.setBuckets(uint32(50))

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset + Uint32View.byteLength)).toBe(50)
  })

  test('derefBuckets', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1
    const loadFactor = 1
    const growthFactor = 2
    const view = new HashSetView(buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })
    view.setBuckets(uint32(50))

    const buckets = view.derefBuckets()

    expect(buckets).toBeInstanceOf(HashBucketsView)
    expect(buckets!.byteOffset).toBe(50)
    expect(buckets!.capacity).toBe(capacity)
  })

  test('itemValues', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 2
    const loadFactor = 0.75
    const growthFactor = 2
    const byteOffset = allocator.allocate(HashSetView.byteLength)
    const view = new HashSetView(allocator.buffer, byteOffset, Uint8View, {
      capacity
    , growthFactor
    , loadFactor
    })
    const bucketsByteOffset = allocator.allocate(
      HashBucketsView.getByteLength(Uint8View, capacity)
    )
    view.setBuckets(uint32(bucketsByteOffset))
    view.addItem(allocator, uint8(10))
    view.addItem(allocator, uint8(20))

    const iter = view.itemValues()
    const result = toArray(iter).map(x => x.get())

    expect(result).toStrictEqual([uint8(20), uint8(10)])
  })

  describe('hasItem', () => {
    test('exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 2
      const loadFactor = 0.75
      const growthFactor = 2
      const byteOffset = allocator.allocate(HashSetView.byteLength)
      const view = new HashSetView(allocator.buffer, byteOffset, Uint8View, {
        capacity
      , growthFactor
      , loadFactor
      })
      const bucketsByteOffset = allocator.allocate(
        HashBucketsView.getByteLength(Uint8View, capacity)
      )
      view.setBuckets(uint32(bucketsByteOffset))
      view.addItem(allocator, uint8(10))

      const result = view.hasItem(uint8(10))

      expect(result).toBe(true)
    })

    test('does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 2
      const loadFactor = 0.75
      const growthFactor = 2
      const byteOffset = allocator.allocate(HashSetView.byteLength)
      const view = new HashSetView(allocator.buffer, byteOffset, Uint8View, {
        capacity
      , growthFactor
      , loadFactor
      })
      const bucketsByteOffset = allocator.allocate(
        HashBucketsView.getByteLength(Uint8View, capacity)
      )
      view.setBuckets(uint32(bucketsByteOffset))

      const result = view.hasItem(uint8(10))

      expect(result).toBe(false)
    })
  })

  describe('addItem', () => {
    test('added', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 2
      const loadFactor = 0.75
      const growthFactor = 2
      const byteOffset = allocator.allocate(HashSetView.byteLength)
      const view = new HashSetView(allocator.buffer, byteOffset, Uint8View, {
        capacity
      , growthFactor
      , loadFactor
      })
      const bucketsByteOffset = allocator.allocate(
        HashBucketsView.getByteLength(Uint8View, capacity)
      )
      view.setBuckets(uint32(bucketsByteOffset))
      view.addItem(allocator, uint8(10))

      view.addItem(allocator, uint8(20))

      expect(view.getSize()).toBe(2)
      expect(view.capacity).toBe(4)
      expect(view.hasItem(uint8(10))).toBe(true)
      expect(view.hasItem(uint8(20))).toBe(true)
    })

    test('updated', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 2
      const loadFactor = 0.75
      const growthFactor = 2
      const byteOffset = allocator.allocate(HashSetView.byteLength)
      const view = new HashSetView(allocator.buffer, byteOffset, Uint8View, {
        capacity
      , growthFactor
      , loadFactor
      })
      const bucketsByteOffset = allocator.allocate(
        HashBucketsView.getByteLength(Uint8View, capacity)
      )
      view.setBuckets(uint32(bucketsByteOffset))
      view.addItem(allocator, uint8(10))

      view.addItem(allocator, uint8(10))

      expect(view.getSize()).toBe(1)
      expect(view.capacity).toBe(2)
      expect(view.hasItem(uint8(10))).toBe(true)
    })
  })

  describe('deleteItem', () => {
    test('deleted', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 2
      const loadFactor = 0.75
      const growthFactor = 2
      const byteOffset = allocator.allocate(HashSetView.byteLength)
      const view = new HashSetView(allocator.buffer, byteOffset, Uint8View, {
        capacity
      , growthFactor
      , loadFactor
      })
      const bucketsByteOffset = allocator.allocate(
        HashBucketsView.getByteLength(Uint8View, capacity)
      )
      view.setBuckets(uint32(bucketsByteOffset))
      view.addItem(allocator, uint8(10))

      view.deleteItem(allocator, uint8(10))

      expect(view.getSize()).toBe(0)
      expect(view.capacity).toBe(2)
      expect(view.hasItem(uint8(10))).toBe(false)
    })

    test('not deleted', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 2
      const loadFactor = 0.75
      const growthFactor = 2
      const byteOffset = allocator.allocate(HashSetView.byteLength)
      const view = new HashSetView(allocator.buffer, byteOffset, Uint8View, {
        capacity
      , growthFactor
      , loadFactor
      })
      const bucketsByteOffset = allocator.allocate(
        HashBucketsView.getByteLength(Uint8View, capacity)
      )
      view.setBuckets(uint32(bucketsByteOffset))
      view.addItem(allocator, uint8(10))

      view.deleteItem(allocator, uint8(20))

      expect(view.getSize()).toBe(1)
      expect(view.capacity).toBe(2)
      expect(view.hasItem(uint8(10))).toBe(true)
      expect(view.hasItem(uint8(20))).toBe(false)
    })
  })
})
