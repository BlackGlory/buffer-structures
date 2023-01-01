import { Uint8View } from '@views/uint8-view'

describe('Uint8View', () => {
  test('byteLength', () => {
    const result = Uint8View.byteLength

    expect(result).toBe(Uint8Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Uint8View(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 255
    const dataView = new DataView(buffer)
    dataView.setUint8(byteOffset, value)
    const doubleView = new Uint8View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 255
    const doubleView = new Uint8View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getUint8(byteOffset)).toBe(value)
  })
})
