import { LinkedListView } from '@views/linked-list-view'
import { PointerView } from '@views/pointer-view'
import { Uint8View } from '@views/uint8-view'
import { uint8ToBytes } from '@test/utils'
import { IHasher } from '@src/types'

describe('LinkedListView', () => {
  test('getByteLength', () => {
    const result = LinkedListView.getByteLength(Uint8View)

    expect(result).toBe(Uint8View.byteLength + PointerView.byteLength)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new LinkedListView(buffer, byteOffset, Uint8View)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
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
      const rcView = new LinkedListView(buffer, byteOffset, Uint8View)

      const result = rcView.get()

      expect(result).toStrictEqual({ value, next })
    })

    test('next: number', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const next = 1
      const value = 2
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, next)
      dataView.setUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
      const rcView = new LinkedListView(buffer, byteOffset, Uint8View)

      const result = rcView.get()

      expect(result).toStrictEqual({ value, next })
    })
  })

  describe('set', () => {
    test('next: null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const next = null
      const value = 1
      const rcView = new LinkedListView(buffer, byteOffset, Uint8View)

      rcView.set({ next, value })

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(0)
      expect(dataView.getUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT)).toBe(1)
    })

    test('next: number', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const next = 1
      const value = 2
      const rcView = new LinkedListView(buffer, byteOffset, Uint8View)

      rcView.set({ next, value })

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(next)
      expect(dataView.getUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT)).toBe(value)
    })
  })

  test('getNext', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const next = 1
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, next)
    const rcView = new LinkedListView(buffer, byteOffset, Uint8View)

    const result = rcView.getNext()

    expect(result).toBe(next)
  })

  test('setNext', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const next = 1
    const rcView = new LinkedListView(buffer, byteOffset, Uint8View)

    rcView.setNext(next)

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(next)
  })

  test('getValue', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
    const rcView = new LinkedListView(buffer, byteOffset, Uint8View)

    const result = rcView.getValue()

    expect(result).toBe(value)
  })

  test('setValue', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1
    const rcView = new LinkedListView(buffer, byteOffset, Uint8View)

    rcView.setValue(value)

    const dataView = new DataView(buffer)
    expect(dataView.getUint8(byteOffset + Uint32Array.BYTES_PER_ELEMENT)).toBe(value)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const view1 = new LinkedListView(buffer, 1, Uint8View)
    const view2 = new LinkedListView(buffer, 50, Uint8View)
    view1.setNext(view2.byteOffset)
    view1.setValue(10)
    view2.setValue(20)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view1.hash(hasher)

    expect(hasher.write).toBeCalledTimes(3)
    expect(hasher.write).nthCalledWith(1, uint8ToBytes(10))
    expect(hasher.write).nthCalledWith(2, uint8ToBytes(20))
    expect(hasher.write).nthCalledWith(3, uint8ToBytes(0))
  })
})
