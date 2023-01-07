import { StructView } from '@views/struct-view'
import { Uint8View } from '@views/uint8-view'
import { Uint16View } from '@views/uint16-view'
import { uint8ToBytes, uint16ToBytes } from '@test/utils'
import { IAllocator, IHasher } from '@src/types'

describe('StructView', () => {
  test('getByteLength', () => {
    const result = StructView.getByteLength({
      foo: Uint8View
    , bar: Uint16View
    })

    expect(result).toBe(Uint8View.byteLength + Uint16View.byteLength)
  })

  test('byteLength', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new StructView(buffer, byteOffset, {
      foo: Uint8View
    , bar: Uint16View
    })

    const result = view.byteLength

    expect(result).toBe(Uint8View.byteLength + Uint16View.byteLength)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new StructView(buffer, byteOffset, {
      foo: Uint8View
    , bar: Uint16View
    })

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
    const view = new StructView(allocator.buffer, byteOffset, {
      foo: Uint8View
    , bar: Uint16View
    })

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, 100)
    dataView.setUint16(byteOffset + Uint8Array.BYTES_PER_ELEMENT, 1000)
    const structView = new StructView(buffer, byteOffset, {
      foo: Uint8View
    , bar: Uint16View
    })

    const result = structView.get()

    expect(result).toStrictEqual({
      foo: 100
    , bar: 1000
    })
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const structView = new StructView(buffer, byteOffset, {
      foo: Uint8View
    , bar: Uint16View
    })

    structView.set({
      foo: 100
    , bar: 1000
    })

    const dataView = new DataView(buffer)
    expect(dataView.getUint8(byteOffset)).toBe(100)
    expect(dataView.getUint16(byteOffset + Uint8Array.BYTES_PER_ELEMENT)).toBe(1000)
  })

  test('getByKey', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, 100)
    dataView.setUint16(byteOffset + Uint8Array.BYTES_PER_ELEMENT, 1000)
    const structView = new StructView(buffer, byteOffset, {
      foo: Uint8View
    , bar: Uint16View
    })

    const result = structView.getByKey('bar')

    expect(result).toBe(1000)
  })

  test('setByKey', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const structView = new StructView(buffer, byteOffset, {
      foo: Uint8View
    , bar: Uint16View
    })

    structView.setByKey('bar', 1000)

    const dataView = new DataView(buffer)
    expect(dataView.getUint8(byteOffset)).toBe(0)
    expect(dataView.getUint16(byteOffset + Uint8Array.BYTES_PER_ELEMENT)).toBe(1000)
  })

  test('getViewByKey', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, 100)
    dataView.setUint16(byteOffset + Uint8Array.BYTES_PER_ELEMENT, 1000)
    const structView = new StructView(buffer, byteOffset, {
      foo: Uint8View
    , bar: Uint16View
    })

    const view1 = structView.getViewByKey('foo')
    const view2 = structView.getViewByKey('bar')

    expect(view1).toBeInstanceOf(Uint8View)
    expect(view1.byteOffset).toBe(byteOffset)
    expect(view2).toBeInstanceOf(Uint16View)
    expect(view2.byteOffset).toBe(byteOffset + Uint8Array.BYTES_PER_ELEMENT)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new StructView(buffer, byteOffset, {
      foo: Uint8View
    , bar: Uint16View
    })
    view.set({
      foo: 10
    , bar: 20
    })
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(2)
    expect(hasher.write).nthCalledWith(1, uint8ToBytes(10))
    expect(hasher.write).nthCalledWith(2, uint16ToBytes(20))
  })
})
