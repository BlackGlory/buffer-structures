import { DoubleLiteral, double } from '@literals/double-literal'
import { IHasher } from '@src/interfaces'
import { float64ToBuffer } from '@test/utils'
import { BaseLiteral } from '@literals/base-literal'

test('double', () => {
  const result = double(1)

  expect(result).toBeInstanceOf(DoubleLiteral)
  expect(result.get()).toBe(1)
})

describe('DoubleLiteral', () => {
  test('create', () => {
    const result = new DoubleLiteral(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new DoubleLiteral(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('set', () => {
    const literal = new DoubleLiteral(1)

    literal.set(2)

    expect(literal.get()).toBe(2)
  })

  test('hash', () => {
    const literal = new DoubleLiteral(1)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(float64ToBuffer(1))
  })
})
