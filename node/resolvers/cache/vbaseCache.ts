import * as crypto from 'crypto'

import { LRUCache } from './localCache'

const TTL = {
  SHORT: 10 * 60 * 1000, // 10 minutes
  MEDIUM: 60 * 60 * 1000, // 1 hour
  LONG: 6 * 60 * 60 * 1000, // 6 hours
} as const

interface Cache {
  expires: number
  value: unknown
}

interface SetCacheParams {
  ctx: Context
  hash: string
  value: unknown
  ttl: keyof typeof TTL
}

const BUCKET = 'digitalriver-cache'

export const buildHash = (data: unknown) => {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
}

export const getCache = async (hash: string, ctx: Context) => {
  const {
    clients: { vbase },
    vtex: { logger },
  } = ctx

  const localCache = LRUCache.get(hash)

  if (localCache) {
    logger.info({
      data: { localCache },
      message: 'DigitalRiverCacheLog-memoryCacheUsed',
    })

    return localCache
  }

  let cache = null

  try {
    cache = await vbase.getJSON<Cache>(BUCKET, hash, true)
  } catch (error) {
    logger.warn({
      data: { error, hash },
      message: 'DigitalRiverCacheLog-vbaseCacheError',
    })
  }

  if (cache && cache.expires > Date.now()) {
    logger.info({
      data: { cache },
      message: 'DigitalRiverCacheLog-vbaseCacheUsed',
    })

    return cache.value
  }

  logger.info({
    data: { localCache },
    message: 'DigitalRiverCacheLog-noCacheFound',
  })

  return null
}

export const setCache = ({ ctx, hash, value, ttl }: SetCacheParams) => {
  const {
    clients: { vbase },
    vtex: { logger },
  } = ctx

  LRUCache.set(hash, value, TTL[ttl])

  const expires = Date.now() + TTL[ttl]
  const data = { value, expires }

  try {
    vbase.saveJSON<Cache>(BUCKET, hash, data)

    logger.info({
      data: { hash, data },
      message: 'DigitalRiverCacheLog-cacheSet',
    })
  } catch (error) {
    logger.warn({
      data: { error, hash, data },
      message: 'DigitalRiverCacheLog-cacheSetError',
    })
  }
}
