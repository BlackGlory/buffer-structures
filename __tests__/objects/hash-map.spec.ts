import { HashMap } from '@objects/hash-map'
import { Uint8 } from '@objects/uint8'
import { IAllocator } from '@src/types'
import { Uint8View } from '@views/uint8-view'
import { PointerView } from '@views/pointer-view'
import { Allocator } from '@src/allocator'
import { getError } from 'return-style'
import { BaseObject } from '@objects/base-object'

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
      const key = new Uint8(allocator, 1)

      const result = obj.has(key._view)

      expect(result).toBe(false)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = new Uint8(allocator, 1)
      const value = new Uint8(allocator, 2)
      obj.set(key._view, value._view)

      const result = obj.has(key._view)

      expect(result).toBe(true)
    })
  })

  describe('get', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = new Uint8(allocator, 1)

      const result = obj.get(key._view)

      expect(result).toBe(undefined)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = new Uint8(allocator, 1)
      const value = new Uint8(allocator, 2)
      obj.set(key._view, value._view)

      const result = obj.get(key._view)

      expect(result).toBeInstanceOf(Uint8View)
      expect(result!.get()).toBe(2)
    })
  })

  describe('set', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = new Uint8(allocator, 1)
      const value = new Uint8(allocator, 2)

      obj.set(key._view, value._view)

      expect(obj.get(key._view)!.get()).toBe(2)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = new Uint8(allocator, 1)
      const value = new Uint8(allocator, 2)
      const newValue = new Uint8(allocator, 3)
      obj.set(key._view, value._view)

      obj.set(key._view, newValue._view)

      expect(obj.get(key._view)!.get()).toBe(3)
    })
  })

  describe('delete', () => {
    test('item does not exist', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = new Uint8(allocator, 1)

      obj.delete(key._view)

      expect(obj.has(key._view)).toBe(false)
    })

    test('item exists', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new HashMap<Uint8View, Uint8View>(allocator, Uint8View, 10)
      const key = new Uint8(allocator, 1)
      const value = new Uint8(allocator, 2)
      obj.set(key._view, value._view)

      obj.delete(key._view)

      expect(obj.has(key._view)).toBe(false)
    })
  })
})
