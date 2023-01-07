import { Tuple } from '@objects/tuple'
import { TupleView } from '@views/tuple-view'
import { Uint8View } from '@views/uint8-view'
import { Uint16View } from '@views/uint16-view'
import { IAllocator, IHasher } from '@src/types'
import { uint8ToBuffer, uint16ToBuffer } from '@test/utils'
import { getError } from 'return-style'
import { Allocator } from '@src/allocator'

describe('Tuple', () => {
  test('create', () => {
    const allocator = {
      buffer: new ArrayBuffer(100)
    , allocate: jest.fn()
    , free: jest.fn()
    } satisfies IAllocator

    new Tuple(
      allocator
    , [Uint8View, Uint16View]
    , [1, 2]
    )

    expect(allocator.allocate).toBeCalledTimes(1)
    expect(allocator.allocate).toBeCalledWith(TupleView.getByteLength([
      Uint8View
    , Uint16View
    ]))
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const result = new Tuple(
        allocator
      , [Uint8View, Uint16View]
      , [1, 2]
      )

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
      const result = new Tuple(
        allocator
      , [Uint8View, Uint16View]
      , [1, 2]
      )
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
        const obj1 = new Tuple(
          allocator
        , [Uint8View, Uint16View]
        , [1, 2]
        )
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
        const obj1 = new Tuple(
          allocator
        , [Uint8View, Uint16View]
        , [1, 2]
        )
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
    const obj = new Tuple(
      allocator
    , [Uint8View, Uint16View]
    , [1, 2]
    )

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  test('copy', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Tuple(
      allocator
    , [Uint8View, Uint16View]
    , [1, 2]
    )

    const result = obj.copy()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).not.toBe(obj._view.byteOffset)
    expect(result._counter).not.toBe(obj._counter)
    expect(result._counter._count).toBe(1)
  })

  test('get', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Tuple(
      allocator
    , [Uint8View, Uint16View]
    , [1, 2]
    )

    const result = obj.get()

    expect(result).toStrictEqual([1, 2])
  })

  test('set', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Tuple(
      allocator
    , [Uint8View, Uint16View]
    , [1, 2]
    )

    obj.set([3, 4])

    expect(obj.get()).toStrictEqual([3, 4])
  })

  test('getByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Tuple(
      allocator
    , [Uint8View, Uint16View]
    , [1, 2]
    )

    const result = obj.getByIndex(1)

    expect(result).toBe(2)
  })

  test('setByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Tuple(
      allocator
    , [Uint8View, Uint16View]
    , [1, 2]
    )

    obj.setByIndex(1, 3)

    expect(obj.get()).toStrictEqual([1, 3])
  })

  test('getViewByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Tuple(
      allocator
    , [Uint8View, Uint16View]
    , [1, 2]
    )

    const view1 = obj.getViewByIndex(0)
    const view2 = obj.getViewByIndex(1)

    expect(view1).toBeInstanceOf(Uint8View)
    expect(view2).toBeInstanceOf(Uint16View)
  })

  test('hash', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Tuple(
      allocator
    , [Uint8View, Uint16View]
    , [10, 20]
    )
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    obj.hash(hasher)

    expect(hasher.write).toBeCalledTimes(2)
    expect(hasher.write).nthCalledWith(1, uint8ToBuffer(10))
    expect(hasher.write).nthCalledWith(2, uint16ToBuffer(20))
  })
})
