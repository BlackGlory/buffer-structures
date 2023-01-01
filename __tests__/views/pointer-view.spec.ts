import { PointerView } from '@views/pointer-view'
import { Uint8View } from '@views/uint8-view'

describe('PointerView', () => {
  test('byteLength', () => {
    const result = PointerView.byteLength

    expect(result).toBe(Uint32Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new PointerView(buffer, byteOffset, Uint8View)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  describe('get', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 0
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, value)
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.get()

      expect(result).toBe(null)
    })

    test('number', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 1000000
      const dataView = new DataView(buffer)
      dataView.setUint32(byteOffset, value)
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.get()

      expect(result).toBe(value)
    })
  })

  describe('set', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = null
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      pointerView.set(value)

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(0)
    })

    test('number', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 1000000
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      pointerView.set(value)

      const dataView = new DataView(buffer)
      expect(dataView.getUint32(byteOffset)).toBe(value)
    })
  })

  describe('deref', () => {
    test('null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 0
      const dataView = new DataView(buffer)
      dataView.setUint8(value, 100)
      dataView.setUint32(byteOffset, value)
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.deref()

      expect(result).toBe(null)
    })

    test('non-null', () => {
      const buffer = new ArrayBuffer(100)
      const byteOffset = 1
      const value = 50
      const dataView = new DataView(buffer)
      dataView.setUint8(value, 100)
      dataView.setUint32(byteOffset, value)
      const pointerView = new PointerView(buffer, byteOffset, Uint8View)

      const result = pointerView.deref()

      expect(result).toBeInstanceOf(Uint8View)
      expect(result!.byteOffset).toBe(value)
      expect(result!.get()).toBe(100)
    })
  })
})
