import { LinkedList } from '@objects/linked-list'
import { LinkedListView } from '@views/linked-list-view'
import { Uint8View } from '@views/uint8-view'
import { IAllocator } from '@src/types'
import { getError } from 'return-style'
import { Allocator } from '@src/allocator'

describe('LinkedList', () => {
  test('create', () => {
    const allocator = {
      buffer: new ArrayBuffer(100)
    , allocate: jest.fn()
    , free: jest.fn()
    } satisfies IAllocator

    new LinkedList(
      allocator
    , Uint8View
    , {
        next: null
      , value: 1
      }
    )

    expect(allocator.allocate).toBeCalledTimes(1)
    expect(allocator.allocate).toBeCalledWith(LinkedListView.getByteLength(Uint8View))
  })

  describe('destory', () => {
    it('calls allocator.free()', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const result = new LinkedList(
        allocator
      , Uint8View
      , {
          next: null
        , value: 1
        }
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
      const result = new LinkedList(
        allocator
      , Uint8View
      , {
          next: null
        , value: 1
        }
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
        const obj1 = new LinkedList(
          allocator
        , Uint8View
        , {
            next: null
          , value: 1
          }
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
        const obj1 = new LinkedList(
          allocator
        , Uint8View
        , {
            next: null
          , value: 1
          }
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
    const obj = new LinkedList(
      allocator
    , Uint8View
    , {
        next: null
      , value: 1
      }
    )

    const result = obj.clone()

    expect(result).not.toBe(obj)
    expect(result._view.byteOffset).toBe(obj._view.byteOffset)
    expect(result._counter).toBe(obj._counter)
    expect(result._counter._count).toBe(2)
  })

  test('copy', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new LinkedList(
      allocator
    , Uint8View
    , {
        next: null
      , value: 1
      }
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
      const obj = new LinkedList(
        allocator
      , Uint8View
      , {
          next: null
        , value: 1
        }
      )

      const result = obj.get()

      expect(result).toStrictEqual({
        next: null
      , value: 1
      })
    })

    test('next: number', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new LinkedList(
        allocator
      , Uint8View
      , {
          next: 1
        , value: 2
        }
      )

      const result = obj.get()

      expect(result).toStrictEqual({
        next: 1
      , value: 2
      })
    })
  })

  describe('set', () => {
    test('next: null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new LinkedList(
        allocator
      , Uint8View
      , {
          next: 1
        , value: 2
        }
      )

      obj.set({
        next: null
      , value: 1
      })

      expect(obj.get()).toStrictEqual({
        next: null
      , value: 1
      })
    })

    test('next: number', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new LinkedList(
        allocator
      , Uint8View
      , {
          next: null
        , value: 1
        }
      )

      obj.set({
        next: 1
      , value: 2
      })

      expect(obj.get()).toStrictEqual({
        next: 1
      , value: 2
      })
    })
  })

  describe('getNext', () => {
    test('null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new LinkedList(
        allocator
      , Uint8View
      , {
          next: null
        , value: 1
        }
      )

      const result = obj.getNext()

      expect(result).toBe(null)
    })

    test('number', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new LinkedList(
        allocator
      , Uint8View
      , {
          next: 1
        , value: 2
        }
      )

      const result = obj.getNext()

      expect(result).toBe(1)
    })
  })

  describe('setNext', () => {
    test('null', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new LinkedList(
        allocator
      , Uint8View
      , {
          next: 1
        , value: 2
        }
      )

      obj.setNext(null)

      expect(obj.get()).toStrictEqual({
        next: null
      , value: 2
      })
    })

    test('number', () => {
      const allocator = new Allocator(new ArrayBuffer(100))
      const obj = new LinkedList(
        allocator
      , Uint8View
      , {
          next: null
        , value: 1
        }
      )

      obj.setNext(2)

      expect(obj.get()).toStrictEqual({
        next: 2
      , value: 1
      })
    })
  })

  test('getValue', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new LinkedList(
      allocator
    , Uint8View
    , {
        next: null
      , value: 1
      }
    )

    const result = obj.getValue()

    expect(result).toBe(1)
  })

  test('setValue', () => {
    const allocator = new Allocator(new ArrayBuffer(100))
    const obj = new LinkedList(
      allocator
    , Uint8View
    , {
        next: null
      , value: 1
      }
    )

    obj.setValue(2)

    expect(obj.get()).toStrictEqual({
      next: null
    , value: 2
    })
  })
})
