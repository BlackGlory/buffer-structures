import { Int32View } from '@views/int32-view'

describe('Int32View', () => {
  test('byteLength', () => {
    const result = Int32View.byteLength

    expect(result).toBe(Int32Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Int32View(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -1000000
    const dataView = new DataView(buffer)
    dataView.setInt32(byteOffset, value)
    const doubleView = new Int32View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -1000000
    const doubleView = new Int32View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getInt32(byteOffset)).toBe(value)
  })
})
