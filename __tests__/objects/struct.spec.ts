import { Struct } from '@objects/struct.js'
import { StructView } from '@views/struct-view.js'
import { Uint8View } from '@views/uint8-view.js'
import { Uint16View } from '@views/uint16-view.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { uint8ToBuffer, uint16ToBuffer } from '@test/utils.js'
import { getError } from 'return-style'
import { Allocator } from '@src/allocator.js'
import { BaseObject } from '@objects/base-object.js'
import { uint8 } from '@literals/uint8-literal.js'
import { uint16 } from '@literals/uint16-literal.js'

describe('Struct', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = vi.spyOn(allocator, 'allocate')

    const result = Struct.create(
      allocator
    , {
        foo: Uint8View
      , bar: Uint16View
      }
    , { foo: uint8(1), bar: uint16(2) }
    )

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toStrictEqual({
      foo: uint8(1)
    , bar: uint16(2)
    })
    expect(allocate).toBeCalledTimes(1)
    expect(allocate).toBeCalledWith(StructView.getByteLength({
      foo: Uint8View
    , bar: Uint16View
    }))
  })

  test('from', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Struct.create(
      allocator
    , { foo: Uint8View, bar: Uint16View}
    , { foo: uint8(1), bar: uint16(2) }
    )
    const allocate = vi.spyOn(allocator, 'allocate')

    const result = Struct.from(
      allocator
    , obj.byteOffset
    , { foo: Uint8View, bar: Uint16View }
    )

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toStrictEqual({ foo: uint8(1), bar: uint16(2) })
    expect(obj._counter._count).toBe(1)
    expect(result._counter._count).toBe(1)
    expect(allocate).not.toBeCalled()
  })

  test('byteOffset', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Struct.create(
      allocator
    , { foo: Uint8View, bar: Uint16View}
    , { foo: uint8(1), bar: uint16(2) }
    )

    const result = obj.byteOffset

    expect(result).toBe(obj._view.byteOffset)
  })

  test('structure', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Struct.create(
      allocator
    , { foo: Uint8View, bar: Uint16View }
    , { foo: uint8(1), bar: uint16(2) }
    )

    const result = obj.structure

    expect(result).toStrictEqual({ foo: Uint8View, bar: Uint16View })
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const result = Struct.create(
        allocator
      , {
          foo: Uint8View
        , bar: Uint16View
        }
      , { foo: uint8(1), bar: uint16(2) }
      )

      result.destroy()

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(result._view.byteOffset, result._view.byteLength)
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const result = Struct.create(
        allocator
      , {
          foo: Uint8View
        , bar: Uint16View
        }
      , { foo: uint8(1), bar: uint16(2) }
      )
      result.destroy()

      const err = getError(() => result.destroy())

      expect(err).toBeInstanceOf(Error)
    })

    describe('reference counted', () => {
      test('does not call allocator.free()', () => {
        const allocator = {
          buffer: new ArrayBuffer(100)
        , allocate: vi.fn()
        , free: vi.fn()
        } satisfies IAllocator
        const obj1 = Struct.create(
          allocator
        , {
            foo: Uint8View
          , bar: Uint16View
          }
        , { foo: uint8(1), bar: uint16(2) }
        )
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = vi.spyOn(allocator, 'free')
        const obj1 = Struct.create(
          allocator
        , {
            foo: Uint8View
          , bar: Uint16View
          }
        , { foo: uint8(1), bar: uint16(2) }
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
    const obj = Struct.create(
      allocator
    , {
        foo: Uint8View
      , bar: Uint16View
      }
    , { foo: uint8(1), bar: uint16(2) }
    )

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  test('copy', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Struct.create(
      allocator
    , {
        foo: Uint8View
      , bar: Uint16View
      }
    , { foo: uint8(1), bar: uint16(2) }
    )

    const result = obj.copy()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).not.toBe(obj._view.byteOffset)
    expect(result._counter).not.toBe(obj._counter)
    expect(result._counter._count).toBe(1)
  })

  test('get', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Struct.create(
      allocator
    , {
        foo: Uint8View
      , bar: Uint16View
      }
    , { foo: uint8(1), bar: uint16(2) }
    )

    const result = obj.get()

    expect(result).toStrictEqual({
      foo: uint8(1)
    , bar: uint16(2)
    })
  })

  test('set', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Struct.create(
      allocator
    , {
        foo: Uint8View
      , bar: Uint16View
      }
    , { foo: uint8(1), bar: uint16(2) }
    )

    obj.set({
      foo: uint8(3)
    , bar: uint16(4)
    })

    expect(obj.get()).toStrictEqual({
      foo: uint8(3)
    , bar: uint16(4)
    })
  })

  test('getByKey', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Struct.create(
      allocator
    , {
        foo: Uint8View
      , bar: Uint16View
      }
    , { foo: uint8(1), bar: uint16(2) }
    )

    const result = obj.getByKey('bar')

    expect(result).toStrictEqual(uint16(2))
  })

  test('setByKey', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Struct.create(
      allocator
    , {
        foo: Uint8View
      , bar: Uint16View
      }
    , { foo: uint8(1), bar: uint16(2) }
    )

    obj.setByKey('bar', uint16(3))

    expect(obj.get()).toStrictEqual({
      foo: uint8(1)
    , bar: uint16(3)
    })
  })

  test('getViewByKey', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Struct.create(
      allocator
    , {
        foo: Uint8View
      , bar: Uint16View
      }
    , { foo: uint8(1), bar: uint16(2) }
    )

    const view1 = obj.getViewByKey('foo')
    const view2 = obj.getViewByKey('bar')

    expect(view1).toBeInstanceOf(Uint8View)
    expect(view2).toBeInstanceOf(Uint16View)
  })

  test('hash', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Struct.create(
      allocator
    , {
        foo: Uint8View
      , bar: Uint16View
      }
    , { foo: uint8(10), bar: uint16(20) }
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
