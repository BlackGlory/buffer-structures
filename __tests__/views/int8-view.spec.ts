import { Int8View } from '@views/int8-view'

describe('Int8View', () => {
  test('byteLength', () => {
    const result = Int8View.byteLength

    expect(result).toBe(Int8Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Int8View(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -127
    const dataView = new DataView(buffer)
    dataView.setInt8(byteOffset, value)
    const doubleView = new Int8View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -127
    const doubleView = new Int8View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getInt8(byteOffset)).toBe(value)
  })
})
