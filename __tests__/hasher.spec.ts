import { Hasher } from '@src/hasher'

describe('Hasher', () => {
  test('create, write, finish', () => {
    const hasher = new Hasher()
    hasher.write([0])
    const result = hasher.finish()

    expect(result).toBe(3047844597)
  })

  test('separator', () => {
    const hasher1 = new Hasher()
    hasher1.write([1])
    hasher1.write([2])
    const hasher2 = new Hasher()
    hasher2.write([1, 2])
    const result1 = hasher1.finish()
    const result2 = hasher2.finish()

    expect(result1).not.toBe(result2)
  })
})
