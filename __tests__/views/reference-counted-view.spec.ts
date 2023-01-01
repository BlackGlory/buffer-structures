import { ReferenceCountedView } from '@views/reference-counted-view'
import { PointerView } from '@views/pointer-view'
import { Uint8View } from '@views/uint8-view'

describe('ReferenceCountedView', () => {
  test('byteLength', () => {
    const result = ReferenceCountedView.byteLength

    expect(result).toBe(Uint32Array.BYTES_PER_ELEMENT + PointerView.byteLength)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new ReferenceCountedView(buffer, byteOffset, Uint8View)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  describe('get', () => {
    test('value: null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = 0
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, count)
      dataView.setUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
      const rcView = new ReferenceCountedView(buffer, byteOffset, Uint8View)

      const result = rcView.get()

      expect(result).toStrictEqual({
        count
      , value: null
      })
    })

    test('value: number', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = 1000000
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, count)
      dataView.setUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
      const rcView = new ReferenceCountedView(buffer, byteOffset, Uint8View)

      const result = rcView.get()

      expect(result).toStrictEqual({ count, value })
    })
  })

  describe('set', () => {
    test('value: null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = null
      const rcView = new ReferenceCountedView(buffer, byteOffset, Uint8View)

      rcView.set({ count, value })

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(count)
      expect(dataView.getUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT)).toBe(0)
    })

    test('value: number', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = 1000000
      const rcView = new ReferenceCountedView(buffer, byteOffset, Uint8View)

      rcView.set({ count, value })

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(count)
      expect(dataView.getUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT)).toBe(value)
    })
  })

  test('getCount', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const count = 1
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, count)
    const rcView = new ReferenceCountedView(buffer, byteOffset, Uint8View)

    const result = rcView.getCount()

    expect(result).toBe(count)
  })

  test('setCount', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const count = 1
    const rcView = new ReferenceCountedView(buffer, byteOffset, Uint8View)

    rcView.setCount(count)

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(count)
  })

  test('getValue', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1000000
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
    const rcView = new ReferenceCountedView(buffer, byteOffset, Uint8View)

    const result = rcView.getValue()

    expect(result).toBe(value)
  })

  test('setValue', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1000000
    const rcView = new ReferenceCountedView(buffer, byteOffset, Uint8View)

    rcView.setValue(value)

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT)).toBe(value)
  })

  describe('deref', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = 0
      const dataView = new DataView(buffer)
      dataView.setUint8(value, 100)
      dataView.setUint32(byteOffset, count)
      dataView.setUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
      const rcView = new ReferenceCountedView(buffer, byteOffset, Uint8View)

      const result = rcView.deref()

      expect(result).toBe(null)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const count = 1
      const value = 50
      const dataView = new DataView(buffer)
      dataView.setUint8(value, 100)
      dataView.setUint32(byteOffset, count)
      dataView.setUint32(byteOffset + Uint32Array.BYTES_PER_ELEMENT, value)
      const rcView = new ReferenceCountedView(buffer, byteOffset, Uint8View)

      const result = rcView.deref()

      expect(result).toBeInstanceOf(Uint8View)
      expect(result!.byteOffset).toBe(value)
      expect(result!.get()).toBe(100)
    })
  })
})
