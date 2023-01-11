import { TupleView } from '@views/tuple-view'
import { Uint8View } from '@views/uint8-view'
import { Uint16View } from '@views/uint16-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { uint8ToBuffer, uint16ToBuffer } from '@test/utils'
import { IAllocator, IHasher } from '@src/interfaces'
import { BaseView } from '@views/base-view'
import { uint8 } from '@literals/uint8-literal'
import { uint16 } from '@literals/uint16-literal'
import { uint32 } from '@literals/uint32-literal'

describe('TupleView', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new TupleView(buffer, 0, [
      Uint8View
    , Uint16View
    ])

    expect(result).toBeInstanceOf(BaseView)
  })

  test('getByteLength', () => {
    const result = TupleView.getByteLength([
      Uint8View
    , Uint16View
    ])

    expect(result).toBe(Uint8View.byteLength + Uint16View.byteLength)
  })

  test('byteLength', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new TupleView(buffer, byteOffset, [
      Uint8View
    , Uint16View
    ])

    const result = view.byteLength

    expect(result).toBe(Uint8View.byteLength + Uint16View.byteLength)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new TupleView(buffer, byteOffset, [
      Uint8View
    , Uint16View
    ])

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
      const view = new TupleView(allocator.buffer, byteOffset, [
        Uint8View
      , Uint16View
      ])

      view.free(allocator)

      expect(allocator.free).toBeCalledTimes(1)
      expect(allocator.free).toBeCalledWith(byteOffset, view.byteLength)
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
      const view = new TupleView(allocator.buffer, 10, [
        Uint8View
      , Uint8OwnershipPointerView
      ])
      view.setByIndex(1, uint32(20))

      view.free(allocator)

      expect(allocator.free).toBeCalledTimes(2)
      expect(allocator.free).nthCalledWith(1, 20, Uint8View.byteLength)
      expect(allocator.free).nthCalledWith(2, 10, view.byteLength)
    })
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, 100)
    dataView.setUint16(byteOffset + Uint8Array.BYTES_PER_ELEMENT, 1000)
    const tupleView = new TupleView(buffer, byteOffset, [
      Uint8View
    , Uint16View
    ])

    const result = tupleView.get()

    expect(result).toStrictEqual([uint8(100), uint16(1000)])
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const tupleView = new TupleView(buffer, byteOffset, [
      Uint8View
    , Uint16View
    ])

    tupleView.set([uint8(100), uint16(1000)])

    const dataView = new DataView(buffer)
    expect(dataView.getUint8(byteOffset)).toBe(100)
    expect(dataView.getUint16(byteOffset + Uint8Array.BYTES_PER_ELEMENT)).toBe(1000)
  })

  test('getByIndex', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, 100)
    dataView.setUint16(byteOffset + Uint8Array.BYTES_PER_ELEMENT, 1000)
    const tupleView = new TupleView(buffer, byteOffset, [
      Uint8View
    , Uint16View
    ])

    const result = tupleView.getByIndex(1)

    expect(result).toStrictEqual(uint16(1000))
  })

  test('setByIndex', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const tupleView = new TupleView(buffer, byteOffset, [
      Uint8View
    , Uint16View
    ])

    tupleView.setByIndex(1, uint16(1000))

    const dataView = new DataView(buffer)
    expect(dataView.getUint8(byteOffset)).toBe(0)
    expect(dataView.getUint16(byteOffset + Uint8Array.BYTES_PER_ELEMENT)).toBe(1000)
  })

  test('getViewByIndex', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, 100)
    dataView.setUint16(byteOffset + Uint8Array.BYTES_PER_ELEMENT, 1000)
    const tupleView = new TupleView(buffer, byteOffset, [
      Uint8View
    , Uint16View
    ])

    const view1 = tupleView.getViewByIndex(0)
    const view2 = tupleView.getViewByIndex(1)

    expect(view1).toBeInstanceOf(Uint8View)
    expect(view1.byteOffset).toBe(byteOffset)
    expect(view2).toBeInstanceOf(Uint16View)
    expect(view2.byteOffset).toBe(byteOffset + Uint8Array.BYTES_PER_ELEMENT)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new TupleView(buffer, byteOffset, [
      Uint8View
    , Uint16View
    ])
    view.set([uint8(10), uint16(20)])
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(2)
    expect(hasher.write).nthCalledWith(1, uint8ToBuffer(10))
    expect(hasher.write).nthCalledWith(2, uint16ToBuffer(20))
  })
})
