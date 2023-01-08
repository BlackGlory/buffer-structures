import { go } from '@blackglory/go'
import { Allocator, HashMap, Uint16View, uint16 } from '..'
import { Benchmark } from 'extra-benchmark'

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

    return {
      beforeEach() {
        allocator = new Allocator(new ArrayBuffer(Uint16View.byteLength * count * count))
        map = new HashMap(allocator, Uint16View, count)
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
