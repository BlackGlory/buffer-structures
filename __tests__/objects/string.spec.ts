import { String } from '@objects/string'
import { StringView } from '@views/string-view'
import { IAllocator, IHasher } from '@src/interfaces'
import { getError } from 'return-style'
import { Allocator } from '@src/allocator'
import { BaseObject } from '@objects/base-object'

describe('String', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = jest.spyOn(allocator, 'allocate')

    const result = new String(allocator, 'foo')

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toBe('foo')
    expect(allocate).toBeCalledTimes(1)
    expect(allocate).toBeCalledWith(StringView.getByteLength('foo'))
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const result = new String(allocator, 'foo')

      result.destroy()

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(result._view.byteOffset, result._view.byteLength)
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const result = new String(allocator, 'foo')
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
        const obj1 = new String(allocator, 'foo')
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = jest.spyOn(allocator, 'free')
        const obj1 = new String(allocator, 'foo')
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
    const obj = new String(allocator, 'foo')

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  test('copy', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new String(allocator, 'foo')

    const result = obj.copy()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).not.toBe(obj._view.byteOffset)
    expect(result._counter).not.toBe(obj._counter)
    expect(result._counter._count).toBe(1)
  })

  test('get', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new String(allocator, 'foo')

    const result = obj.get()

    expect(result).toBe('foo')
  })

  test('hash', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new String(allocator, 'foo')
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    obj.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).nthCalledWith(1, Buffer.from('foo').buffer)
  })
})
