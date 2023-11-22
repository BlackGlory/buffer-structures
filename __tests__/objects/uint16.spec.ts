import { Uint16 } from '@objects/uint16.js'
import { Uint16View } from '@views/uint16-view.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { getError } from 'return-style'
import { uint16ToBuffer } from '@test/utils.js'
import { Allocator } from '@src/allocator.js'
import { BaseObject } from '@objects/base-object.js'
import { uint16 } from '@literals/uint16-literal.js'

describe('Uint16', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = vi.spyOn(allocator, 'allocate')

    const result = Uint16.create(allocator, uint16(1))

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toStrictEqual(uint16(1))
    expect(allocate).toBeCalledTimes(1)
    expect(allocate).toBeCalledWith(Uint16View.byteLength)
  })

  test('from', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Uint16.create(allocator, uint16(1))
    const allocate = vi.spyOn(allocator, 'allocate')

    const result = Uint16.from(allocator, obj.byteOffset)

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toStrictEqual(uint16(1))
    expect(obj._counter._count).toBe(1)
    expect(result._counter._count).toBe(1)
    expect(allocate).not.toBeCalled()
  })

  test('byteOffset', () => {
    const allocator = new Allocator(new ArrayBuffer(100))

    const result = Uint16.create(allocator, uint16(1))

    expect(result.byteOffset).toBe(result._view.byteOffset)
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const free = vi.spyOn(allocator, 'free')
      const result = Uint16.create(allocator, uint16(1))

      result.destroy()

      expect(free).toBeCalledTimes(1)
      expect(free).toBeCalledWith(result._view.byteOffset, Uint16View.byteLength)
    })

    it('cannot destory twice', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: vi.fn()
      , free: vi.fn()
      } satisfies IAllocator
      const result = Uint16.create(allocator, uint16(1))
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
        const obj1 = Uint16.create(allocator, uint16(1))
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = vi.spyOn(allocator, 'free')
        const obj1 = Uint16.create(allocator, uint16(1))
        const obj2 = obj1.clone()

        obj1.destroy()
        obj2.destroy()

        expect(free).toBeCalledTimes(1)
        expect(free).toBeCalledWith(obj1._view.byteOffset, Uint16View.byteLength)
      })
    })
  })

  test('clone', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Uint16.create(allocator, uint16(1))

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  test('copy', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Uint16.create(allocator, uint16(1))

    const result = obj.copy()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).not.toBe(obj._view.byteOffset)
    expect(result._counter).not.toBe(obj._counter)
    expect(result._counter._count).toBe(1)
  })

  test('get', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Uint16.create(allocator, uint16(1))

    const result = obj.get()

    expect(result).toStrictEqual(uint16(1))
  })

  test('set', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Uint16.create(allocator, uint16(1))

    obj.set(uint16(2))

    expect(obj.get()).toStrictEqual(uint16(2))
  })

  test('hash', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = Uint16.create(allocator, uint16(1))
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    obj.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).nthCalledWith(1, uint16ToBuffer(1))
  })
})
