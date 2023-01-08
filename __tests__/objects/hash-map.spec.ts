import { HashMap } from '@objects/hash-map'
import { IAllocator } from '@src/types'
import { Uint8View } from '@views/uint8-view'
import { PointerView } from '@views/pointer-view'
import { Allocator } from '@src/allocator'
import { getError } from 'return-style'
import { BaseObject } from '@objects/base-object'
import { uint8 } from '@literals/uint8'

describe('HashMap', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = jest.spyOn(allocator, 'allocate')

    const result = new HashMap(allocator, Uint8View, 10)

    expect(result).toBeInstanceOf(BaseObject)
    expect(allocate).toBeCalledTimes(1)
    expect(allocate).toBeCalledWith(PointerView.byteLength * 10)
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const result = new HashMap(allocator, Uint8View, 10)

      result.destroy()

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(result._view.byteOffset)
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const result = new HashMap(allocator, Uint8View, 10)
      result.destroy()

      const err = getError(() => result.destroy())

      expect(err).toBeInstanceOf(Error)
    })

    describe('reference counted', () => {
      test('does not call allocator.free()', () => {
        const allocator = {
          buffer: new ArrayBuffer(100)
        , allocate: jest.fn()
        , free: jest.fn()
        } satisfies IAllocator
        const obj1 = new HashMap(allocator, Uint8View, 10)
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = {
          buffer: new ArrayBuffer(100)
        , allocate: jest.fn()
        , free: jest.fn()
        } satisfies IAllocator
        const obj1 = new HashMap(allocator, Uint8View, 10)
        const obj2 = obj1.clone()

        obj1.destroy()
        obj2.destroy()

        expect(allocator.free).toBeCalledTimes(1)
        expect(allocator.free).toBeCalledWith(obj1._view.byteOffset)
      })
    })
  })

  test('clone', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new HashMap(allocator, Uint8View, 10)

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  describe('has', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = uint8(1)

      const result = obj.has(key)

      expect(result).toBe(false)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
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
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = uint8(1)

      const result = obj.get(key)

      expect(result).toBe(undefined)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = uint8(1)
      const value = uint8(2)
      obj.set(key, value)

      const result = obj.get(key)

      expect(result).toBeInstanceOf(Uint8View)
      expect(result!.get()).toBe(2)
    })
  })

  describe('set', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = uint8(1)
      const value = uint8(2)

      obj.set(key, value)

      expect(obj.get(key)!.get()).toBe(2)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = uint8(1)
      const value = uint8(2)
      const newValue = uint8(3)
      obj.set(key, value)

      obj.set(key, newValue)

      expect(obj.get(key)!.get()).toBe(3)
    })
  })

  describe('delete', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = uint8(1)

      obj.delete(key)

      expect(obj.has(key)).toBe(false)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = uint8(1)
      const value = uint8(2)
      obj.set(key, value)

      obj.delete(key)

      expect(obj.has(key)).toBe(false)
    })
  })
})
