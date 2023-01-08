import { Uint8Literal, uint8 } from '@literals/uint8'
import { IHasher } from '@src/types'
import { uint8ToBuffer } from '@test/utils'
import { BaseLiteral } from '@literals/base-literal'

test('uint8', () => {
  const result = uint8(1)

  expect(result).toBeInstanceOf(Uint8Literal)
  expect(result.get()).toBe(1)
})

describe('Uint8Literal', () => {
  test('create', () => {
    const result = new Uint8Literal(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new Uint8Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('set', () => {
    const literal = new Uint8Literal(1)

    literal.set(2)

    expect(literal.get()).toBe(2)
  })

  test('hash', () => {
    const literal = new Uint8Literal(1)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(uint8ToBuffer(1))
  })
})
