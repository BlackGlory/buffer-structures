import { StringLiteral, string } from '@literals/string-literal'
import { IHasher } from '@src/interfaces'
import { BaseLiteral } from '@literals/base-literal'

test('string', () => {
  const result = string('foo')

  expect(result).toBeInstanceOf(StringLiteral)
  expect(result.get()).toBe('foo')
})

describe('StringLiteral', () => {
  test('create', () => {
    const result = new StringLiteral('foo')

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe('foo')
  })

  test('get', () => {
    const literal = new StringLiteral('foo')

    const result = literal.get()

    expect(result).toBe('foo')
  })

  test('hash', () => {
    const literal = new StringLiteral('foo')
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(Buffer.from('foo').buffer)
  })
})
