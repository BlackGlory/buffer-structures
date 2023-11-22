import { toArray } from '@blackglory/prelude'
import { HashSet } from '@objects/hash-set.js'
import { IAllocator } from '@src/interfaces.js'
import { Uint8View } from '@views/uint8-view.js'
import { Uint32View } from '@views/uint32-view.js'
import { OwnershipPointerView } from '@views/ownership-pointer-view.js'
import { Allocator } from '@src/allocator.js'
import { getError } from 'return-style'
import { BaseObject } from '@objects/base-object.js'
import { uint8 } from '@literals/uint8-literal.js'

describe('HashSet', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = vi.spyOn(allocator, 'allocate')
    const capacity = 10

    const result = HashSet.create(allocator, Uint8View, { capacity })

    expect(result).toBeInstanceOf(BaseObject)
    expect(allocate).toBeCalledTimes(2)
    expect(allocate).nthCalledWith(1, OwnershipPointerView.byteLength * capacity)
    expect(allocate).nthCalledWith(
      2
    , Uint32View.byteLength + OwnershipPointerView.byteLength
    )
  })

  test('from', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashSet.create(allocator, Uint8View, { capacity })
    const allocate = vi.spyOn(allocator, 'allocate')

    const result = HashSet.from(allocator, obj.byteOffset, Uint8View, {
      capacity: obj.capacity
    , growthFactor: obj.growthFactor
    , loadFactor: obj.loadFactor
    })

    expect(result).toBeInstanceOf(BaseObject)
    expect(obj._counter._count).toBe(1)
    expect(result._counter._count).toBe(1)
    expect(allocate).not.toBeCalled()
  })

  test('byteOffset', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashSet.create(allocator, Uint8View, { capacity })

    const result = obj.byteOffset

    expect(result).toBe(obj._view.byteOffset)
  })

  test('capacity', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashSet.create(allocator, Uint8View, { capacity })

    const result = obj.capacity

    expect(result).toBe(obj._view.capacity)
  })

  test('loadFactor', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashSet.create(allocator, Uint8View, { capacity })

    const result = obj.loadFactor

    expect(result).toBe(obj._view.loadFactor)
  })

  test('growthFactor', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashSet.create(allocator, Uint8View, { capacity })

    const result = obj.growthFactor

    expect(result).toBe(obj._view.growthFactor)
  })

  test('viewConstructor', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashSet.create(allocator, Uint8View, { capacity })

    const result = obj.viewConstructor

    expect(result).toBe(Uint8View)
  })

  describe('resize', () => {
    test('(size / capacity) <= load factor', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 1
      const loadFactor = 1
      const obj = HashSet.create(allocator, Uint8View, { capacity, loadFactor })
      const bucketsByteOffsetBeforeResizing = obj._view.derefBuckets()!

      obj.add(uint8(10))

      expect(obj._view.derefBuckets()).toStrictEqual(bucketsByteOffsetBeforeResizing)
      expect(obj._view.derefBuckets()!.capacity).toBe(1)
      expect(obj.capacity).toBe(1)
      expect(obj.has(uint8(10))).toBe(true)
    })

    test('(size / capacity) > load factor', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 1
      const loadFactor = 0.75
      const growthFactor = 3
      const obj = HashSet.create(allocator, Uint8View, { capacity, loadFactor, growthFactor })
      const bucketsByteOffsetBeforeResizing = obj._view.derefBuckets()

      obj.add(uint8(10))

      expect(
        obj._view.derefBuckets()!.byteOffset
      ).not.toBe(bucketsByteOffsetBeforeResizing)
      expect(obj._view.derefBuckets()!.capacity).toBe(3)
      expect(obj.capacity).toBe(3)
      expect(obj.has(uint8(10))).toBe(true)
    })
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const free = vi.spyOn(allocator, 'free')
      const obj = HashSet.create(allocator, Uint8View)
      const buckets = obj._view.derefBuckets()!

      obj.destroy()

      expect(free).toBeCalledTimes(2)
      expect(free).nthCalledWith(1, buckets.byteOffset, buckets.byteLength)
      expect(free).nthCalledWith(2, obj._view.byteOffset, obj._view._view.byteLength)
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const obj = HashSet.create(allocator, Uint8View)
      obj.destroy()

      const err = getError(() => obj.destroy())

      expect(err).toBeInstanceOf(Error)
    })

    describe('reference counted', () => {
      test('does not call allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = vi.spyOn(allocator, 'free')
        const obj1 = HashSet.create(allocator, Uint8View)
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = vi.spyOn(allocator, 'free')
        const obj1 = HashSet.create(allocator, Uint8View)
        const buckets = obj1._view.derefBuckets()!
        const obj2 = obj1.clone()

        obj1.destroy()
        obj2.destroy()

        expect(free).toBeCalledTimes(2)
        expect(free).nthCalledWith(1, buckets.byteOffset, buckets.byteLength)
        expect(free).nthCalledWith(2, obj1._view.byteOffset, obj1._view._view.byteLength)
      })
    })
  })

  test('clone', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = HashSet.create(allocator, Uint8View)

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  describe('size', () => {
    test('initial value', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashSet.create<Uint8View>(allocator, Uint8View)

      const result = obj.size

      expect(result).toBe(0)
    })

    describe('add', () => {
      test('new item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = HashSet.create<Uint8View>(allocator, Uint8View)

        obj.add(uint8(1))
        const result = obj.size

        expect(result).toBe(1)
      })

      test('old item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = HashSet.create<Uint8View>(allocator, Uint8View)
        obj.add(uint8(1))

        obj.add(uint8(1))
        const result = obj.size

        expect(result).toBe(1)
      })
    })

    describe('delete', () => {
      test('exist item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = HashSet.create<Uint8View>(allocator, Uint8View)
        obj.add(uint8(1))

        obj.delete(uint8(1))
        const result = obj.size

        expect(result).toBe(0)
      })

      test('non-exist item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = HashSet.create<Uint8View>(allocator, Uint8View)

        obj.delete(uint8(1))
        const result = obj.size

        expect(result).toBe(0)
      })
    })
  })

  describe('values', () => {
    test('empty', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashSet.create<Uint8View>(allocator, Uint8View)

      const iter = obj.values()
      const result = toArray(iter)

      expect(result).toStrictEqual([])
    })

    test('non-empty', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashSet.create<Uint8View>(allocator, Uint8View)
      obj.add(uint8(10))
      obj.add(uint8(20))

      const iter = obj.values()
      const result = toArray(iter).map(x => x.get())

      expect(result).toStrictEqual([uint8(20), uint8(10)])
    })
  })

  describe('has', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashSet.create<Uint8View>(allocator, Uint8View)
      const key = uint8(1)

      const result = obj.has(key)

      expect(result).toBe(false)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashSet.create<Uint8View>(allocator, Uint8View)
      const value = uint8(1)
      obj.add(value)

      const result = obj.has(value)

      expect(result).toBe(true)
    })
  })

  describe('add', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashSet.create<Uint8View>(allocator, Uint8View)
      const value = uint8(1)

      obj.add(value)

      expect(obj.has(value)).toBe(true)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashSet.create<Uint8View>(allocator, Uint8View)
      const value = uint8(1)
      obj.add(value)

      obj.add(value)

      expect(obj.has(value)).toBe(true)
    })
  })

  describe('delete', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashSet.create<Uint8View>(allocator, Uint8View)
      const value = uint8(1)

      obj.delete(value)

      expect(obj.has(value)).toBe(false)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashSet.create<Uint8View>(allocator, Uint8View)
      const value = uint8(1)
      obj.add(value)

      obj.delete(value)

      expect(obj.has(value)).toBe(false)
    })
  })
})
