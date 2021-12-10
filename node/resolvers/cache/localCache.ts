import LRU from 'lru-cache'

export const LRUCache = new LRU({ max: 10000 })
