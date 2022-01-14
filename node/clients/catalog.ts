/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InstanceOptions, IOContext } from '@vtex/api'
import { JanusClient } from '@vtex/api'

const FOUR_SECONDS = 4 * 1000

export default class CatalogClient extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        VtexIdclientAutCookie: ctx.authToken,
      },
      timeout: FOUR_SECONDS,
    })
  }

  public getSpecifications = () =>
    this.http.get(this.routes.specifications(), {
      metric: 'catalogClient-getSpecifications',
    })

  public createSpecification = (name: string) =>
    this.http.post(
      this.routes.createSpecification(),
      {
        CategoryId: null,
        Name: name,
      },
      {
        metric: 'catalogClient-createSpecification',
      }
    )

  public createSpecificationField = (
    fieldGroupId: number,
    name: string,
    fieldTypeId: number
  ): Promise<any> =>
    this.http.post(
      this.routes.createSpecificationField(),
      {
        CategoryId: null,
        FieldGroupId: fieldGroupId,
        Name: name,
        IsFilter: false,
        IsRequired: false,
        IsOnProductDetails: false,
        IsStockKeepingUnit: false,
        IsActive: true,
        IsTopMenuLinkActive: false,
        IsSideMenuLinkActive: false,
        FieldTypeId: fieldTypeId,
      },
      {
        metric: 'catalogClient-createSpecificationField',
      }
    )

  public createSpecificationValue = (
    fieldId: number,
    name: string,
    position: number
  ) =>
    this.http.post(
      this.routes.createSpecificationValue(),
      {
        FieldId: fieldId,
        Name: name,
        IsActive: true,
        Position: position,
      },
      {
        metric: 'catalogClient-createSpecificationValue',
      }
    )

  public getSkus = (page: number, pageSize: number) =>
    this.http.get(this.routes.skus(page, pageSize), {
      metric: 'catalogClient-getSkus',
    })

  public getProductBySku = (sku: number) =>
    this.http.get(this.routes.productBySku(sku), {
      metric: 'catalogClient-getProductBySku',
    })

  public getProductById = (productId: number) =>
    this.http.get(this.routes.productById(productId), {
      metric: 'catalogClient-getProductById',
    })

  public getProductSpecifications = (productId: number) =>
    this.http.get(this.routes.productSpecifications(productId), {
      metric: 'catalogClient-getProductSpecifications',
    })

  public getSalesChannel = (salesChannel: string) =>
    this.http.get(this.routes.salesChannelById(salesChannel), {
      metric: 'catalogClient-getSalesChannel',
    })

  private get routes() {
    return {
      root: () => '/api',
      specifications: () =>
        `${this.routes.root()}/catalog_system/pvt/specification/groupbycategory/0`,
      createSpecification: () =>
        `${this.routes.root()}/catalog_system/pvt/specification/group`,
      createSpecificationField: () =>
        `${this.routes.root()}/catalog/pvt/specification`,
      createSpecificationValue: () =>
        `${this.routes.root()}/catalog/pvt/specificationvalue`,
      skus: (page: number, pageSize: number) =>
        `${this.routes.root()}/catalog_system/pvt/sku/stockkeepingunitids?page=${page}&pagesize=${pageSize}`,
      productBySku: (sku: number) =>
        `${this.routes.root()}/catalog/pvt/stockkeepingunit/${sku}`,
      productById: (productId: number) =>
        `${this.routes.root()}/catalog/pvt/product/${productId}`,
      productSpecifications: (productId: number) =>
        `${this.routes.root()}/catalog_system/pvt/products/${productId}/specification`,
      salesChannelById: (salesChannel: string) =>
        `${this.routes.root()}/catalog_system/pub/saleschannel/${salesChannel}`,
    }
  }
}
