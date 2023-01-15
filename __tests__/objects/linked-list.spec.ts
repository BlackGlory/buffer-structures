import { LinkedList } from '@objects/linked-list'
import { LinkedListView } from '@views/linked-list-view'
import { Uint8View } from '@views/uint8-view'
import { IAllocator, IHasher } from '@src/interfaces'
import { getError } from 'return-style'
import { uint8ToBuffer } from '@test/utils'
import { Allocator } from '@src/allocator'
import { OwnershipPointerView } from '@src/views/ownership-pointer-view'
import { BaseObject } from '@objects/base-object'
import { NULL } from '@src/null'
import { uint8 } from '@literals/uint8-literal'
import { uint32 } from '@literals/uint32-literal'

describe('LinkedList', () => {
  test('create', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const allocate = jest.spyOn(allocator, 'allocate')

    const result = LinkedList.create(
      allocator
    , Uint8View
    , [null, uint8(1)]
    )

    expect(result).toBeInstanceOf(BaseObject)
    expect(result.get()).toStrictEqual([null, uint8(1)])
    expect(allocate).toBeCalledTimes(1)
    expect(allocate).toBeCalledWith(LinkedListView.getByteLength(Uint8View))
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const free = jest.spyOn(allocator, 'free')
      const result = LinkedList.create(
        allocator
      , Uint8View
      , [null, uint8(1)]
      )

      result.destroy()

      expect(free).toBeCalledTimes(1)
      expect(free).toBeCalledWith(result._view.byteOffset, result._view.byteLength)
    })

    it('cannot destory twice', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const result = LinkedList.create(
        allocator
      , Uint8View
      , [null, uint8(1)]
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
        const obj1 = LinkedList.create(
          allocator
        , Uint8View
        , [null, uint8(1)]
        )
        const obj2 = obj1.clone()

        obj1.destroy()

        expect(allocator.free).not.toBeCalled()
      })

      test('calls allocator.free()', () => {
        const allocator = new Allocator(new ArrayBuffer(100))
        const free = jest.spyOn(allocator, 'free')
        const obj1 = LinkedList.create(
          allocator
        , Uint8View
        , [null, uint8(1)]
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
    const obj = LinkedList.create(
      allocator
    , Uint8View
    , [null, uint8(1)]
    )

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  test('copy', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = LinkedList.create(
      allocator
    , Uint8View
    , [null, uint8(1)]
    )

    const result = obj.copy()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).not.toBe(obj._view.byteOffset)
    expect(result._counter).not.toBe(obj._counter)
    expect(result._counter._count).toBe(1)
  })

  describe('get', () => {
    test('next: null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = LinkedList.create(
        allocator
      , Uint8View
      , [null, uint8(1)]
      )

      const result = obj.get()

      expect(result).toStrictEqual([null, uint8(1)])
    })

    test('next: number', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = LinkedList.create(
        allocator
      , Uint8View
      , [uint32(1), uint8(2)]
      )

      const result = obj.get()

      expect(result).toStrictEqual([uint32(1), uint8(2)])
    })
  })

  describe('set', () => {
    test('next: null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = LinkedList.create(
        allocator
      , Uint8View
      , [uint32(1), uint8(2)]
      )

      obj.set([null, uint8(1)])

      expect(obj.get()).toStrictEqual([null, uint8(1)])
    })

    test('next: number', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = LinkedList.create(
        allocator
      , Uint8View
      , [null, uint8(1)]
      )

      obj.set([uint32(1), uint8(2)])

      expect(obj.get()).toStrictEqual([uint32(1), uint8(2)])
    })
  })

  describe('getNext', () => {
    test('null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = LinkedList.create(
        allocator
      , Uint8View
      , [null, uint8(1)]
      )

      const result = obj.getNext()

      expect(result).toBe(null)
    })

    test('number', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = LinkedList.create(
        allocator
      , Uint8View
      , [uint32(1), uint8(2)]
      )

      const result = obj.getNext()

      expect(result).toStrictEqual(uint32(1))
    })
  })

  describe('setNext', () => {
    test('null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = LinkedList.create(
        allocator
      , Uint8View
      , [uint32(1), uint8(2)]
      )

      obj.setNext(null)

      expect(obj.get()).toStrictEqual([null, uint8(2)])
    })

    test('number', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = LinkedList.create(
        allocator
      , Uint8View
      , [null, uint8(1)]
      )

      obj.setNext(uint32(2))

      expect(obj.get()).toStrictEqual([uint32(2), uint8(1)])
    })
  })

  test('getValue', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = LinkedList.create(
      allocator
    , Uint8View
    , [null, uint8(1)]
    )

    const result = obj.getValue()

    expect(result).toStrictEqual(uint8(1))
  })

  test('setValue', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = LinkedList.create(
      allocator
    , Uint8View
    , [null, uint8(1)]
    )

    obj.setValue(uint8(2))

    expect(obj.get()).toStrictEqual([null, uint8(2)])
  })

  test('getViewOfValue', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = LinkedList.create(
      allocator
    , Uint8View
    , [null, uint8(1)]
    )

    const result = obj.getViewOfValue()

    expect(result).toBeInstanceOf(Uint8View)
  })

  test('getViewOfNext', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = LinkedList.create(
      allocator
    , Uint8View
    , [uint32(50), uint8(1)]
    )

    const result = obj.getViewOfNext()

    expect(result).toBeInstanceOf(OwnershipPointerView)
  })

  describe('derefNext', () => {
    test('null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = LinkedList.create(
        allocator
      , Uint8View
      , [null, uint8(1)]
      )

      const result = obj.derefNext()

      expect(result).toBe(null)
    })

    test('non-null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = LinkedList.create(
        allocator
      , Uint8View
      , [uint32(50), uint8(1)]
      )

      const result = obj.derefNext()

      expect(result).toBeInstanceOf(LinkedListView)
    })
  })

  test('hash', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const view = new LinkedListView(allocator.buffer, 50, Uint8View)
    view.setValue(uint8(20))
    const obj = LinkedList.create(
      allocator
    , Uint8View
    , [uint32(50), uint8(10)]
    )
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    obj.hash(hasher)

    expect(hasher.write).toBeCalledTimes(3)
    expect(hasher.write).nthCalledWith(1, uint8ToBuffer(10))
    expect(hasher.write).nthCalledWith(2, uint8ToBuffer(20))
    expect(hasher.write).nthCalledWith(3, NULL)
  })
})
