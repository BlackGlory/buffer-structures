import { Array } from '@objects/array'
import { ArrayView } from '@views/array-view'
import { Uint8View } from '@views/uint8-view'
import { IAllocator, IHasher } from '@src/interfaces'
import { getError } from 'return-style'
import { uint8ToBuffer } from '@test/utils'
import { Allocator } from '@src/allocator'
import { BaseObject } from '@objects/base-object'
import { uint8 } from '@literals/uint8-literal'

describe('Array', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = jest.spyOn(allocator, 'allocate')

    const result = Array.create(allocator, Uint8View, 3, [uint8(1), uint8(2), uint8(3)])

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toStrictEqual([uint8(1), uint8(2), uint8(3)])
    expect(allocate).toBeCalledTimes(1)
    expect(allocate).toBeCalledWith(ArrayView.getByteLength(Uint8View, 3))
  })

  test('from', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Array.create(allocator, Uint8View, 3, [uint8(1), uint8(2), uint8(3)])
    const allocate = jest.spyOn(allocator, 'allocate')

    const result = Array.from(allocator, obj.byteOffset, Uint8View, 3)

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toStrictEqual([uint8(1), uint8(2), uint8(3)])
    expect(obj._counter._count).toBe(1)
    expect(result._counter._count).toBe(1)
    expect(allocate).not.toBeCalled()
  })

  test('byteOffset', () => {
    const allocator = new Allocator(new ArrayBuffer(100))

    const result = Array.create(allocator, Uint8View, 3, [uint8(1), uint8(2), uint8(3)])

    expect(result.byteOffset).toBe(result._view.byteOffset)
  })

  test('viewConstructor', () => {
    const allocator = new Allocator(new ArrayBuffer(100))

    const result = Array.create(allocator, Uint8View, 3, [uint8(1), uint8(2), uint8(3)])

    expect(result.viewConstructor).toBe(Uint8View)
  })

  test('length', () => {
    const allocator = new Allocator(new ArrayBuffer(100))

    const result = Array.create(allocator, Uint8View, 3, [uint8(1), uint8(2), uint8(3)])

    expect(result.length).toBe(3)
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const free = jest.spyOn(allocator, 'free')
      const obj = Array.create(allocator, Uint8View, 3)

      obj.destroy()

      expect(free).toBeCalledTimes(1)
      expect(free).toBeCalledWith(obj._view.byteOffset, obj._view.byteLength)
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const obj = Array.create(allocator, Uint8View, 3)
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
        const obj1 = Array.create(allocator, Uint8View, 3)
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = jest.spyOn(allocator, 'free')
        const obj1 = Array.create(allocator, Uint8View, 3)
        const obj2 = obj1.clone()

        obj1.destroy()
        obj2.destroy()

        expect(free).toBeCalledTimes(1)
        expect(free).toBeCalledWith(obj1._view.byteOffset, obj1._view.byteLength)
      })
    })
  })

  test('clone', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Array.create(allocator, Uint8View, 3)

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  test('copy', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Array.create(allocator, Uint8View, 3)

    const result = obj.copy()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).not.toBe(obj._view.byteOffset)
    expect(result._counter).not.toBe(obj._counter)
    expect(result._counter._count).toBe(1)
  })

  test('get', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Array.create(allocator, Uint8View, 3, [uint8(1), uint8(2), uint8(3)])

    const result = obj.get()

    expect(result).toStrictEqual([uint8(1), uint8(2), uint8(3)])
  })

  test('set', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Array.create(allocator, Uint8View, 3, [uint8(1), uint8(2), uint8(3)])

    obj.set([uint8(10), uint8(20), uint8(30)])

    expect(obj.get()).toStrictEqual([uint8(10), uint8(20), uint8(30)])
  })

  test('getByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Array.create(allocator, Uint8View, 3, [uint8(1), uint8(2), uint8(3)])

    const result = obj.getByIndex(1)

    expect(result).toStrictEqual(uint8(2))
  })

  test('setByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Array.create(allocator, Uint8View, 3, [uint8(1), uint8(2), uint8(3)])

    obj.setByIndex(1, uint8(10))

    expect(obj.get()).toStrictEqual([uint8(1), uint8(10), uint8(3)])
  })

  test('getViewByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Array.create(allocator, Uint8View, 2, [uint8(1), uint8(2)])

    const view1 = obj.getViewByIndex(0)
    const view2 = obj.getViewByIndex(1)

    expect(view1).toBeInstanceOf(Uint8View)
    expect(view2).toBeInstanceOf(Uint8View)
  })

  test('hash', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Array.create(allocator, Uint8View, 2, [uint8(1), uint8(2)])
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    obj.hash(hasher)

    expect(hasher.write).toBeCalledTimes(2)
    expect(hasher.write).nthCalledWith(1, uint8ToBuffer(1))
    expect(hasher.write).nthCalledWith(2, uint8ToBuffer(2))
  })
})
