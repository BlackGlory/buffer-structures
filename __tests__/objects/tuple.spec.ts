import { Tuple } from '@objects/tuple.js'
import { TupleView } from '@views/tuple-view.js'
import { Uint8View } from '@views/uint8-view.js'
import { Uint16View } from '@views/uint16-view.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { uint8ToBuffer, uint16ToBuffer } from '@test/utils.js'
import { getError } from 'return-style'
import { Allocator } from '@src/allocator.js'
import { BaseObject } from '@objects/base-object.js'
import { uint8 } from '@literals/uint8-literal.js'
import { uint16 } from '@literals/uint16-literal.js'

describe('Tuple', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = vi.spyOn(allocator, 'allocate')

    const result = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toStrictEqual([uint8(1), uint16(2)])
    expect(allocate).toBeCalledTimes(1)
    expect(allocate).toBeCalledWith(TupleView.getByteLength([
      Uint8View
    , Uint16View
    ]))
  })

  test('from', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )
    const allocate = vi.spyOn(allocator, 'allocate')

    const result = Tuple.from(
      allocator
    , obj.byteOffset
    , [Uint8View, Uint16View]
    )

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toStrictEqual([uint8(1), uint16(2)])
    expect(obj._counter._count).toBe(1)
    expect(result._counter._count).toBe(1)
    expect(allocate).not.toBeCalled()
  })

  test('byteOffset', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )

    const result = obj.byteOffset

    expect(result).toBe(obj._view.byteOffset)
  })

  test('structure', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )

    const result = obj.structure

    expect(result).toStrictEqual([Uint8View, Uint16View])
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const free = vi.spyOn(allocator, 'free')
      const obj = Tuple.create(
        allocator
      , [Uint8View, Uint16View]
      , [uint8(1), uint16(2)]
      )

      obj.destroy()

      expect(free).toBeCalledTimes(1)
      expect(free).toBeCalledWith(obj._view.byteOffset, obj._view.byteLength)
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const obj = Tuple.create(
        allocator
      , [Uint8View, Uint16View]
      , [uint8(1), uint16(2)]
      )
      obj.destroy()

      const err = getError(() => obj.destroy())

      expect(err).toBeInstanceOf(Error)
    })

    describe('reference counted', () => {
      test('does not call allocator.free()', () => {
        const allocator = {
          buffer: new ArrayBuffer(100)
        , allocate: vi.fn()
        , free: vi.fn()
        } satisfies IAllocator
        const obj1 = Tuple.create(
          allocator
        , [Uint8View, Uint16View]
        , [uint8(1), uint16(2)]
        )
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = vi.spyOn(allocator, 'free')
        const obj1 = Tuple.create(
          allocator
        , [Uint8View, Uint16View]
        , [uint8(1), uint16(2)]
        )
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
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  test('copy', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )

    const result = obj.copy()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).not.toBe(obj._view.byteOffset)
    expect(result._counter).not.toBe(obj._counter)
    expect(result._counter._count).toBe(1)
  })

  test('get', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )

    const result = obj.get()

    expect(result).toStrictEqual([uint8(1), uint16(2)])
  })

  test('set', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )

    obj.set([uint8(3), uint16(4)])

    expect(obj.get()).toStrictEqual([uint8(3), uint16(4)])
  })

  test('getByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )

    const result = obj.getByIndex(1)

    expect(result).toStrictEqual(uint16(2))
  })

  test('setByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )

    obj.setByIndex(1, uint16(3))

    expect(obj.get()).toStrictEqual([uint8(1), uint16(3)])
  })

  test('getViewByIndex', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(1), uint16(2)]
    )

    const view1 = obj.getViewByIndex(0)
    const view2 = obj.getViewByIndex(1)

    expect(view1).toBeInstanceOf(Uint8View)
    expect(view2).toBeInstanceOf(Uint16View)
  })

  test('hash', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Tuple.create(
      allocator
    , [Uint8View, Uint16View]
    , [uint8(10), uint16(20)]
    )
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    obj.hash(hasher)

    expect(hasher.write).toBeCalledTimes(2)
    expect(hasher.write).nthCalledWith(1, uint8ToBuffer(10))
    expect(hasher.write).nthCalledWith(2, uint16ToBuffer(20))
  })
})
