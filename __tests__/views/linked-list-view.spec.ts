import { LinkedListView } from '@views/linked-list-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { Uint8View } from '@views/uint8-view'
import { uint8ToBuffer } from '@test/utils'
import { IAllocator, IHasher } from '@src/interfaces'
import { BaseView } from '@views/base-view'
import { NULL } from '@src/null'
import { uint8 } from '@literals/uint8-literal'
import { uint32 } from '@literals/uint32-literal'

describe('LinkedListView', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new LinkedListView(buffer, 0, Uint8View)

    expect(result).toBeInstanceOf(BaseView)
  })

  test('getByteLength', () => {
    const result = LinkedListView.getByteLength(Uint8View)

    expect(result).toBe(Uint8View.byteLength + OwnershipPointerView.byteLength)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new LinkedListView(buffer, byteOffset, Uint8View)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('free', () => {
    const allocator = {
      buffer: new ArrayBuffer(100)
    , allocate: jest.fn()
    , free: jest.fn()
    } satisfies IAllocator
    const byteOffset = 1
    const view = new LinkedListView(allocator.buffer, byteOffset, Uint8View)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, view.byteLength)
  })

  describe('get', () => {
    test('next: null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const next = 1
      const value = 2
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, next)
      dataView.setUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
      const view = new LinkedListView(buffer, byteOffset, Uint8View)

      const result = view.get()

      expect(result).toStrictEqual([uint32(next), uint8(value)])
    })

    test('next: number', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const next = 1
      const value = 2
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, next)
      dataView.setUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
      const view = new LinkedListView(buffer, byteOffset, Uint8View)

      const result = view.get()

      expect(result).toStrictEqual([uint32(next), uint8(value)])
    })
  })

  describe('set', () => {
    test('next: null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const next = null
      const value = uint8(1)
      const view = new LinkedListView(buffer, byteOffset, Uint8View)

      view.set([next, value])

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(0)
      expect(dataView.getUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT)).toBe(1)
    })

    test('next: number', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const next = uint32(1)
      const value = uint8(2)
      const view = new LinkedListView(buffer, byteOffset, Uint8View)

      view.set([next, value])

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(1)
      expect(dataView.getUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT)).toBe(2)
    })
  })

  test('getNext', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const next = 1
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, next)
    const view = new LinkedListView(buffer, byteOffset, Uint8View)

    const result = view.getNext()

    expect(result).toStrictEqual(uint32(next))
  })

  test('setNext', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const next = uint32(1)
    const view = new LinkedListView(buffer, byteOffset, Uint8View)

    view.setNext(next)

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(1)
  })

  test('getValue', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
    const view = new LinkedListView(buffer, byteOffset, Uint8View)

    const result = view.getValue()

    expect(result).toStrictEqual(uint8(value))
  })

  test('setValue', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = uint8(1)
    const view = new LinkedListView(buffer, byteOffset, Uint8View)

    view.setValue(value)

    const dataView = new DataView(buffer)
    expect(dataView.getUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT)).toBe(1)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const view1 = new LinkedListView(buffer, 1, Uint8View)
    const view2 = new LinkedListView(buffer, 50, Uint8View)
    view1.setNext(uint32(view2.byteOffset))
    view1.setValue(uint8(10))
    view2.setValue(uint8(20))
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view1.hash(hasher)

    expect(hasher.write).toBeCalledTimes(3)
    expect(hasher.write).nthCalledWith(1, uint8ToBuffer(10))
    expect(hasher.write).nthCalledWith(2, uint8ToBuffer(20))
    expect(hasher.write).nthCalledWith(3, NULL)
  })

  test('getViewOfValue', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
    const linkedListView = new LinkedListView(buffer, byteOffset, Uint8View)

    const result = linkedListView.getViewOfValue()

    expect(result).toBeInstanceOf(Uint8View)
    expect(result.byteOffset).toBe(byteOffset + Uint32Array.BYTES_PER_ELEMENT)
  })

  test('getViewOfNext', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 50
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, value)
    const linkedListView = new LinkedListView(buffer, byteOffset, Uint8View)

    const result = linkedListView.getViewOfNext()

    expect(result).toBeInstanceOf(OwnershipPointerView)
    expect(result.byteOffset).toBe(byteOffset)
  })

  describe('derefNext', () => {
    test('next: null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const view = new LinkedListView(buffer, byteOffset, Uint8View)
      view.setNext(null)

      const result = view.derefNext()

      expect(result).toBe(null)
    })

    test('next: number', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const view = new LinkedListView(buffer, byteOffset, Uint8View)
      view.setNext(uint32(50))

      const result = view.derefNext()

      expect(result).toBeInstanceOf(LinkedListView)
      expect(result!.byteOffset).toBe(50)
    })
  })
})
