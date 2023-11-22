import { go } from '@blackglory/prelude'
import { Allocator, HashMap, Uint16View, uint16 } from '../lib/index.js'
import { Benchmark } from 'extra-benchmark'
import { MB } from './utils.js'

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
        allocator = new Allocator(new ArrayBuffer(50 * MB))
        map = HashMap.create(allocator, Uint16View, Uint16View, { capacity: 20000 })
      }
    , iterate() {
        for (let i = 0; i < count; i++) {
          map.set(uint16(i), uint16(i))
        }
      }
    }
  })

  benchmark.addCase('Map#has', () => {
    const count = 10000
    const map = new Map<number, number>()
    for (let i = 0; i < count; i += 2) {
      map.set(i, i)
    }

    return () => {
      for (let i = 0; i < count; i++) {
        map.has(i)
      }
    }
  })

  benchmark.addCase('HashMap#has', () => {
    const count = 10000
    const allocator = new Allocator(new ArrayBuffer(50 * MB))
    const map = HashMap.create(allocator, Uint16View, Uint16View)
    for (let i = 0; i < count; i += 2) {
      map.set(uint16(i), uint16(i))
    }

    return () => {
      for (let i = 0; i < count; i++) {
        map.has(uint16(i))
      }
    }
  })

  console.log(`Benchmark: ${benchmark.name}`)
  for await (const result of benchmark.run()) {
    console.log(result)
  }
})
