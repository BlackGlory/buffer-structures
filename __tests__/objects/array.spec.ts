import { Array } from '@objects/array'
import { ArrayView } from '@views/array-view'
import { Uint8View } from '@views/uint8-view'
import { IAllocator } from '@src/types'
import { getError } from 'return-style'
import { Allocator } from '@src/allocator'

describe('Array', () => {
  test('create', () => {
    const allocator = {
      buffer: new ArrayBuffer(100)
    , allocate: jest.fn()
    , free: jest.fn()
    } satisfies IAllocator

    new Array(allocator, Uint8View, 3)

    expect(allocator.allocate).toBeCalledTimes(1)
    expect(allocator.allocate).toBeCalledWith(ArrayView.getByteLength(Uint8View, 3))
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const result = new Array(allocator, Uint8View, 3)

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
      const result = new Array(allocator, Uint8View, 3)
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
        const arr1 = new Array(allocator, Uint8View, 3)
        const arr2 = arr1.clone()

        arr1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = {
          buffer: new ArrayBuffer(100)
        , allocate: jest.fn()
        , free: jest.fn()
        } satisfies IAllocator
        const arr1 = new Array(allocator, Uint8View, 3)
        const arr2 = arr1.clone()

        arr1.destroy()
        arr2.destroy()

        expect(allocator.free).toBeCalledTimes(1)
        expect(allocator.free).toBeCalledWith(arr1._view.byteOffset)
      })
    })
  })

  test('clone', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const arr = new Array(allocator, Uint8View, 3)

    const result = arr.clone()

    expect(result).not.toBe(arr)
    expect(result._view.byteOffset).toBe(arr._view.byteOffset)
    expect(result._counter).toBe(arr._counter)
    expect(result._counter._count).toBe(2)
  })

  test('copy', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const arr = new Array(allocator, Uint8View, 3)

    const result = arr.copy()

    expect(result).not.toBe(arr)
    expect(result._view.byteOffset).not.toBe(arr._view.byteOffset)
    expect(result._counter).not.toBe(arr._counter)
    expect(result._counter._count).toBe(1)
  })

  test('get', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const arr = new Array(allocator, Uint8View, 3, [1, 2, 3])

    const result = arr.get()

    expect(result).toStrictEqual([1, 2, 3])
  })

  test('set', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const arr = new Array(allocator, Uint8View, 3, [1, 2, 3])

    arr.set([10, 20, 30])

    expect(arr.get()).toStrictEqual([10, 20, 30])
  })

  test('getByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const arr = new Array(allocator, Uint8View, 3, [1, 2, 3])

    const result = arr.getByIndex(1)

    expect(result).toBe(2)
  })

  test('setByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const arr = new Array(allocator, Uint8View, 3, [1, 2, 3])

    arr.setByIndex(1, 10)

    expect(arr.get()).toStrictEqual([1, 10, 3])
  })
})
