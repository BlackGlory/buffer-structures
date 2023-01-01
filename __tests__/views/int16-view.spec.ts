import { Int16View } from '@views/int16-view'

describe('Int16View', () => {
  test('byteLength', () => {
    const result = Int16View.byteLength

    expect(result).toBe(Int16Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Int16View(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -10000
    const dataView = new DataView(buffer)
    dataView.setInt16(byteOffset, value)
    const doubleView = new Int16View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -10000
    const doubleView = new Int16View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getInt16(byteOffset)).toBe(value)
  })
})
