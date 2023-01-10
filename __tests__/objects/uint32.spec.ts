import { Uint32 } from '@objects/uint32'
import { Uint32View } from '@views/uint32-view'
import { IAllocator, IHasher } from '@src/interfaces'
import { getError } from 'return-style'
import { uint32ToBuffer } from '@test/utils'
import { Allocator } from '@src/allocator'
import { BaseObject } from '@objects/base-object'

describe('Uint32', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = jest.spyOn(allocator, 'allocate')

    const result = new Uint32(allocator, 1)

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toBe(1)
    expect(allocate).toBeCalledTimes(1)
    expect(allocate).toBeCalledWith(Uint32View.byteLength)
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const free = jest.spyOn(allocator, 'free')
      const obj = new Uint32(allocator, 1)

      obj.destroy()

      expect(free).toBeCalledTimes(1)
      expect(free).toBeCalledWith(obj._view.byteOffset, Uint32View.byteLength)
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const result = new Uint32(allocator, 1)
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
        const obj1 = new Uint32(allocator, 1)
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = jest.spyOn(allocator, 'free')
        const obj1 = new Uint32(allocator, 1)
        const obj2 = obj1.clone()

        obj1.destroy()
        obj2.destroy()

        expect(free).toBeCalledTimes(1)
        expect(free).toBeCalledWith(obj1._view.byteOffset, Uint32View.byteLength)
      })
    })
  })

  test('clone', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Uint32(allocator, 1)

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  test('copy', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Uint32(allocator, 1)

    const result = obj.copy()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).not.toBe(obj._view.byteOffset)
    expect(result._counter).not.toBe(obj._counter)
    expect(result._counter._count).toBe(1)
  })

  test('get', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Uint32(allocator, 1)

    const result = obj.get()

    expect(result).toBe(1)
  })

  test('set', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Uint32(allocator, 1)

    obj.set(2)

    expect(obj.get()).toBe(2)
  })

  test('hash', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new Uint32(allocator, 1)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    obj.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).nthCalledWith(1, uint32ToBuffer(1))
  })
})
