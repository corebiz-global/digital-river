/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ClientsConfig,
  ServiceContext,
  ParamsContext,
  RecorderState,
} from '@vtex/api'
import { Service, method } from '@vtex/api'
import type { PaymentProviderProtocol } from '@vtex/payment-provider-sdk'
import { implementsAPI } from '@vtex/payment-provider-sdk'

import { Clients } from './clients'
import {
  authorize,
  availablePaymentMethods,
  cancel,
  inbound,
  refund,
  settle,
} from './middlewares'
import { digitalRiverOrderTaxHandler } from './middlewares/tax'
import {
  digitalRiverCreateCheckout,
  digitalRiverUpdateCheckout,
  countryCode,
  digitalRiverGetSources,
} from './middlewares/checkout'
import {
  digitalRiverSetup,
  digitalRiverCatalogSync,
  digitalRiverCatalogLogs,
  digitalRiverSkuSync,
  digitalRiverProfile,
  digitalRiverDeleteSource,
  digitalRiverAddSource,
  digitalRiverFileLinks,
  digitalRiverCustomers,
  digitalRiverInvoices,
  digitalRiverTaxIds,
  digitalRiverCreateTaxIds,
} from './middlewares/digitalRiver'
import { throttle } from './middlewares/throttle'

const TIMEOUT_MS = 5000

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 0,
      timeout: TIMEOUT_MS,
    },
  },
}

declare global {
  type Context = ServiceContext<Clients>
}

export default new Service<Clients, RecorderState, ParamsContext>({
  clients,
  graphql: {
    resolvers: {
      Query: {
        orderFormConfiguration: async (_: any, __: any, ctx: Context) => {
          const {
            clients: { checkout },
          } = ctx

          return checkout.orderFormConfiguration()
        },
      },
      Mutation: {
        updateOrderFormConfiguration: async (
          _: any,
          {
            orderFormConfiguration,
          }: { orderFormConfiguration: OrderFormConfiguration },
          ctx: Context
        ) => {
          const {
            clients: { checkout },
            vtex: { logger },
          } = ctx

          let response = null

          try {
            response = await checkout.updateOrderFormConfiguration(
              orderFormConfiguration
            )
          } catch (err) {
            logger.error({
              error: err,
              message: 'DigitalRiver-UpdateOrderFormConfigurationError',
            })
          }

          return response
        },
      },
    },
  },
  events: {
    skuChange: [throttle, digitalRiverSkuSync],
  },
  routes: {
    ...implementsAPI<PaymentProviderProtocol<Context>>({
      authorizations: {
        POST: authorize,
      },
      cancellations: {
        POST: cancel,
      },
      settlements: {
        POST: settle,
      },
      refunds: { POST: refund },
      paymentMethods: {
        GET: availablePaymentMethods,
      },
      inbound: { POST: inbound },
    }),
    digitalRiverOrderTaxHandler: method({
      POST: [digitalRiverOrderTaxHandler],
    }),
    createCheckout: method({ POST: [digitalRiverCreateCheckout] }),
    updateCheckout: method({ POST: [digitalRiverUpdateCheckout] }),
    getISO2CountryCode: method({ GET: [countryCode] }),
    getSources: method({ GET: [digitalRiverGetSources] }),
    deleteSource: method({ GET: [digitalRiverDeleteSource] }),
    addSource: method({ GET: [digitalRiverAddSource] }),
    setup: method({ POST: [digitalRiverSetup] }),
    catalogSync: method({ POST: [digitalRiverCatalogSync] }),
    catalogLogs: method({ GET: [digitalRiverCatalogLogs] }),
    getProfile: method({ GET: [digitalRiverProfile] }),
    getFileLinks: method({ GET: [digitalRiverFileLinks] }),
    getInvoices: method({ GET: [digitalRiverInvoices] }),
    getAllCustomers: method({ GET: [digitalRiverCustomers] }),
    taxIds: method({
      GET: [digitalRiverTaxIds],
      POST: [digitalRiverCreateTaxIds],
    }),
  },
})
