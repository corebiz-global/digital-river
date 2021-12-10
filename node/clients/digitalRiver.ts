/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InstanceOptions, IOContext, IOResponse } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

export default class DigitalRiver extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('http://api.digitalriver.com', context, {
      ...options,
      timeout: 10000,
    })
  }

  // getCustomerById
  public async getCustomerById({
    settings,
    customerId,
  }: {
    settings: AppSettings
    customerId: string
  }): Promise<DRCustomersResponse> {
    return this.http.get(`/customers/${customerId}`, {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // getCustomers
  public async getCustomers({
    settings,
    email,
  }: {
    settings: AppSettings
    email: string
  }): Promise<DRCustomersResponse> {
    return this.http.get(`/customers?email=${email}`, {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // getTaxIds
  public async getTaxIds({
    settings,
    params,
  }: {
    settings: AppSettings
    params: any
  }): Promise<DRTaxIdentifiersResponse> {
    return this.http.get(`/tax-identifiers`, {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
      params,
    })
  }

  // createTaxId
  public async createTaxId({
    settings,
    taxIdBody,
  }: {
    settings: AppSettings
    taxIdBody: DRCreateTaxIdentifierRequest
  }): Promise<DRTaxIdentifierResponse> {
    return this.http.post(`/tax-identifiers`, JSON.stringify(taxIdBody), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // createCustomer
  public async createCustomer({
    settings,
    customerPayload,
  }: {
    settings: AppSettings
    customerPayload: DRCustomerPayload
  }): Promise<DRCustomerResponse> {
    return this.http.post(`/customers`, JSON.stringify(customerPayload), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // attachSourceCustomer
  public async attachSourceCustomer({
    settings,
    customerId,
    sourceId,
  }: {
    settings: AppSettings
    customerId: string
    sourceId: string
  }): Promise<DRCustomerResponse> {
    return this.http.post(
      `/customers/${customerId}/sources/${sourceId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${settings.digitalRiverToken}`,
          'Content-Type': `application/json`,
        },
      }
    )
  }

  // detachSourceCustomer
  public async detachSourceCustomer({
    settings,
    customerId,
    sourceId,
  }: {
    settings: AppSettings
    customerId: string
    sourceId: string
  }): Promise<any> {
    return this.http.delete(`/customers/${customerId}/sources/${sourceId}`, {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // createCheckout
  public async createCheckout({
    settings,
    checkoutPayload,
  }: {
    settings: AppSettings
    checkoutPayload: DRCheckoutPayload
  }): Promise<DRCheckoutResponse> {
    return this.http.post(`/checkouts`, JSON.stringify(checkoutPayload), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // get Checkout
  public async getCheckout({
    settings,
    checkoutId,
  }: {
    settings: AppSettings
    checkoutId: string
  }): Promise<any> {
    return this.http.get(`/checkouts/${checkoutId}`, {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // delete Checkout
  public async deleteCheckout({
    settings,
    checkoutId,
  }: {
    settings: AppSettings
    checkoutId: string
  }): Promise<any> {
    return this.http.delete(`/checkouts/${checkoutId}`, {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // createSource
  public async createSource({
    settings,
    payload,
  }: {
    settings: AppSettings
    payload: DRSourcePayload
  }): Promise<DRSourceResponse> {
    return this.http.post(`/sources`, JSON.stringify(payload), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // updateCheckoutWithEmailAndSource
  public async updateCheckoutWithSource({
    settings,
    checkoutId,
    sourceId,
  }: {
    settings: AppSettings
    checkoutId: string
    sourceId: string
  }): Promise<DRCheckoutResponse> {
    const data = {
      sourceId,
    }

    return this.http.post(`/checkouts/${checkoutId}`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // updateCheckoutWithUpstreamId
  public async updateCheckoutWithUpstreamId({
    settings,
    checkoutId,
    upstreamId,
  }: {
    settings: AppSettings
    checkoutId: string
    upstreamId: string
  }): Promise<DRCheckoutResponse> {
    const data = {
      upstreamId,
    }

    return this.http.post(`/checkouts/${checkoutId}`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // createOrder
  public async createOrder({
    settings,
    checkoutId,
  }: {
    settings: AppSettings
    checkoutId: string
  }): Promise<IOResponse<DROrderResponse>> {
    return this.http.postRaw(`/orders`, JSON.stringify({ checkoutId }), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // getOrderById
  public async getOrderById({
    settings,
    orderId,
  }: {
    settings: AppSettings
    orderId: string
  }): Promise<DROrderResponse> {
    return this.http.get(`/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // getOrders
  public async getOrdersByEmail({
    settings,
    email,
  }: {
    settings: AppSettings
    email: string
  }): Promise<any> {
    return this.http.get(`/orders?email=${email}`, {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // getOrdersByUpstreamId
  public async getOrdersByUpstreamId({
    settings,
    upstreamId,
  }: {
    settings: AppSettings
    upstreamId: string
  }): Promise<DROrdersResponse> {
    return this.http.get(`/orders`, {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
      params: {
        upstreamIds: upstreamId,
      },
    })
  }

  // refundOrder
  public async refundOrder({
    settings,
    payload,
  }: {
    settings: AppSettings
    payload: DRRefundPayload
  }): Promise<DRRefundResponse> {
    return this.http.post(`/refunds`, JSON.stringify(payload), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // returnOrder
  public async returnOrder({
    settings,
    payload,
  }: {
    settings: AppSettings
    payload: DRReturnOrderPayload
  }): Promise<DRReturnOrderResponse> {
    return this.http.post(`/returns`, JSON.stringify(payload), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // fulfillOrder
  public async fulfillOrCancelOrder({
    settings,
    payload,
  }: {
    settings: AppSettings
    payload: DRFulfillmentPayload
  }): Promise<DRFulfillmentResponse> {
    return this.http.post(`/fulfillments`, JSON.stringify(payload), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // createWebhook
  public async createWebhook({
    settings,
    payload,
  }: {
    settings: AppSettings
    payload: DRWebhookPayload
  }): Promise<DRWebhookResponse> {
    return this.http.post(`/webhooks`, JSON.stringify(payload), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  public async createSku({
    settings,
    skuId,
    skuPayload,
  }: {
    settings: AppSettings
    skuId: number
    skuPayload: DRSkuPayload
  }): Promise<DRSkuResponse> {
    return this.http.put(`/skus/${skuId}`, JSON.stringify(skuPayload), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }

  // fileLinks
  public async createFileLink({
    settings,
    payload,
  }: {
    settings: AppSettings
    payload: DRFileLinkPayload
  }): Promise<DRFileLinkResponse> {
    return this.http.post(`/file-links`, JSON.stringify(payload), {
      headers: {
        Authorization: `Bearer ${settings.digitalRiverToken}`,
        'Content-Type': `application/json`,
      },
    })
  }
}
