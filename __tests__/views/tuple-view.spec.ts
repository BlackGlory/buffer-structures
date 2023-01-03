import { TupleView } from '@views/tuple-view'
import { Uint8View } from '@views/uint8-view'
import { Uint16View } from '@views/uint16-view'
import { uint8ToBytes, uint16ToBytes } from '@test/utils'
import { IHasher } from '@src/types'

describe('TupleView', () => {
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

    expect(result).toStrictEqual([100, 1000])
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const tupleView = new TupleView(buffer, byteOffset, [
      Uint8View
    , Uint16View
    ])

    tupleView.set([100, 1000])

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

    expect(result).toBe(1000)
  })

  test('setByIndex', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const tupleView = new TupleView(buffer, byteOffset, [
      Uint8View
    , Uint16View
    ])

    tupleView.setByIndex(1, 1000)

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
    view.set([10, 20])
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(2)
    expect(hasher.write).nthCalledWith(1, uint8ToBytes(10))
    expect(hasher.write).nthCalledWith(2, uint16ToBytes(20))
  })
})
