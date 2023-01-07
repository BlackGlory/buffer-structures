import { ArrayView } from '@views/array-view'
import { Uint8View } from '@views/uint8-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { uint8ToBuffer } from '@test/utils'
import { IAllocator, IHasher } from '@src/types'

describe('ArrayView', () => {
  test('getByteLength', () => {
    const result = ArrayView.getByteLength(Uint8View, 3)

    expect(result).toBe(Uint8View.byteLength * 3)
  })

  test('byteLength', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new ArrayView(buffer, byteOffset, Uint8View, 3)

    const result = view.byteLength

    expect(result).toBe(Uint8View.byteLength * 3)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new ArrayView(buffer, byteOffset, Uint8View, 3)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  describe('free', () => {
    test('without ownership pointers', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      const byteOffset = 1
      const view = new ArrayView(allocator.buffer, byteOffset, Uint8View, 3)

      view.free(allocator)

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(byteOffset)
    })

    test('with ownership pointers', () => {
      const allocator = {
        buffer: new ArrayBuffer(100)
      , allocate: jest.fn()
      , free: jest.fn()
      } satisfies IAllocator
      class Uint8OwnershipPointerView extends OwnershipPointerView<Uint8View> {
        constructor(buffer: ArrayBufferLike, byteOffset: number) {
          super(buffer, byteOffset, Uint8View)
        }
      }
      const view = new ArrayView(allocator.buffer, 10, Uint8OwnershipPointerView, 2)
      view.setByIndex(0, 20)
      view.setByIndex(1, 30)

      view.free(allocator)

      expect(allocator.free).toBeCalledTimes(3)
      expect(allocator.free).nthCalledWith(1, 20)
      expect(allocator.free).nthCalledWith(2, 30)
      expect(allocator.free).nthCalledWith(3, 10)
    })
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, 1)
    dataView.setUint8(byteOffset + Uint8View.byteLength, 2)
    dataView.setUint8(byteOffset + Uint8View.byteLength * 2, 3)
    const arrayView = new ArrayView(buffer, byteOffset, Uint8View, 3)

    const result = arrayView.get()

    expect(result).toStrictEqual([1, 2, 3])
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const arrayView = new ArrayView(buffer, byteOffset, Uint8View, 3)

    arrayView.set([1, 2, 3])

    const dataView = new DataView(buffer)
    expect(dataView.getUint8(byteOffset)).toBe(1)
    expect(dataView.getUint8(byteOffset + Uint8View.byteLength)).toBe(2)
    expect(dataView.getUint8(byteOffset + Uint8View.byteLength * 2)).toBe(3)
  })

  test('getByIndex', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, 1)
    dataView.setUint8(byteOffset + Uint8Array.BYTES_PER_ELEMENT, 2)
    dataView.setUint8(byteOffset + Uint8Array.BYTES_PER_ELEMENT * 2, 3)
    const arrayView = new ArrayView(buffer, byteOffset, Uint8View, 3)

    const result = arrayView.getByIndex(1)

    expect(result).toBe(2)
  })

  test('setByIndex', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const arrayView = new ArrayView(buffer, byteOffset, Uint8View, 3)

    arrayView.setByIndex(1, 2)

    const dataView = new DataView(buffer)
    expect(dataView.getUint8(byteOffset + Uint8Array.BYTES_PER_ELEMENT)).toBe(2)
  })

  test('getViewByIndex', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, 1)
    dataView.setUint8(byteOffset + Uint8Array.BYTES_PER_ELEMENT, 2)
    const tupleView = new ArrayView(buffer, byteOffset, Uint8View, 2)

    const view1 = tupleView.getViewByIndex(0)
    const view2 = tupleView.getViewByIndex(1)

    expect(view1).toBeInstanceOf(Uint8View)
    expect(view1.byteOffset).toBe(byteOffset)
    expect(view2).toBeInstanceOf(Uint8View)
    expect(view2.byteOffset).toBe(byteOffset + Uint8Array.BYTES_PER_ELEMENT)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new ArrayView(buffer, byteOffset, Uint8View, 2)
    view.setByIndex(0, 1)
    view.setByIndex(1, 2)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(2)
    expect(hasher.write).nthCalledWith(1, uint8ToBuffer(1))
    expect(hasher.write).nthCalledWith(2, uint8ToBuffer(2))
  })
})
