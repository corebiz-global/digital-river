/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { json } from 'co-body'
import convertIso3To2 from 'country-iso-3-to-2'

import { applicationId } from '../constants'
import { buildHash, getCache, setCache } from '../resolvers/cache/vbaseCache'

const getAppId = (): string => {
  return process.env.VTEX_APP_ID ?? ''
}

const getCheckoutPayload = (
  checkoutDR: CheckoutRequest,
  orderForm: any,
  taxInclusive: boolean,
  docks: any[]
): DRCheckoutPayload => {
  const shippingCountry = checkoutDR.shippingDestination?.country
    ? convertIso3To2(checkoutDR.shippingDestination?.country)
    : 'US'

  const shippingTotal = checkoutDR.totals.find(
    (total: any) => total.id === 'Shipping'
  )?.value

  const items = []

  for (const [_, item] of checkoutDR.items.entries()) {
    const dock = docks.find((dockItem: any) => dockItem.id === item.dockId)
    const newItem: CheckoutItem = {
      skuId: item.sku,
      quantity: item.quantity,
      price: item.itemPrice / item.quantity,
      discount: item.discountPrice
        ? {
            amountOff: Math.abs(item.discountPrice / item.quantity),
            quantity: item.quantity,
          }
        : undefined,
      metadata: {
        taxHubRequestId: item.id,
      },
      ...(!!dock && {
        shipFrom: {
          address: {
            line1: dock.address.street || 'Unknown',
            line2: dock.address.complement || '',
            city: dock.address.city,
            postalCode: dock.address.postalCode,
            state: dock.address.state || '',
            country: convertIso3To2(dock.address.country.acronym),
          },
        },
      }),
    }

    items.push(newItem)
  }

  const checkoutPayload: DRCheckoutPayload = {
    currency: orderForm?.storePreferencesData?.currencyCode ?? 'USD',
    items,
    applicationId,
    taxInclusive,
    email: orderForm.clientProfileData?.email ?? '',
    shipTo: {
      name:
        orderForm.clientProfileData?.firstName &&
        orderForm.clientProfileData?.lastName
          ? `${orderForm.clientProfileData?.firstName} ${orderForm.clientProfileData?.lastName}`
          : '',
      phone: orderForm.clientProfileData?.phone || '',
      address: {
        line1: checkoutDR.shippingDestination?.street || 'Unknown',
        line2: checkoutDR.shippingDestination?.complement || '',
        city: checkoutDR.shippingDestination?.city || 'Unknown',
        state: checkoutDR.shippingDestination?.state || '',
        postalCode: checkoutDR.shippingDestination?.postalCode || '',
        country: shippingCountry,
      },
    },
    shippingChoice: {
      amount: shippingTotal ? shippingTotal / 100 : 0,
      description: '',
      serviceLevel: '',
    },
    locale: orderForm.clientPreferencesData?.locale
      ? orderForm.clientPreferencesData?.locale.replace('-', '_')
      : 'en_US',
  }

  return checkoutPayload
}

export async function digitalRiverOrderTaxHandler(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    clients: { apps, orderForm, digitalRiver, logistics },
    req,
    vtex: { logger },
  } = ctx

  const app: string = getAppId()
  const settings = await apps.getAppSettings(app)
  const checkoutRequest = (await json(req)) as CheckoutRequest

  const hashRequest = buildHash({ checkoutRequest, settings })
  const cacheResponse = await getCache(hashRequest, ctx)

  const orderFormData = await orderForm.getOrderForm(
    checkoutRequest.orderFormId,
    settings.vtexAppKey,
    settings.vtexAppToken
  )

  let checkoutResponse
  const taxesResponse = [] as ItemTaxResponse[]

  if (
    orderFormData?.items.length > 0 &&
    !settings.isTaxInclusive &&
    !cacheResponse
  ) {
    const docks = []

    for (const logisticsInfo of orderFormData?.shippingData?.logisticsInfo) {
      const { selectedSla, slas } = logisticsInfo

      if (slas && selectedSla) {
        const [{ dockId }] =
          slas.find(({ name }: { name: string }) => name === selectedSla)
            ?.deliveryIds ?? {}

        // eslint-disable-next-line no-await-in-loop
        let dockInfo = await logistics.getDocksById(dockId)

        if (
          !dockInfo?.address?.city ||
          !dockInfo?.address?.postalCode ||
          !dockInfo?.address?.country?.acronym
        ) {
          logger.warn({
            message: 'DigitalRiverOrderTaxHandler-getDocksById',
            dockInfo,
          })
          dockInfo = ''
        }

        docks.push(dockInfo)
      }
    }

    const checkoutPayload = getCheckoutPayload(
      checkoutRequest,
      orderFormData,
      settings.isTaxInclusive,
      docks
    )

    try {
      checkoutResponse = await digitalRiver.createCheckout({
        settings,
        checkoutPayload,
      })
      logger.info({
        message: 'DigitalRiverOrderTaxHandler-createCheckoutRequest',
        checkoutPayload,
      })
    } catch (err) {
      logger.error({
        error: err,
        checkoutPayload,
        message: 'DigitalRiverOrderTaxHandler-createCheckoutError',
      })
    }

    logger.info({
      message: 'DigitalRiverOrderTaxHandler-createCheckoutResponse',
      checkoutResponse,
    })
    if (checkoutResponse) {
      const shippingTax = checkoutResponse.shippingChoice.taxAmount
      let shippingTaxPerItemRounded = 0

      if (shippingTax > 0) {
        const shippingTaxPerItem = shippingTax / checkoutResponse.items.length

        shippingTaxPerItemRounded = Math.floor(shippingTaxPerItem * 100) / 100
      }

      checkoutResponse.items.forEach((item: any, index: any) => {
        const itemTaxes = [] as Tax[]

        if (item.tax.amount > 0) {
          itemTaxes.push({
            name: `Tax`,
            rate: item.tax.rate,
            value: item.tax.amount,
          })
        }

        if (shippingTaxPerItemRounded) {
          itemTaxes.push({
            name: `Shipping Tax`,
            value: shippingTaxPerItemRounded,
          })
        }

        if (item.importerTax.amount > 0) {
          itemTaxes.push({
            name: `Importer Tax`,
            value: item.importerTax.amount,
          })
        }

        if (item.duties.amount > 0) {
          itemTaxes.push({
            name: `Duties`,
            value: item.duties.amount,
          })
        }

        if (item.fees.amount > 0) {
          itemTaxes.push({
            name: `Fees`,
            value: item.fees.amount,
          })

          if (item.fees.taxAmount > 0) {
            itemTaxes.push({
              name: `Fee Tax`,
              value: item.fees.taxAmount,
            })
          }
        }

        taxesResponse.push({
          id: item.metadata?.taxHubRequestId ?? index.toString(),
          taxes: itemTaxes,
        })
      })

      try {
        await digitalRiver.deleteCheckout({
          settings,
          checkoutId: checkoutResponse.id,
        })
        logger.info({
          message: 'DigitalRiverOrderTaxHandler-deleteCheckoutRequest',
          checkoutId: checkoutResponse.id,
        })
      } catch (err) {
        logger.error({
          error: err,
          checkoutId: checkoutResponse.id,
          message: 'DigitalRiverOrderTaxHandler-deleteCheckoutError',
        })
      }
    }

    setCache({ ctx, hash: hashRequest, value: taxesResponse, ttl: 'SHORT' })
  }

  logger.info({
    message: 'DigitalRiverOrderTaxHandler-itemTaxResponse',
    data: cacheResponse || taxesResponse,
    fromCache: !!cacheResponse,
  })

  ctx.body = {
    itemTaxResponse: cacheResponse || taxesResponse,
    hooks: [],
  } as TaxResponse
  ctx.set('Content-Type', 'application/vnd.vtex.checkout.minicart.v1+json')

  await next()
}
