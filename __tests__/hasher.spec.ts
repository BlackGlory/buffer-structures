import { Hasher } from '@src/hasher'
import { NULL } from '@src/null'
import { bytesToBuffer } from '@test/utils'

describe('Hasher', () => {
  test('create, write, finish', () => {
    const hasher = new Hasher()
    hasher.write(NULL)
    const result = hasher.finish()

    expect(result).toBe(3047844597)
  })

  test('separator', () => {
    const hasher1 = new Hasher()
    hasher1.write(bytesToBuffer([1]))
    hasher1.write(bytesToBuffer([2]))
    const result1 = hasher1.finish()
    const hasher2 = new Hasher()
    hasher2.write(bytesToBuffer([1, 2]))
    const result2 = hasher2.finish()

    expect(result1).not.toBe(result2)
  })
})
