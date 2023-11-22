import { toArray } from '@blackglory/prelude'
import { HashMap } from '@objects/hash-map.js'
import { IAllocator } from '@src/interfaces.js'
import { Uint8View } from '@views/uint8-view.js'
import { Uint16View } from '@views/uint16-view.js'
import { Uint32View } from '@views/uint32-view.js'
import { OwnershipPointerView } from '@views/ownership-pointer-view.js'
import { Allocator } from '@src/allocator.js'
import { getError } from 'return-style'
import { BaseObject } from '@objects/base-object.js'
import { uint8 } from '@literals/uint8-literal.js'

describe('HashMap', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = vi.spyOn(allocator, 'allocate')
    const capacity = 10

    const result = HashMap.create(allocator, Uint8View, Uint8View, { capacity })

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
    const obj = HashMap.create(allocator, Uint8View, Uint8View, { capacity })
    const allocate = vi.spyOn(allocator, 'allocate')

    const result = HashMap.from(allocator, obj.byteOffset, Uint8View, Uint8View, {
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
    const obj = HashMap.create(allocator, Uint8View, Uint8View, { capacity })

    const result = obj.byteOffset

    expect(result).toBe(obj._view.byteOffset)
  })

  test('capacity', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashMap.create(allocator, Uint8View, Uint8View, { capacity })

    const result = obj.capacity

    expect(result).toBe(obj._view.capacity)
  })

  test('loadFactor', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashMap.create(allocator, Uint8View, Uint8View, { capacity })

    const result = obj.loadFactor

    expect(result).toBe(obj._view.loadFactor)
  })

  test('growthFactor', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashMap.create(allocator, Uint8View, Uint8View, { capacity })

    const result = obj.growthFactor

    expect(result).toBe(obj._view.growthFactor)
  })

  test('keyViewConstructor', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashMap.create(allocator, Uint8View, Uint16View, { capacity })

    const result = obj.keyViewConstructor

    expect(result).toBe(Uint8View)
  })

  test('valueViewConstructor', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const capacity = 10
    const obj = HashMap.create(allocator, Uint8View, Uint16View, { capacity })

    const result = obj.valueViewConstructor

    expect(result).toBe(Uint16View)
  })

  describe('resize', () => {
    test('(size / capacity) <= load factor', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 1
      const loadFactor = 1
      const obj = HashMap.create(allocator, Uint8View, Uint8View, { capacity, loadFactor })
      const bucketsByteOffset = obj._view.derefBuckets()

      obj.set(uint8(1), uint8(10))

      expect(obj._view.derefBuckets()).toStrictEqual(bucketsByteOffset)
      expect(obj._view.derefBuckets()!.capacity).toBe(1)
      expect(obj.capacity).toBe(1)
      expect(obj.get(uint8(1))!.get()).toStrictEqual(uint8(10))
    })

    test('(size / capacity) > load factor', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const capacity = 1
      const loadFactor = 0.75
      const growthFactor = 3
      const obj = HashMap.create(
        allocator
      , Uint8View
      , Uint8View
      , { capacity, loadFactor, growthFactor }
      )
      const bucketsByteOffset = obj._view.derefBuckets()

      obj.set(uint8(1), uint8(10))

      expect(obj._view.derefBuckets()!.byteOffset).not.toBe(bucketsByteOffset)
      expect(obj._view.derefBuckets()!.capacity).toBe(3)
      expect(obj.capacity).toBe(3)
      expect(obj.get(uint8(1))!.get()).toStrictEqual(uint8(10))
    })
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const free = vi.spyOn(allocator, 'free')
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
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
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      obj.destroy()

      const err = getError(() => obj.destroy())

      expect(err).toBeInstanceOf(Error)
    })

    describe('reference counted', () => {
      test('does not call allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = vi.spyOn(allocator, 'free')
        const obj1 = HashMap.create(allocator, Uint8View, Uint8View)
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = vi.spyOn(allocator, 'free')
        const obj1 = HashMap.create(allocator, Uint8View, Uint8View)
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
    const obj = HashMap.create(allocator, Uint8View, Uint8View)

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  describe('size', () => {
    test('initial value', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)

      const result = obj.size

      expect(result).toBe(0)
    })

    describe('set', () => {
      test('new item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = HashMap.create(allocator, Uint8View, Uint8View)

        obj.set(uint8(1), uint8(1))
        const result = obj.size

        expect(result).toBe(1)
      })

      test('old item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = HashMap.create(allocator, Uint8View, Uint8View)
        obj.set(uint8(1), uint8(1))

        obj.set(uint8(1), uint8(2))
        const result = obj.size

        expect(result).toBe(1)
      })
    })

    describe('delete', () => {
      test('exist item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = HashMap.create(allocator, Uint8View, Uint8View)
        obj.set(uint8(1), uint8(1))

        obj.delete(uint8(1))
        const result = obj.size

        expect(result).toBe(0)
      })

      test('non-exist item', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const obj = HashMap.create(allocator, Uint8View, Uint8View)

        obj.delete(uint8(1))
        const result = obj.size

        expect(result).toBe(0)
      })
    })
  })

  describe('entries', () => {
    test('empty', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)

      const iter = obj.entries()
      const result = toArray(iter).map(([key, value]) => [key.get(), value.get()])

      expect(result).toStrictEqual([])
    })

    test('non-empty', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      obj.set(uint8(1), uint8(10))
      obj.set(uint8(2), uint8(20))

      const iter = obj.entries()
      const result = toArray(iter).map(([key, value]) => [key.get(), value.get()])

      expect(result).toStrictEqual([
        [uint8(2), uint8(20)]
      , [uint8(1), uint8(10)]
      ])
    })
  })

  describe('keys', () => {
    test('empty', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)

      const iter = obj.keys()
      const result = toArray(iter).map(x => x.get())

      expect(result).toStrictEqual([])
    })

    test('non-empty', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      obj.set(uint8(1), uint8(10))
      obj.set(uint8(2), uint8(20))

      const iter = obj.keys()
      const result = toArray(iter).map(x => x.get())

      expect(result).toStrictEqual([uint8(2), uint8(1)])
    })
  })

  describe('values', () => {
    test('empty', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)

      const iter = obj.values()
      const result = toArray(iter).map(x => x.get())

      expect(result).toStrictEqual([])
    })

    test('non-empty', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      obj.set(uint8(1), uint8(10))
      obj.set(uint8(2), uint8(20))

      const iter = obj.values()
      const result = toArray(iter).map(x => x.get())

      expect(result).toStrictEqual([uint8(20), uint8(10)])
    })
  })

  describe('has', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      const key = uint8(1)

      const result = obj.has(key)

      expect(result).toBe(false)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      const key = uint8(1)
      const value = uint8(2)
      obj.set(key, value)

      const result = obj.has(key)

      expect(result).toBe(true)
    })
  })

  describe('get', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      const key = uint8(1)

      const result = obj.get(key)

      expect(result).toBe(null)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      const key = uint8(1)
      const value = uint8(2)
      obj.set(key, value)

      const result = obj.get(key)

      expect(result).toBeInstanceOf(Uint8View)
      expect(result!.get()).toStrictEqual(uint8(2))
    })
  })

  describe('set', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      const key = uint8(1)
      const value = uint8(2)

      obj.set(key, value)

      expect(obj.get(key)!.get()).toStrictEqual(uint8(2))
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      const key = uint8(1)
      const value = uint8(2)
      const newValue = uint8(3)
      obj.set(key, value)

      obj.set(key, newValue)

      expect(obj.get(key)!.get()).toStrictEqual(uint8(3))
    })
  })

  describe('delete', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      const key = uint8(1)

      obj.delete(key)

      expect(obj.has(key)).toBe(false)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = HashMap.create(allocator, Uint8View, Uint8View)
      const key = uint8(1)
      const value = uint8(2)
      obj.set(key, value)

      obj.delete(key)

      expect(obj.has(key)).toBe(false)
    })
  })
})
