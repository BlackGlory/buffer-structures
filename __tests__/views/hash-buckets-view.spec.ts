import { HashBucketsView } from '@views/hash-buckets-view'
import { Uint8View } from '@views/uint8-view'
import { Uint32View } from '@views/uint32-view'
import { BaseView } from '@views/base-view'
import { IAllocator } from '@src/interfaces'
import { uint8 } from '@literals/uint8-literal'
import { uint32 } from '@literals/uint32-literal'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { toArray } from 'iterable-operator'
import { Allocator } from '@src/allocator'

describe('HashBucketsView', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 1

    const result = new HashBucketsView(buffer, byteOffset, Uint8View, capacity)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('getByteLength', () => {
    const capacity = 10

    const result = HashBucketsView.getByteLength(Uint8View, capacity)

    expect(result).toBe(Uint32View.byteLength * capacity)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const capacity = 10
    const view = new HashBucketsView(buffer, byteOffset, Uint8View, capacity)

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
    const capacity = 10
    const view = new HashBucketsView(allocator.buffer, byteOffset, Uint8View, capacity)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, view.byteLength)
  })

  test('getByIndex', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new DataView(buffer)
    view.setUint32(byteOffset, 1)
    view.setUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT, 2)
    view.setUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2, 3)
    const arrayView = new HashBucketsView(buffer, byteOffset, Uint8View, 3)

    const result = arrayView.getByIndex(1)

    expect(result).toStrictEqual(uint32(2))
  })

  test('setByIndex', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new HashBucketsView(buffer, byteOffset, Uint8View, 3)

    view.setByIndex(1, uint32(2))

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT)).toBe(2)
  })

  test('getViewByIndex', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, 1)
    dataView.setUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT, 2)
    const view = new HashBucketsView(buffer, byteOffset, Uint8View, 2)

    const view1 = view.getViewByIndex(0)
    const view2 = view.getViewByIndex(1)

    expect(view1).toBeInstanceOf(OwnershipPointerView)
    expect(view1.byteOffset).toBe(byteOffset)
    expect(view2).toBeInstanceOf(OwnershipPointerView)
    expect(view2.byteOffset).toBe(byteOffset + Uint32Array.BYTES_PER_ELEMENT)
  })

  test('itemValues', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const byteOffset = 50
    const capacity = 2
    const view = new HashBucketsView(allocator.buffer, byteOffset, Uint8View, capacity)
    for (let i = 0; i < capacity; i++) {
      view.setByIndex(i, null)
    }
    view.addItem(allocator, 0, uint8(10))
    view.addItem(allocator, 1, uint8(20))

    const iter = view.itemValues()
    const result = toArray(iter).map(x => x.get())

    expect(result).toStrictEqual([uint8(10), uint8(20)])
  })

  describe('hasItem', () => {
    test('exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const byteOffset = 50
      const capacity = 2
      const view = new HashBucketsView(allocator.buffer, byteOffset, Uint8View, capacity)
      view.addItem(allocator, 0, uint8(10))

      const result = view.hasItem(0)

      expect(result).toBe(true)
    })

    test('does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const byteOffset = 50
      const capacity = 2
      const view = new HashBucketsView(allocator.buffer, byteOffset, Uint8View, capacity)

      const result = view.hasItem(0)

      expect(result).toBe(false)
    })
  })

  describe('getItem', () => {
    test('exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const byteOffset = 50
      const capacity = 2
      const view = new HashBucketsView(allocator.buffer, byteOffset, Uint8View, capacity)
      view.addItem(allocator, 0, uint8(10))

      const result = view.getItem(0)

      expect(result!.get().get()).toBe(10)
    })

    test('does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const byteOffset = 50
      const capacity = 2
      const view = new HashBucketsView(allocator.buffer, byteOffset, Uint8View, capacity)

      const result = view.getItem(0)

      expect(result).toBe(null)
    })
  })

  describe('addItem', () => {
    test('exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const byteOffset = 50
      const capacity = 2
      const view = new HashBucketsView(allocator.buffer, byteOffset, Uint8View, capacity)
      view.addItem(allocator, 3, uint8(10))

      const result = view.addItem(allocator, 3, uint8(10))

      expect(result).toBe(false)
      expect(view.getViewByIndex(1).deref()?.getValue()).toStrictEqual([
        uint32(3)
      , uint8(10)
      ])
    })

    test('does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const byteOffset = 50
      const capacity = 2
      const view = new HashBucketsView(allocator.buffer, byteOffset, Uint8View, capacity)
      view.addItem(allocator, 2, uint8(20))

      const result = view.addItem(allocator, 3, uint8(10))

      expect(result).toBe(true)
      expect(view.getViewByIndex(1).deref()?.getValue()).toStrictEqual([
        uint32(3)
      , uint8(10)
      ])
    })
  })

  describe('deleteItem', () => {
    test('exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const byteOffset = 50
      const capacity = 2
      const view = new HashBucketsView(allocator.buffer, byteOffset, Uint8View, capacity)
      view.addItem(allocator, 0, uint8(10))

      const result = view.deleteItem(allocator, 0)

      expect(result).toBe(true)
      expect(view.hasItem(0)).toBe(false)
      expect(view.getViewByIndex(0).deref()).toBe(null)
    })

    test('does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const byteOffset = 50
      const capacity = 2
      const view = new HashBucketsView(allocator.buffer, byteOffset, Uint8View, capacity)

      const result = view.deleteItem(allocator, 0)

      expect(result).toBe(false)
      expect(view.hasItem(0)).toBe(false)
      expect(view.getViewByIndex(0).deref()).toBe(null)
    })
  })

  describe('transfer', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const oldBuckets = new HashBucketsView(
      allocator.buffer
    , 50
    , Uint8View
    , 1
    )
    oldBuckets.addItem(allocator, 1, uint8(10))
    oldBuckets.addItem(allocator, 2, uint8(20))
    const newBuckets = new HashBucketsView(
      allocator.buffer
    , 80
    , Uint8View
    , 2
    )

    oldBuckets.transfer(newBuckets)

    expect(oldBuckets.getViewByIndex(0).deref()).toBe(null)
    expect(newBuckets.getViewByIndex(0).deref()!.getValue()).toStrictEqual([
      uint32(2)
    , uint8(20)
    ])
    expect(newBuckets.getViewByIndex(1).deref()!.getValue()).toStrictEqual([
      uint32(1)
    , uint8(10)
    ])
  })
})
