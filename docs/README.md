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
// DIGITAL RIVER Version 2.1.0
let checkoutUpdated = false
const digitalRiverPaymentGroupClass = '.DigitalRiverPaymentGroup'
const digitalRiverPaymentGroupButtonID =
  'payment-group-DigitalRiverPaymentGroup'

const digitalRiverPublicKey = 'pk_test_1234567890' // NOTE! Enter your Digital River public API key here
const defaultSellingEntity = 'DR_INC-ENTITY'
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
let digitalRiverBillingAddress
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
  const locale =
    orderForm &&
    orderForm.clientPreferencesData &&
    orderForm.clientPreferencesData.locale
  const complianceOptions = {
    classes: {
      base: 'DRElement',
    },
    compliance: {
      locale,
      entity: defaultSellingEntity,
    },
  }
  if ($('#compliance').length == 0) {
    $('.container-main').append('<div id="compliance"></div>')
    digitalRiverCompliance = digitalriver.createElement(
      'compliance',
      complianceOptions
    )
    digitalRiverCompliance.mount('compliance')
  } else {
    digitalRiverCompliance.update(complianceOptions)
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
  e.addEventListener('load', () => {
    vtexjs.checkout.getOrderForm().done(function (orderForm) {
      loadDigitalRiver(orderForm)
      loadCompliance(orderForm)
      if (
        ~window.location.hash.indexOf('#/payment') &&
        $('.payment-group-item.active').attr('id') ===
          digitalRiverPaymentGroupButtonID
      ) {
        initDigitalRiver(orderForm)
      }
    })
  })
  const [t] = document.getElementsByTagName('script')

  t.parentNode.insertBefore(e, t)

  const f = document.createElement('link')

  ;(f.type = 'text/css'),
    (f.rel = 'stylesheet'),
    (f.href = 'https://js.digitalriverws.com/v1/css/DigitalRiver.css')
  const [u] = document.getElementsByTagName('link')

  u.parentNode.insertBefore(f, u)
  mountBillingAddressStyle()
  getBillingAddress()
}

function loadStoredCards(checkoutId, paymentSessionId) {
  fetch(
    `${
      __RUNTIME__.rootPath || ``
    }/_v/api/digital-river/checkout/sources?v=${new Date().getTime()}`
  )
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
          const drCompliance = digitalriver.Compliance.getDetails(
            defaultSellingEntity
          )
          const drComplianceDisclosures = drCompliance['disclosure']
          if (drComplianceDisclosures) {
            radiosHtmls += '<div class="stored-credit-cards-disclosure">'
            radiosHtmls +=
              '<input type="checkbox" id="stored-credit-cards-disclosure" />'
            radiosHtmls +=
              '<label for="stored-credit-cards-disclosure">' +
              drComplianceDisclosures['confirmDisclosure']['localizedText'] +
              '</label></div>'
          }
          radiosHtmls +=
            '<div class="stored-credit-cards" style="margin-top: 16px;"><button id="submit-stored-creditCard" disabled style="opacity: 0.5; background-color: #1264a3; color: #FFF; height: 56px; border-radius: .25rem; text-align: center; border-top: none!important; border: none; font-weight: 400; padding: 1rem; width: 250px; margin-bottom: 24px;">BUY NOW WITH SAVED CARD</button></div>'

          $('#drop-in').prepend(
            '<div class="DR-stored-cards">' + radiosHtmls + '</div>'
          )
          $('#stored-credit-cards-disclosure').click(function () {
            if ($('#stored-credit-cards-disclosure').prop('checked')) {
              $('#submit-stored-creditCard').css('opacity', '1')
              $('#submit-stored-creditCard').prop('disabled', false)
            } else {
              $('#submit-stored-creditCard').css('opacity', '0.5')
              $('#submit-stored-creditCard').prop('disabled', true)
            }
          })
          $('#submit-stored-creditCard').click(function () {
            if (!$('#stored-credit-cards-disclosure').prop('checked')) {
              return
            }
            var sourceId = $('input[name=DR-stored-cards]:checked').attr('id')
            var sourceFound = sources.find((source) => source.id === sourceId)
            if (sourceFound) {
              digitalriver
                .authenticateSource({
                  sessionId: paymentSessionId,
                  sourceId: sourceId,
                  sourceClientSecret: sourceFound.clientSecret,
                })
                .then(function (data) {
                  //TODO pending what to do on status failed
                  console.log('AUTH', data)
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
            }
          })
          $('#' + sources[0].id).click()
        }
      }
    })
}

function mountBillingAddressStyle() {
  var css = `
        .DR-billing-address {
            margin: 16px 0px;
        }
        .DR-billing-address .input {
            vertical-align: top;
        }
        .vtex-billing-address-form h3 {
            display: block !important;
        }
        .vtex-checkbox-billing label {
            display: inline-block;
            vertical-align: sub;
        }
        .stored-credit-cards-disclosure label {
            display: inline-block;
            vertical-align: middle;
            width: calc(100% - 20px);
            margin-left: 4px;
        }
        .billing-address-card {
            border: 1px solid rgba(0,0,0,.26);
            padding: 16px;
        }
        .billing-address-editcard {
            display: block !important;
            text-align: right;
            width: 100% !important;
            font-size: 14px;
            text-decoration: underline;
            color: #1a73e8;
            margin-bottom: 4px;
            cursor: pointer;
        }
        .billing-address-card label {
            display: inline-block;
            margin-right: 4px;
        }
        .billing-address-card div {
            display: inline-block;
            width: 48%;
        }
        .billing-form {
            display: none;
        }
        #billing-address-submit {
            background-color: #1264a3;
            color: #FFF;
            height: 56px;
            border-radius: .25rem;
            text-align: center;
            border-top: none!important;
            border: none;
            font-weight: 400;
            padding: 1rem;
            width: 250px;
            margin-bottom: 24px;
            margin-top: 24px;
        }
        .billing-first-name,
        .billing-last-name,
        .billing-address-infos div,
        .billing-address-postalcode,
        .billing-email,
        .billing-phone-number,
        .billing-postalcode,
        .billing-address-postal-code {
            width : 48% !important;
            margin: 0 !important;
            display: inline-block;
            vertical-align: top;
        }
        @media (max-width: 768px) {
            .billing-first-name,
            .billing-last-name,
            .billing-address-postalcode,
            .billing-address-infos div,
            .billing-email,
            .billing-phone-number,
            .billing-postalcode {
                width: 100% !important;
            }
        }
    `
  var head = document.head || document.getElementsByTagName('head')[0]
  var style = document.createElement('style')

  head.appendChild(style)
  style.appendChild(document.createTextNode(css))
}

function handleBillingSameClick(sameElement) {
  if (sameElement.checked) {
    setBillingAddress()
    $('.vtex-billing-address-form').hide()
    $('.billing-address-card').hide()
    $('.billing-form').hide()
  } else {
    setBillingAddress()
    $('.vtex-billing-address-form').show()
    if (digitalRiverBillingAddress && digitalRiverBillingAddress.isValid) {
      $('.billing-address-card').show()
      $('.billing-form').hide()
    } else {
      $('.billing-address-card').hide()
      $('.billing-form').show()
    }
  }
}

function handleBillingPostalCode(e) {
  const value = e.target.value
  if (!value) {
    $('.billing-address-infos').hide()
    return
  }
  const countryCode = vtexjs.checkout.orderForm.storePreferencesData.countryCode
  const url = `${window.location.origin}/api/checkout/pub/postal-code/${countryCode}/${value}`
  fetch(url)
    .then((resp) => resp.json())
    .then(async (data) => {
      if (data?.city) {
        $('#billing-city').val(data?.city)
        $('#billing-state').val(data?.state)
        await $('.billing-address-infos').show()
        setBillingAddress()
      } else {
        $('.billing-address-infos').hide()
        $('#billing-city').val('')
        $('#billing-state').val('')
        setBillingAddress()
        e.target.classList.add('error')
        e.target.insertAdjacentHTML(
          'afterend',
          '<span class="help error">Invalid postal code.</span>'
        )
      }
    })
    .catch((error) => {
      console.error(error)
    })
}

function handleBillingAddressInputs(target) {
  if ($('.DR-billing-address').length == 0) {
    return
  }
  if (target.hasAttribute('required')) {
    if (target.value) {
      target.classList.remove('error')
      $(target).parent('div').find('span').remove()
      setBillingAddress()
    } else {
      if (target.classList.contains('error')) return
      target.classList.add('error')
      target.insertAdjacentHTML(
        'afterend',
        '<span class="help error">This field is required.</span>'
      )
      setBillingAddress()
    }
  }
}

function setBillingAddress() {
  let data = {
    firstname: null,
    lastname: null,
    email: null,
    phonenumber: null,
    postalcode: null,
    addressline1: null,
    addressline2: null,
    city: null,
    state: null,
    isSame: false,
    isValid: false,
    orderFormId:
      vtexjs.checkout &&
      vtexjs.checkout.orderForm &&
      vtexjs.checkout.orderForm.orderFormId,
  }

  var isValid = true
  $('.vtex-billing-address-form input').each((i, item) => {
    const property = item.id.split('billing-')[1].replace('-', '')
    data[property] = item.value
    if ($(item).attr('required') && !item.value) {
      isValid = false
    }
  })
  data.isSame =
    $('#billing-the-same').length == 0
      ? true
      : $('#billing-the-same').is(':checked')
  data.isValid = isValid
  localStorage.setItem('DRBillingAddress', btoa(JSON.stringify(data)))
  digitalRiverBillingAddress = JSON.parse(
    atob(localStorage.getItem('DRBillingAddress'))
  )
}

function handleBillingAddressSubmit() {
  var validForm = true
  $('.vtex-billing-address-form input[required]').each((i, item) => {
    if (!item.value) {
      validForm = false
    }
    handleBillingAddressInputs(item)
  })
  if (validForm) {
    $('#drop-in').remove()
    loadDigitalRiver(vtexjs.checkout.orderForm)
    initDigitalRiver(vtexjs.checkout.orderForm)
  }
}

function getBillingAddress() {
  digitalRiverBillingAddress = localStorage.getItem('DRBillingAddress')
  if (digitalRiverBillingAddress) {
    digitalRiverBillingAddress = digitalRiverBillingAddress
      ? atob(digitalRiverBillingAddress)
      : digitalRiverBillingAddress
    digitalRiverBillingAddress = JSON.parse(digitalRiverBillingAddress)
  } else {
    setBillingAddress()
  }
}

function mountBillingAddress() {
  if ($('.DR-billing-address').length > 0) {
    return
  }
  var billingAddress = `
        <div class="DR-billing-address">
            <div class="vtex-billing-address">
                <div class="vtex-checkbox-billing">
                    <input type="checkbox" id="billing-the-same" onclick="handleBillingSameClick(this)" ${
                      digitalRiverBillingAddress &&
                      digitalRiverBillingAddress.isSame
                        ? 'checked'
                        : ''
                    } />
                    <label for="billing-the-same"><span><strong>My billing and shipping information are the same.</strong></span></label>
                </div>
                <div class="vtex-billing-address-form" style="${
                  digitalRiverBillingAddress &&
                  digitalRiverBillingAddress.isSame
                    ? 'display: none;'
                    : ''
                }">
                    <header>
                        <h3>Billing Address</h3>
                    </header>
                    <div class="billing-address-card" style="${
                      digitalRiverBillingAddress &&
                      !digitalRiverBillingAddress.isSame &&
                      digitalRiverBillingAddress.isValid
                        ? ''
                        : 'display: none;'
                    }">
                        <div class="billing-address-editcard">Edit</div>
                        <div>
                            <label>First name: </label><span>${
                              digitalRiverBillingAddress.firstname
                            }</span>
                        </div>
                        <div>
                            <label>Last name: </label><span>${
                              digitalRiverBillingAddress.lastname
                            }</span>
                        </div>
                        <div>
                            <label>Email: </label><span>${
                              digitalRiverBillingAddress.email
                            }</span>
                        </div>
                        <div>
                            <label>Phone number: </label><span>${
                              digitalRiverBillingAddress.phonenumber
                            }</span>
                        </div>
                        <div>
                            <label>Postal Code: </label><span>${
                              digitalRiverBillingAddress.postalcode
                            }</span>
                        </div>
                        <div>
                            <label>Address Line 1: </label><span>${
                              digitalRiverBillingAddress.addressline1
                            }</span>
                        </div>
                        <div>
                            <label>Address Line 2: </label><span>${
                              digitalRiverBillingAddress.addressline2
                            }</span>
                        </div>
                        <div>
                            <label>City: </label><span>${
                              digitalRiverBillingAddress.city
                            }</span>
                        </div>
                        <div>
                            <label>State: </label><span>${
                              digitalRiverBillingAddress.state
                            }</span>
                        </div>
                    </div>
                    <div class="billing-address-step-one billing-form" style="${
                      digitalRiverBillingAddress &&
                      !digitalRiverBillingAddress.isSame &&
                      !digitalRiverBillingAddress.isValid
                        ? 'display:block'
                        : 'display: none;'
                    }">
                        <div class="billing-first-name input text required">
                            <label for="billing-first-name">First name</label>
                            <input type="text" class="input-xlarge" value="${
                              digitalRiverBillingAddress &&
                              digitalRiverBillingAddress.firstname
                                ? digitalRiverBillingAddress.firstname
                                : ''
                            }" data-hj-whitelist="true" id="billing-first-name" required />
                        </div>
                        <div class="billing-last-name input text required">
                            <label for="billing-last-name"> Last name </label>
                            <input type="text" id="billing-last-name" value="${
                              digitalRiverBillingAddress &&
                              digitalRiverBillingAddress.lastname
                                ? digitalRiverBillingAddress.lastname
                                : ''
                            }" required />
                        </div>
                        <div class="billing-email input text required">
                            <label for="billing-email"> Email </label>
                            <input type="email" id="billing-email" value="${
                              digitalRiverBillingAddress &&
                              digitalRiverBillingAddress.email
                                ? digitalRiverBillingAddress.email
                                : ''
                            }" required />
                        </div>
                        <div  class="billing-phone-number input text required">
                            <label for="billing-last-name"> Phone number </label>
                            <input type="tel" id="billing-phone-number" value="${
                              digitalRiverBillingAddress &&
                              digitalRiverBillingAddress.phonenumber
                                ? digitalRiverBillingAddress.phonenumber
                                : ''
                            }" required />
                        </div>
                    </div>
                    <div class="billing-address-postal-code billing-form" style="${
                      digitalRiverBillingAddress &&
                      !digitalRiverBillingAddress.isSame &&
                      !digitalRiverBillingAddress.isValid
                        ? 'display:inline-block;'
                        : 'display: none;'
                    }">
                        <div class="input required text billing-postcode">
                            <label for="billing-postalcode">Postal Code</label>
                            <input type="text" id="billing-postalcode" value="${
                              digitalRiverBillingAddress &&
                              digitalRiverBillingAddress.postalcode
                                ? digitalRiverBillingAddress.postalcode
                                : ''
                            }" required />
                        </div>
                    </div>
                    <div class="billing-address-infos billing-form" style="${
                      digitalRiverBillingAddress &&
                      !digitalRiverBillingAddress.isSame &&
                      !digitalRiverBillingAddress.isValid &&
                      digitalRiverBillingAddress.postalcode
                        ? 'display:block;'
                        : 'display: none;'
                    }">
                        <div class="input required text">
                            <label for="billing-addressline1">Address Line 1</label>
                            <input type="text" id="billing-addressline1" value="${
                              digitalRiverBillingAddress &&
                              digitalRiverBillingAddress.addressline1
                                ? digitalRiverBillingAddress.addressline1
                                : ''
                            }" required />
                        </div>
                        <div class="input required text">
                            <label for="billing-addressline2">Address Line 2</label>
                            <input type="text" id="billing-addressline2" value="${
                              digitalRiverBillingAddress &&
                              digitalRiverBillingAddress.addressline2
                                ? digitalRiverBillingAddress.addressline2
                                : ''
                            }" />
                        </div>
                        <div class="input text required">
                            <label for="billing-city">City</label>
                            <input type="text" id="billing-city" value="${
                              digitalRiverBillingAddress &&
                              digitalRiverBillingAddress.city
                                ? digitalRiverBillingAddress.city
                                : ''
                            }" required />
                        </div>
                        <div class="input text required">
                            <label for="billing-state">State</label>
                            <input type="text" id="billing-state" value="${
                              digitalRiverBillingAddress &&
                              digitalRiverBillingAddress.state
                                ? digitalRiverBillingAddress.state
                                : ''
                            }" required />
                        </div>
                    </div>
                    <div class="billing-form" style="${
                      digitalRiverBillingAddress &&
                      !digitalRiverBillingAddress.isSame &&
                      !digitalRiverBillingAddress.isValid
                        ? 'display:block;'
                        : 'display: none;'
                    }"><button id="billing-address-submit">SAVE BILLING ADDRESS</button></div>
                </div>
            </div>
        </div>`
  $('#drop-in').prepend(billingAddress)
  $('#billing-postalcode').on('change', (e) => handleBillingPostalCode(e))
  $('.vtex-billing-address-form input').on('blur', (e) =>
    handleBillingAddressInputs(e.target)
  )
  $('#billing-address-submit').on('click', () => handleBillingAddressSubmit())
  $('.billing-address-editcard').on('click', () =>
    handleBillingAddressEditClick()
  )
}

function handleBillingAddressEditClick() {
  $('.billing-form').show()
  $('.billing-address-card').hide()
}

function loadDigitalRiver(orderForm) {
  const locale =
    orderForm &&
    orderForm.clientPreferencesData &&
    orderForm.clientPreferencesData.locale
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
    body: JSON.stringify({
      orderFormId: orderForm.orderFormId,
    }),
    /* 
      // Optionally you may include a taxIdPayload object in addition to the orderFormId, example:
      body: JSON.stringify({
        orderFormId: orderForm.orderFormId,
        taxIdPayload: {
          taxId: {
            type: 'uk',
            value: 'GB999999999',
          },
          customerType: 'business',
        },
      }),
    */
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
          showSavePaymentAgreement: orderForm.loggedIn,
          showTermsOfSaleDisclosure: true,
          button: {
            type: 'buyNow',
          },
        },
        billingAddress: {
          firstName:
            !digitalRiverBillingAddress.isSame &&
            digitalRiverBillingAddress.isValid
              ? digitalRiverBillingAddress.firstname
              : orderForm.clientProfileData.firstName,
          lastName:
            !digitalRiverBillingAddress.isSame &&
            digitalRiverBillingAddress.isValid
              ? digitalRiverBillingAddress.lastname
              : orderForm.clientProfileData.lastName,
          email:
            !digitalRiverBillingAddress.isSame &&
            digitalRiverBillingAddress.isValid
              ? digitalRiverBillingAddress.email
              : orderForm.clientProfileData.email,
          phoneNumber:
            digitalRiverBillingAddress.phonenumber ||
            orderForm.clientProfileData.phone,
          address: {
            line1:
              !digitalRiverBillingAddress.isSame &&
              digitalRiverBillingAddress.isValid
                ? digitalRiverBillingAddress.addressline1
                : `${
                    orderForm.shippingData.address.number
                      ? `${orderForm.shippingData.address.number} `
                      : ''
                  }${orderForm.shippingData.address.street}`,
            line2:
              !digitalRiverBillingAddress.isSame &&
              digitalRiverBillingAddress.isValid
                ? digitalRiverBillingAddress.addressline2
                : orderForm.shippingData.address.complement,
            city:
              !digitalRiverBillingAddress.isSame &&
              digitalRiverBillingAddress.isValid
                ? digitalRiverBillingAddress.city
                : orderForm.shippingData.address.city,
            state:
              !digitalRiverBillingAddress.isSame &&
              digitalRiverBillingAddress.isValid
                ? digitalRiverBillingAddress.state
                : orderForm.shippingData.address.state,
            postalCode:
              !digitalRiverBillingAddress.isSame &&
              digitalRiverBillingAddress.isValid
                ? digitalRiverBillingAddress.postalcode
                : orderForm.shippingData.address.postalCode,
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
          mountBillingAddress()
          loadStoredCards(checkoutId, paymentSessionId)
        },
      }
      const dropin = digitalriver.createDropin(configuration)
      $('#drop-in-spinner').remove()
      $('#drop-in').children().remove()
      dropin.mount('drop-in')
    })
}

$(document).ready(function () {
  loadDigitalRiverScript()
  if (~window.location.hash.indexOf('#/payment')) {
    if (
      $('.payment-group-item.active').attr('id') !==
      digitalRiverPaymentGroupButtonID
    ) {
      showBuyNowButton()
    }
  }
})

$(window).on('orderFormUpdated.vtex', function (evt, orderForm) {
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
      loadDigitalRiver(orderForm)
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

| Field         | Value                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| **URI**       | /\_v/api/digital-river/customers                                                                                     |
| **METHOD**    | GET                                                                                                                  |
| **API Usage** | Uses the orderFormId to get a matching Digital River customer. The email in the checkout must exist in Digital River |

_Example Headers:_
orderFormId: **orderFormId**

> ⚠️ _There must be an email associated with the orderFormId_

_Example Response:_

```json
{
  "id": "540988630336"
}
```

| Field         | Value                                                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **URI**       | /\_v/api/digital-river/tax-identifiers                                                                                                                                                  |
| **METHOD**    | GET                                                                                                                                                                                     |
| **API Usage** | Returns all tax ids. This API accepts the same query parameters as the [Digital River API](https://www.digitalriver.com/docs/digital-river-api-reference/#operation/listTaxIdentifiers) |

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

| Field         | Value                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **URI**       | /\_v/api/digital-river/tax-identifiers                                                                                                         |
| **METHOD**    | POST                                                                                                                                           |
| **API Usage** | Returns the created tax id. [Digital River API](https://www.digitalriver.com/docs/digital-river-api-reference/#operation/createTaxIdentifiers) |

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

| Field         | Value                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **URI**       | /\_v/api/digital-river/checkout/create                                                                                         |
| **METHOD**    | POST                                                                                                                           |
| **API Usage** | Creates Checkout [Digital River API](https://www.digitalriver.com/docs/digital-river-api-reference/#operation/createCheckouts) |

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
