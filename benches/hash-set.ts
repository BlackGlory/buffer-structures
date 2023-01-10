import { go } from '@blackglory/go'
import { Allocator, HashSet, Uint16View, uint16 } from '..'
import { Benchmark } from 'extra-benchmark'
import { MB } from './utils'

const benchmark = new Benchmark('HashSet')

go(async () => {
  benchmark.addCase('Set#set', () => {
    const count = 10000
    const map = new Set<number>()

    return {
      beforeEach() {
        map.clear()
      }
    , iterate() {
        for (let i = 0; i < count; i++) {
          map.add(i)
        }
      }
    }
  })

  benchmark.addCase('HashSet#set', () => {
    const count = 10000
    let allocator: Allocator<ArrayBuffer>
    let map: HashSet<Uint16View>

    debugger
    return {
      beforeEach() {
        allocator = new Allocator(new ArrayBuffer(50 * MB))
        map = new HashSet(allocator, Uint16View)
      }
    , iterate() {
        for (let i = 0; i < count; i++) {
          map.add(uint16(i))
        }
      }
    }
  })

  console.log(`Benchmark: ${benchmark.name}`)
  for await (const result of benchmark.run()) {
    console.log(result)
  }
})
