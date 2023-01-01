import { Uint16View } from '@views/uint16-view'

describe('Uint16View', () => {
  test('byteLength', () => {
    const result = Uint16View.byteLength

    expect(result).toBe(Uint16Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Uint16View(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 10000
    const dataView = new DataView(buffer)
    dataView.setUint16(byteOffset, value)
    const doubleView = new Uint16View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 10000
    const doubleView = new Uint16View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getUint16(byteOffset)).toBe(value)
  })
})
