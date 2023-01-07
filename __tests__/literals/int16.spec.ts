import { Int16Literal, int16 } from '@literals/int16'
import { IHasher } from '@src/types'
import { int16ToBuffer } from '@test/utils'

test('int16', () => {
  const result = int16(1)

  expect(result).toBeInstanceOf(Int16Literal)
  expect(result.get()).toBe(1)
})

describe('Int16Literal', () => {
  test('get', () => {
    const literal = new Int16Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('set', () => {
    const literal = new Int16Literal(1)

    literal.set(2)

    expect(literal.get()).toBe(2)
  })

  test('hash', () => {
    const literal = new Int16Literal(1)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(int16ToBuffer(1))
  })
})
