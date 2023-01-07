import { OwnershipPointer } from '@objects/ownership-pointer'
import { Uint8 } from '@objects/uint8'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { Uint8View } from '@views/uint8-view'
import { IAllocator, IHasher } from '@src/types'
import { getError } from 'return-style'
import { uint8ToBytes } from '@test/utils'
import { Allocator } from '@src/allocator'

describe('OwnershipPointer', () => {
  test('create', () => {
    const allocator = {
      buffer: new ArrayBuffer(100)
    , allocate: jest.fn()
    , free: jest.fn()
    } satisfies IAllocator

    new OwnershipPointer(allocator, Uint8View, 1)

    expect(allocator.allocate).toBeCalledTimes(1)
    expect(allocator.allocate).toBeCalledWith(OwnershipPointerView.byteLength)
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const free = jest.spyOn(allocator, 'free')
      const data = new Uint8(allocator, 50)
      const pointer = new OwnershipPointer(allocator, Uint8View, data._view.byteOffset)

      pointer.destroy()

      expect(free).toBeCalledTimes(2)
      expect(free).nthCalledWith(1, data._view.byteOffset)
      expect(free).nthCalledWith(2, pointer._view.byteOffset)
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const pointer = new OwnershipPointer(allocator, Uint8View, 1)
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
        const obj1 = new OwnershipPointer(allocator, Uint8View, 1)
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = jest.spyOn(allocator, 'free')
        const obj1 = new OwnershipPointer(allocator, Uint8View, 50)
        const obj2 = obj1.clone()

        obj1.destroy()
        obj2.destroy()

        expect(free).toBeCalledTimes(2)
        expect(free).nthCalledWith(1, 50)
        expect(free).nthCalledWith(2, obj1._view.byteOffset)
      })
    })
  })

  test('clone', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new OwnershipPointer(allocator, Uint8View, 1)

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  describe('deref', () => {
    test('null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new OwnershipPointer(allocator, Uint8View, 0)

      const result = obj.deref()

      expect(result).toBe(null)
    })

    test('non-null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const dataView = new Uint8View(allocator.buffer, 50)
      dataView.set(100)
      const obj = new OwnershipPointer(allocator, Uint8View, 50)

      const result = obj.deref()

      expect(result).toBeInstanceOf(Uint8View)
      expect(result!.byteOffset).toBe(50)
      expect(result!.get()).toBe(100)
    })
  })

  describe('hash', () => {
    test('null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new OwnershipPointer(allocator, Uint8View, 0)
      const hasher = {
        write: jest.fn()
      } satisfies IHasher

      obj.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).nthCalledWith(1, uint8ToBytes(0))
    })

    test('non-null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const data = new Uint8(allocator, 20)
      const obj = new OwnershipPointer(allocator, Uint8View, data._view.byteOffset)
      const hasher = {
        write: jest.fn()
      } satisfies IHasher

      obj.hash(hasher)

      expect(hasher.write).toBeCalledTimes(1)
      expect(hasher.write).nthCalledWith(1, uint8ToBytes(20))
    })
  })
})
