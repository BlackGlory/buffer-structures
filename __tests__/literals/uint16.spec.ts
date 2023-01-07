import { Uint16Literal, uint16 } from '@literals/uint16'
import { IHasher } from '@src/types'
import { uint16ToBuffer } from '@test/utils'

test('uint16', () => {
  const result = uint16(1)

  expect(result).toBeInstanceOf(Uint16Literal)
  expect(result.get()).toBe(1)
})

describe('Uint16Literal', () => {
  test('get', () => {
    const literal = new Uint16Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('set', () => {
    const literal = new Uint16Literal(1)

    literal.set(2)

    expect(literal.get()).toBe(2)
  })

  test('hash', () => {
    const literal = new Uint16Literal(1)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(uint16ToBuffer(1))
  })
})
