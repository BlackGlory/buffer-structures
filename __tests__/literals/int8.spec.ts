import { Int8Literal, int8 } from '@literals/int8'
import { IHasher } from '@src/types'
import { int8ToBuffer } from '@test/utils'
import { BaseLiteral } from '@literals/base-literal'

test('int8', () => {
  const result = int8(1)

  expect(result).toBeInstanceOf(Int8Literal)
  expect(result.get()).toBe(1)
})

describe('Int8Literal', () => {
  test('create', () => {
    const result = new Int8Literal(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new Int8Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('set', () => {
    const literal = new Int8Literal(1)

    literal.set(2)

    expect(literal.get()).toBe(2)
  })

  test('hash', () => {
    const literal = new Int8Literal(1)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(int8ToBuffer(1))
  })
})
