import { go } from '@blackglory/go'
import { Allocator, HashMap, Uint16View, uint16 } from '..'
import { Benchmark } from 'extra-benchmark'
import { MB } from './utils'

const benchmark = new Benchmark('HashMap')

go(async () => {
  benchmark.addCase('Map#set', () => {
    const count = 10000
    const map = new Map<number, number>()

    return {
      beforeEach() {
        map.clear()
      }
    , iterate() {
        for (let i = 0; i < count; i++) {
          map.set(i, i)
        }
      }
    }
  })

  benchmark.addCase('HashMap#set', () => {
    const count = 10000
    let allocator: Allocator<ArrayBuffer>
    let map: HashMap<Uint16View, Uint16View>

    debugger
    return {
      beforeEach() {
        allocator = new Allocator(new ArrayBuffer(50 * MB))
        map = new HashMap(allocator, Uint16View)
      }
    , iterate() {
        for (let i = 0; i < count; i++) {
          map.set(uint16(i), uint16(i))
        }
      }
    }
  })

  console.log(`Benchmark: ${benchmark.name}`)
  for await (const result of benchmark.run()) {
    console.log(result)
  }
})
