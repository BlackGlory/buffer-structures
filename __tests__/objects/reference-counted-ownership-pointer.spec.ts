import { ReferenceCountedOwnershipPointer } from '@objects/reference-counted-ownership-pointer'
import { Uint8 } from '@objects/uint8'
import { ReferenceCountedOwnershipPointerView } from '@views/reference-counted-ownership-pointer-view'
import { Uint8View } from '@views/uint8-view'
import { IAllocator, IHasher } from '@src/interfaces'
import { getError } from 'return-style'
import { uint8ToBuffer } from '@test/utils'
import { Allocator } from '@src/allocator'
import { BaseObject } from '@objects/base-object'
import { NULL } from '@src/null'
import { uint8 } from '@literals/uint8-literal'
import { uint32 } from '@literals/uint32-literal'

describe('ReferenceCountedOwnershipPointer', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = jest.spyOn(allocator, 'allocate')

    const result = ReferenceCountedOwnershipPointer.create(allocator, Uint8View, 10)

    expect(result).toBeInstanceOf(BaseObject)
    expect(result._view.getValue()!.get()).toBe(10)
    expect(allocate).toBeCalledTimes(1)
    expect(allocate).toBeCalledWith(ReferenceCountedOwnershipPointerView.byteLength)
  })

  test('from', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = ReferenceCountedOwnershipPointer.create(allocator, Uint8View, 10)
    const allocate = jest.spyOn(allocator, 'allocate')

    const result = ReferenceCountedOwnershipPointer.from(allocator, obj.byteOffset, Uint8View)

    expect(result).toBeInstanceOf(BaseObject)
    expect(result._view.getValue()!.get()).toBe(10)
    expect(obj._view.getCount().get()).toBe(1)
    expect(result._view.getCount().get()).toBe(1)
    expect(allocate).not.toBeCalled()
  })

  test('byteOffset', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = ReferenceCountedOwnershipPointer.create(allocator, Uint8View, 1)

    const result = obj.byteOffset

    expect(result).toBe(obj._view.byteOffset)
  })

  test('viewConstructor', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = ReferenceCountedOwnershipPointer.create(allocator, Uint8View, 1)

    const result = obj.viewConstructor

    expect(result).toBe(Uint8View)
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const free = jest.spyOn(allocator, 'free')
      const data = Uint8.create(allocator, uint8(10))
      const pointer = ReferenceCountedOwnershipPointer.create(
        allocator
      , Uint8View
      , data._view.byteOffset
      )

      pointer.destroy()

      expect(free).toBeCalledTimes(2)
      expect(free).nthCalledWith(
        1
      , data._view.byteOffset
      , Uint8View.byteLength
      )
      expect(free).nthCalledWith(
        2
      , pointer._view.byteOffset
      , ReferenceCountedOwnershipPointerView.byteLength
      )
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const pointer = ReferenceCountedOwnershipPointer.create(allocator, Uint8View, 1)
      pointer.destroy()

      const err = getError(() => pointer.destroy())

      expect(err).toBeInstanceOf(Error)
    })

    describe('reference counted', () => {
      test('does not call allocator.free()', () => {
        const allocator = {
          buffer: new ArrayBuffer(100)
        , allocate: jest.fn()
        , free: jest.fn()
        } satisfies IAllocator
        const obj1 = ReferenceCountedOwnershipPointer.create(allocator, Uint8View, 1)
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = jest.spyOn(allocator, 'free')
        const data = Uint8.create(allocator, uint8(10))
        const obj1 = ReferenceCountedOwnershipPointer.create(
          allocator
        , Uint8View
        , data._view.byteOffset
        )
        const obj2 = obj1.clone()

        obj1.destroy()
        obj2.destroy()

        expect(free).toBeCalledTimes(2)
        expect(free).nthCalledWith(1, data._view.byteOffset, Uint8View.byteLength)
        expect(free).nthCalledWith(
          2
        , obj1._view.byteOffset
        , ReferenceCountedOwnershipPointerView.byteLength
        )
      })
    })
  })

  test('clone', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = ReferenceCountedOwnershipPointer.create(allocator, Uint8View, 1)

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._view.getCount()).toStrictEqual(obj._view.getCount())
    expect(result._view.getCount()).toStrictEqual(uint32(2))
  })

  describe('deref', () => {
    test('null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = ReferenceCountedOwnershipPointer.create(allocator, Uint8View, 0)

      const result = obj.deref()

      expect(result).toBe(null)
    })

    test('non-null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const dataView = new Uint8View(allocator.buffer, 50)
      dataView.set(uint8(100))
      const obj = ReferenceCountedOwnershipPointer.create(allocator, Uint8View, 50)

      const result = obj.deref()

      expect(result).toBeInstanceOf(Uint8View)
      expect(result!.byteOffset).toBe(50)
      expect(result!.get()).toStrictEqual(uint8(100))
    })
  })

  describe('hash', () => {
    test('null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = ReferenceCountedOwnershipPointer.create(allocator, Uint8View, 0)
      const hasher = {
        write: jest.fn()
      } satisfies IHasher

      obj.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).nthCalledWith(1, NULL)
    })

    test('non-null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const data = Uint8.create(allocator, uint8(20))
      const obj = ReferenceCountedOwnershipPointer.create(
        allocator
      , Uint8View
      , data._view.byteOffset
      )
      const hasher = {
        write: jest.fn()
      } satisfies IHasher

      obj.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).nthCalledWith(1, uint8ToBuffer(20))
    })
  })
})
