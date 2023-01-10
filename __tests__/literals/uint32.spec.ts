import { Uint32Literal, uint32 } from '@literals/uint32'
import { IHasher } from '@src/interfaces'
import { uint32ToBuffer } from '@test/utils'
import { BaseLiteral } from '@literals/base-literal'

test('uint32', () => {
  const result = uint32(1)

  expect(result).toBeInstanceOf(Uint32Literal)
  expect(result.get()).toBe(1)
})

describe('Uint32Literal', () => {
  test('create', () => {
    const result = new Uint32Literal(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new Uint32Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('set', () => {
    const literal = new Uint32Literal(1)

    literal.set(2)

    expect(literal.get()).toBe(2)
  })

  test('hash', () => {
    const literal = new Uint32Literal(1)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(uint32ToBuffer(1))
  })
})
