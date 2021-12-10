📢 Use this project, [contribute](https://github.com/vtex-apps/digital-river) to it or open issues to help evolve it using [Store Discussion](https://github.com/vtex-apps/store-discussion).

# Digital River

<!-- DOCS-IGNORE:start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- DOCS-IGNORE:end -->

This app integrates Digital River with VTEX checkout, allowing shoppers to interact with Digital River's 'Drop-In' component and select from a variety of payment methods all processed through a single Digital River account.

> ⚠️ _This app is under development. For this initial version, orders are sent to Digital River as tax inclusive. Future versions of this app will support integration of Digital River as a tax calculation provider._

> ⚠️ _You must have a Digital River account, and all SKUs must be registered with Digital River. This can be done by utilizing this app's catalog sync feature or through Digital River's API. If a shopper attempts to check out with an unregistered SKU, the Digital River 'Drop-In' component will fail to load._

## Configuration

1. Install this app in the desired account using the CLI command `vtex install vtexus.connector-digital-river`. If you have multiple accounts configured in a marketplace-seller relationship, install the app and repeat the following steps in each of the related accounts.
2. In your admin sidebar, access the **Other** section and click on `Digital River` and then on `Configuration`.
3. In the settings fields, enter your `Digital River public key`, `Digital River token`, `VTEX App Key` and `VTEX App Token`. For initial testing, use a test `Digital River token` and leave the `Enable production mode` toggle turned off. Turn on the `Enable automatic catalog sync` toggle to enable syncing of SKUs from VTEX to Digital River each time a SKU is added or updated in your VTEX catalog. Turn on the `Enable tax inclusive prices` toggle if your catalog uses tax-inclusive product prices.

⚠️ _For multiple accounts configured in a marketplace-seller relationship, the same `VTEX App Key` and `VTEX App Token` should be used for all of the accounts in which the app is installed. You can use any of the accounts to generate the key/token, and then grant additional permissions to the key/token by [creating a new user](https://help.vtex.com/en/tutorial/managing-users--tutorials_512) on each of the other accounts using the `VTEX App Key` in place of the user's email address, and then assigning the Owner role to that user._

⚠️ _Digital River provides its own tax calculation service. Therefore there should be no other tax calculation provider enabled on your account. If there is, you will be required to disable it before Digital River can be configured._

4. Is recommended to do an initial full catalog sync between VTEX and Digital River. To do this access the **Other** section, click on `Digital River` and then click on `Catalog Sync Logs`. On this page, click on the button `SYNC CATALOG`. This will send all current SKUs from your VTEX catalog to Digital River. Note that the `Enable automatic catalog sync` setting must have been enabled in step 3 above.

⚠️ _Note that each product must have valid values for `Tax Code`, `ECCN`, and `Country of origin` in the VTEX catalog to be eligible to be sent to Digital River. The logs on this page will show whether each SKU was processed successfully or encountered an error due to missing information. Since this process runs in the background there is a `RELOAD` button to refresh the logs._

5. Add the following JavaScript to your `checkout6-custom.js` file, which is typically edited by accessing the **Store Setup** section in your admin sidebar and clicking `Checkout`, then clicking the blue gear icon and then the `Code` tab:

```js
// DIGITAL RIVER Version 2.0.0
let checkoutUpdated = false
const digitalRiverPaymentGroupClass = '.DigitalRiverPaymentGroup'
const digitalRiverPaymentGroupButtonID =
  'payment-group-DigitalRiverPaymentGroup'

const digitalRiverPublicKey = 'pk_test_1234567890' // NOTE! Enter your Digital River public API key here

const paymentErrorTitle = 'Unable to check out with selected payment method.'
const paymentErrorDescription =
  'Please try a different payment method and try again.'
const loginMessage = 'Please log in to continue payment.'
const loginButtonText = 'LOG IN'
const addressErrorTitle = 'Incomplete shipping address detected.'
const addressErrorDescription =
  'Please check your shipping information and try again.'
const genericErrorTitle = 'Digital River checkout encountered an error.'
const genericErrorDescription =
  'Please check your shipping information and try again.'
let digitalriver
let digitalRiverCompliance

async function getCountryCode(country) {
  return await fetch(
    `${
      __RUNTIME__.rootPath || ``
    }/_v/api/digital-river/checkout/country-code/${country}`
  )
    .then((response) => {
      return response.json()
    })
    .then((json) => {
      return json.code
    })
}

function loadCompliance(orderForm) {
  const locale = orderForm && orderForm.clientPreferencesData && orderForm.clientPreferencesData.locale;
  const complianceOptions = {
    classes: {
      base: 'DRElement'
    },
    compliance: {
      locale,
      entity: 'DR_INC-ENTITY'
    }
  }
  if ($('#compliance').length == 0) {
    $('.container-main').append('<div id="compliance"></div>')
    digitalRiverCompliance = digitalriver.createElement('compliance', complianceOptions);
    digitalRiverCompliance.mount('compliance');
  } else {
    digitalRiverCompliance.update(complianceOptions);
  }
}

function renderErrorMessage(title, body, append = false) {
  if (!append) {
    $(digitalRiverPaymentGroupClass).html(
      `<div><div class='DR-card'><div class='DR-collapse DR-show'><h5 class='DR-error-message'>${title}</h5><div><p>${body}</p></div></div></div></div>`
    )
  
    return
  }

  $('#VTEX-DR-error').remove()
  $('.DR-pay-button').after(
    `<div id='VTEX-DR-error'><h5 class="DR-error-message">${title}</h5><div><p>${body}</p></div></div>`
  )
}

async function updateOrderForm(method, checkoutId) {
  const orderFormID = vtexjs.checkout.orderFormId

  return await $.ajax({
    url: `${window.location.origin}${
      __RUNTIME__.rootPath || ``
    }/api/checkout/pub/orderForm/${orderFormID}/customData/digital-river/checkoutId`,
    type: method,
    data: { value: checkoutId },
    success() {
      vtexjs.checkout.getOrderForm().done((orderForm) => {
        const { clientPreferencesData } = orderForm
        if (!clientPreferencesData) return
        return vtexjs.checkout.sendAttachment(
          'clientPreferencesData',
          clientPreferencesData
        )
      })
    },
  })
}

function showBuyNowButton() {
  $('.payment-submit-wrap').show()
}

function hideBuyNowButton() {
  $('.payment-submit-wrap').hide()
}

function clickBuyNowButton() {
  $('#payment-data-submit').click()
}

function loadDigitalRiverScript() {
  const e = document.createElement('script')

  ;(e.type = 'text/javascript'),
    (e.src = 'https://js.digitalriver.com/v1/DigitalRiver.js')
  const [t] = document.getElementsByTagName('script')

  t.parentNode.insertBefore(e, t)

  const f = document.createElement('link')

  ;(f.type = 'text/css'),
    (f.rel = 'stylesheet'),
    (f.href = 'https://js.digitalriverws.com/v1/css/DigitalRiver.css')
  const [u] = document.getElementsByTagName('link')

  u.parentNode.insertBefore(f, u)
}

function loadStoredCards(checkoutId) {
  fetch(`${__RUNTIME__.rootPath || ``}/_v/api/digital-river/checkout/sources?v=${new Date().getTime()}`)
    .then((response) => {
      return response.json()
    })
    .then(async (response) => {
      if (response.customer && response.customer.sources) {
        var sources = response.customer.sources
        if (sources.length > 0) {
          var radiosHtmls =
            '<div class="stored-credit-cards-title" style="margin-bottom: 16px;"><span class="DR-payment-method-name DR-payment-method-name-with-image" style="color: rgba(0,0,0,.75); font-size: 1rem; font-weight: 400; line-height: 20px; margin: 0px;">Saved Cards</span></div>'
          for (var i = 0; i < sources.length; i++) {
            radiosHtmls +=
              '<input name="DR-stored-cards" type="radio" id="' +
              sources[i].id +
              '" value="' +
              sources[i].id +
              '">'
            radiosHtmls +=
              '<label style="display: inline-block; vertical-align: sub; margin-bottom: 8px; margin-left: 4px; font-size: 0.875rem" for="' +
              sources[i].id +
              '">' +
              sources[i].creditCard.brand +
              ' ending with ' +
              sources[i].creditCard.lastFourDigits +
              ' expires ' +
              ('0' + sources[i].creditCard.expirationMonth).slice(-2) +
              '/' +
              sources[i].creditCard.expirationYear +
              '</label></br>'
          }
          radiosHtmls +=
            '<div class="stored-credit-cards" style="margin-top: 16px;"><button id="submit-stored-creditCard" style="background-color: #1264a3; color: #FFF; height: 56px; border-radius: .25rem; text-align: center; border-top: none!important; border: none; font-weight: 400; padding: 1rem; width: 250px; margin-bottom: 24px;">BUY NOW WITH SAVED CARD</button></div>'

          $('#drop-in').prepend(
            '<div class="DR-stored-cards">' + radiosHtmls + '</div>'
          )
          $('#submit-stored-creditCard').click(function () {
            var sourceId = $('input[name=DR-stored-cards]:checked').attr('id')
            fetch(
              `${
                __RUNTIME__.rootPath || ``
              }/_v/api/digital-river/checkout/update`,
              {
                method: 'POST',
                body: JSON.stringify({
                  checkoutId,
                  sourceId,
                  readyForStorage: false,
                }),
              }
            )
              .then((rawResponse) => {
                return rawResponse.json()
              })
              .then(() => {
                checkoutUpdated = true
                clickBuyNowButton()
              })
          })
          $('#' + sources[0].id).click()
        }
      }
    })
}

function loadDigitalRiver(orderForm) {
  const locale = orderForm && orderForm.clientPreferencesData && orderForm.clientPreferencesData.locale
    digitalriver = new DigitalRiver(digitalRiverPublicKey, {
      locale: locale ?? 'en-US',
    })
}

async function initDigitalRiver(orderForm) {
  hideBuyNowButton()

  if (
    $('#drop-in-spinner').length ||
    ($('#drop-in').length && $('#drop-in').html().length)
  ) {
    return
  }

  $(digitalRiverPaymentGroupClass).html(
    `<div id='drop-in-spinner'><i class="icon-spinner icon-spin"></i></div>`
  )

  $(digitalRiverPaymentGroupClass).append(`<div id='drop-in'></div>`)

  if (!orderForm.canEditData) {
    hideBuyNowButton()
    $(digitalRiverPaymentGroupClass).html(
      `<div><div class='DR-card'><div class='DR-collapse DR-show'><h5 class='DR-error-message'>${loginMessage}</h5><div><a style='cursor: pointer;' onClick='window.vtexid.start()' class='DR-button-text'>${loginButtonText}</a></div></div></div></div>`
    )
    return
  }

  fetch(`${__RUNTIME__.rootPath || ``}/_v/api/digital-river/checkout/create`, {
    method: 'POST',
    body: JSON.stringify({ orderFormId: orderForm.orderFormId, taxIdPayload: { // NOTE: The taxIdPayload field is optional
      taxId: {
        "type": "uk",
        "value": "GB999999999"
      },
      customerType: "business"
    }}),
  })
    .then((response) => {
      return response.json()
    })
    .then(async (response) => {
      const { checkoutId = null, paymentSessionId = null } = response

      if (!checkoutId || !paymentSessionId) {
        renderErrorMessage(genericErrorTitle, genericErrorDescription, false)

        return
      }

      await updateOrderForm('PUT', checkoutId)

      const country = await getCountryCode(
        orderForm.shippingData.address.country
      )

      const configuration = {
        sessionId: paymentSessionId,
        options: {
          flow: 'checkout',
          showComplianceSection: false,
          showSavePaymentAgreement: true,
          showTermsOfSaleDisclosure: true,
          button: {
            type: 'buyNow',
          },
        },
        billingAddress: {
          firstName: orderForm.clientProfileData.firstName,
          lastName: orderForm.clientProfileData.lastName,
          email: orderForm.clientProfileData.email,
          phoneNumber: orderForm.clientProfileData.phone,
          address: {
            line1: `${
              orderForm.shippingData.address.number
                ? `${orderForm.shippingData.address.number} `
                : ''
            }${orderForm.shippingData.address.street}`,
            line2: orderForm.shippingData.address.complement,
            city: orderForm.shippingData.address.city,
            state: orderForm.shippingData.address.state,
            postalCode: orderForm.shippingData.address.postalCode,
            country,
          },
        },
        onSuccess(data) {
          fetch(
            `${
              __RUNTIME__.rootPath || ``
            }/_v/api/digital-river/checkout/update`,
            {
              method: 'POST',
              body: JSON.stringify({
                checkoutId,
                sourceId: data.source.id,
                readyForStorage: data.readyForStorage,
              }),
            }
          )
            .then((rawResponse) => {
              return rawResponse.json()
            })
            .then(() => {
              checkoutUpdated = true
              clickBuyNowButton()
            })
        },
        onCancel(data) {},
        onError(data) {
          console.error(data)
          renderErrorMessage(paymentErrorTitle, paymentErrorDescription, true)
        },
        onReady(data) {
          loadStoredCards(checkoutId)
        },
      }
      const dropin = digitalriver.createDropin(configuration)
      $('#drop-in-spinner').remove();
      $('#drop-in').children().remove();
      dropin.mount('drop-in')
    })
}

$(document).ready(function () {
  loadDigitalRiverScript();
  if (~window.location.hash.indexOf('#/payment')) {
    if (
      $('.payment-group-item.active').attr('id') ===
      digitalRiverPaymentGroupButtonID
    ) {
      vtexjs.checkout.getOrderForm().done(function (orderForm) {
        loadDigitalRiver(orderForm);
        initDigitalRiver(orderForm)
      })
    } else {
      showBuyNowButton()
    }
  }
})

$(window).on('orderFormUpdated.vtex', function (evt, orderForm) {
  loadDigitalRiver(orderForm);
  loadCompliance(orderForm);
  if (
    ~window.location.hash.indexOf('#/payment') &&
    $('.payment-group-item.active').attr('id') ===
      digitalRiverPaymentGroupButtonID
  ) {
    if (
      !orderForm.shippingData.address ||
      !orderForm.shippingData.address.street ||
      !orderForm.shippingData.address.city ||
      !orderForm.shippingData.address.state ||
      !orderForm.shippingData.address.postalCode ||
      !orderForm.shippingData.address.country
    ) {
      return
    } else {
      initDigitalRiver(orderForm)
    }
  }
})
```

6. In your admin sidebar, access the **Transactions** section and click `Payments > Settings`.
7. Click the `Gateway Affiliations` tab and click the green plus sign to add a new affiliation.
8. Click `DigitalRiverV2` from the **Others** list.
9. Modify the `Affiliation name` if desired, choose an `Auto Settlement` behavior from the dropdown (Digital River recommends setting this to "Disabled: Do Not Auto Settle") and then click `Save`. Leave `Application Key` and `Application Token` blank.
10. Click the `Payment Conditions` tab and click the green plus sign to add a new payment condition.
11. Click `DigitalRiver` from the **Other** list.
12. In the `Process with affiliation` dropdown, choose the name of the affiliation that you created in step 8. Set the status to `Active` and click `Save`. Note that this will activate the payment method in checkout!
13. After successfully testing the payment method in test mode, return to the Digital River app settings page from step 2. Replace your test `Digital River token` with a production token and turn on the `Enable Production mode` toggle. Save the settings and your checkout page will be all set to start accepting production orders.

## Digital River APIs

| Field            | Value                                                                                      |
|------------------|--------------------------------------------------------------------------------------------|
| **URI**          | /_v/api/digital-river/customers                                                            |
| **METHOD**       | GET                                                                                        |
| **API Usage**    | Uses the orderFormId to get a matching Digital River customer. The email in the checkout must exist in Digital River     |

_Example Headers:_
orderFormId: **orderFormId**

> ⚠️ _There must be an email associated with the orderFormId_

_Example Response:_
```json
{
  "id": "540988630336"
}
```

| Field            | Value                                                                                       |
|------------------|---------------------------------------------------------------------------------------------|
| **URI**          | /_v/api/digital-river/tax-identifiers                                                       |
| **METHOD**       | GET                                                                                         |
| **API Usage**    | Returns all tax ids. This API accepts the same query parameters as the [Digital River API](https://www.digitalriver.com/docs/digital-river-api-reference/#operation/listTaxIdentifiers) |

_Example Headers:_
orderFormId: **orderFormId**

> ⚠️ _There must be an email associated with the orderFormId_

_Example Response:_
```json
{
    "id": [
        "a77cea02-ac3c-45a5-ac7e-e32aff524bc2",
        "f0c356fe-8779-4775-a6d3-17267816acd0",
        "7769196c-41c1-4832-a389-399b3be318c4",
        "39dc5358-0449-4711-af1b-c90e009638eb"
    ]
}
```


| Field            | Value                                                                                       |
|------------------|---------------------------------------------------------------------------------------------|
| **URI**          | /_v/api/digital-river/tax-identifiers                                                       |
| **METHOD**       | POST                                                                                         |
| **API Usage**    | Returns the created tax id. [Digital River API](https://www.digitalriver.com/docs/digital-river-api-reference/#operation/createTaxIdentifiers) |

_Example Headers:_
orderFormId: **orderFormId**

> ⚠️ _There must be an email associated with the orderFormId_

_Example Request:_
```json
{
    "type": "uk",
    "value": "GB999999999"
}
```

_Example Response:_
```json
{
    "id": "0ea76f4b-372a-41c1-9488-b0a8b13ade58",
    "state": "verified",
    "liveMode": false,
    "type": "uk",
    "value": "GB999999999",
    "stateTransitions": {
        "verified": "2021-10-28T20:41:20Z"
    },
    "createdTime": "2021-10-28T20:41:20Z",
    "updatedTime": "2021-10-28T20:41:20Z",
    "applicability": [
        {
            "country": "IM",
            "entity": "DR_UK-ENTITY",
            "customerType": "business"
        },
        {
            "country": "IM",
            "entity": "DR_IRELAND-ENTITY",
            "customerType": "business"
        },
        {
            "country": "GB",
            "entity": "DR_UK-ENTITY",
            "customerType": "business"
        },
        {
            "country": "GB",
            "entity": "DR_IRELAND-ENTITY",
            "customerType": "business"
        }
    ]
}
```



| Field            | Value                                                                                       |
|------------------|---------------------------------------------------------------------------------------------|
| **URI**          | /_v/api/digital-river/checkout/create                                                   |
| **METHOD**       | POST                                                                                         |
| **API Usage**    | Creates Checkout [Digital River API](https://www.digitalriver.com/docs/digital-river-api-reference/#operation/createCheckouts) |

> ⚠️ _The taxId type must match the country where the product is shipped to. Moreover, the taxId value must be valid. The `customerType` field must be either business or individual. Please See the supported customerType with respect to the nation it is shipped to. [Supported TaxId Types](https://docs.digitalriver.com/digital-river-api/checkouts/creating-checkouts/tax-identifiers#supported-tax-identifiers)_

_Example Request:_
```json
{
  "orderFormId": "orderFormId",
  "taxIdPayload": {
    "taxId": {
      "type": "uk",
      "value": "GB999999999"
    },
    "customerType": "business" // Or "individual"
  }
}
```

> ⚠️ _For `/create API` to utilize the taxIdPayload, the key version must be either version 2021-02-23 or 2021-03-23 for it it to function._

<!-- DOCS-IGNORE:start -->

## Contributors ✨

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!

<!-- DOCS-IGNORE:end -->
