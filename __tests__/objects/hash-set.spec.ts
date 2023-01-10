import { toArray } from '@blackglory/prelude'
import { HashSet } from '@objects/hash-set'
import { IAllocator } from '@src/types'
import { Uint8View } from '@views/uint8-view'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { Allocator } from '@src/allocator'
import { getError } from 'return-style'
import { BaseObject } from '@objects/base-object'
import { uint8 } from '@literals/uint8'

describe('HashSet', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = jest.spyOn(allocator, 'allocate')
    const capacity = 10

    const result = new HashSet(allocator, Uint8View, { capacity })

    expect(result).toBeInstanceOf(BaseObject)
    expect(allocate).toBeCalledTimes(2)
    expect(allocate).nthCalledWith(1, OwnershipPointerView.byteLength * capacity)
    expect(allocate).nthCalledWith(
      2
    , Uint32View.byteLength + OwnershipPointerView.byteLength
    )
  })

  describe('resize', () => {
    test('(size / capacity) <= load factor', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 1
      const loadFactor = 1
      const obj = new HashSet(allocator, Uint8View, { capacity, loadFactor })
      const bucketsByteOffset = obj._view.getByKey('buckets')

      obj.add(uint8(10))

      expect(obj._view.getByKey('buckets')).toBe(bucketsByteOffset)
      expect(obj._view.getViewByKey('buckets').deref()!.length).toBe(1)
      expect(obj._capacity).toBe(1)
      expect(obj.has(uint8(10))).toBe(true)
    })

    test('(size / capacity) > load factor', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 1
      const loadFactor = 0.75
      const growthFactor = 3
      const obj = new HashSet(allocator, Uint8View, { capacity, loadFactor, growthFactor })
      const bucketsByteOffset = obj._view.getByKey('buckets')

      obj.add(uint8(10))

      expect(obj._view.getByKey('buckets')).not.toBe(bucketsByteOffset)
      expect(obj._view.getViewByKey('buckets').deref()!.length).toBe(3)
      expect(obj._capacity).toBe(3)
      expect(obj.has(uint8(10))).toBe(true)
    })
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const free = jest.spyOn(allocator, 'free')
      const obj = new HashSet(allocator, Uint8View)
      const buckets = obj._view.getViewByKey('buckets').deref()!

      obj.destroy()

      expect(free).toBeCalledTimes(2)
      expect(free).nthCalledWith(1, buckets.byteOffset, buckets.byteLength)
      expect(free).nthCalledWith(2, obj._view.byteOffset, obj._view.byteLength)
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const obj = new HashSet(allocator, Uint8View)
      obj.destroy()

      const err = getError(() => obj.destroy())

      expect(err).toBeInstanceOf(Error)
    })

    describe('reference counted', () => {
      test('does not call allocator.free()', () => {
        const allocator = {
          buffer: new ArrayBuffer(100)
        , allocate: jest.fn()
        , free: jest.fn()
        } satisfies IAllocator
        const obj1 = new HashSet(allocator, Uint8View)
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = jest.spyOn(allocator, 'free')
        const obj1 = new HashSet(allocator, Uint8View)
        const buckets = obj1._view.getViewByKey('buckets').deref()!
        const obj2 = obj1.clone()

        obj1.destroy()
        obj2.destroy()

        expect(free).toBeCalledTimes(2)
        expect(free).nthCalledWith(1, buckets.byteOffset, buckets.byteLength)
        expect(free).nthCalledWith(2, obj1._view.byteOffset, obj1._view.byteLength)
      })
    })
  })

  test('clone', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new HashSet(allocator, Uint8View)

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  describe('size', () => {
    test('initial value', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashSet<Uint8View>(allocator, Uint8View)

      const result = obj.size

      expect(result).toBe(0)
    })

    describe('add', () => {
      test('new item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = new HashSet<Uint8View>(allocator, Uint8View)

        obj.add(uint8(1))
        const result = obj.size

        expect(result).toBe(1)
      })

      test('old item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = new HashSet<Uint8View>(allocator, Uint8View)
        obj.add(uint8(1))

        obj.add(uint8(1))
        const result = obj.size

        expect(result).toBe(1)
      })
    })

    describe('delete', () => {
      test('exist item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = new HashSet<Uint8View>(allocator, Uint8View)
        obj.add(uint8(1))

        obj.delete(uint8(1))
        const result = obj.size

        expect(result).toBe(0)
      })

      test('non-exist item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = new HashSet<Uint8View>(allocator, Uint8View)

        obj.delete(uint8(1))
        const result = obj.size

        expect(result).toBe(0)
      })
    })
  })

  describe('values', () => {
    test('empty', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashSet<Uint8View>(allocator, Uint8View)

      const iter = obj.values()
      const result = toArray(iter)

      expect(result).toStrictEqual([])
    })

    test('non-empty', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashSet<Uint8View>(allocator, Uint8View)
      obj.add(uint8(10))
      obj.add(uint8(20))

      const iter = obj.values()
      const result = toArray(iter).map(x => x.get())

      expect(result).toStrictEqual([20, 10])
    })
  })

  describe('has', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashSet<Uint8View>(allocator, Uint8View)
      const key = uint8(1)

      const result = obj.has(key)

      expect(result).toBe(false)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashSet<Uint8View>(allocator, Uint8View)
      const value = uint8(1)
      obj.add(value)

      const result = obj.has(value)

      expect(result).toBe(true)
    })
  })

  describe('add', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashSet<Uint8View>(allocator, Uint8View)
      const value = uint8(1)

      obj.add(value)

      expect(obj.has(value)).toBe(true)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashSet<Uint8View>(allocator, Uint8View)
      const value = uint8(1)
      obj.add(value)

      obj.add(value)

      expect(obj.has(value)).toBe(true)
    })
  })

  describe('delete', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashSet<Uint8View>(allocator, Uint8View)
      const value = uint8(1)

      obj.delete(value)

      expect(obj.has(value)).toBe(false)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashSet<Uint8View>(allocator, Uint8View)
      const value = uint8(1)
      obj.add(value)

      obj.delete(value)

      expect(obj.has(value)).toBe(false)
    })
  })
})
