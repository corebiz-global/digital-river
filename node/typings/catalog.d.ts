interface Product {
  Id: number
  ProductId: number
  IsActive: boolean
  Name: string
  TaxCode: string
}

interface Specification {
  Value: string[]
  Id: number
  Name: string
}

interface SkuSync {
  skuId: number
  origin: string
}
