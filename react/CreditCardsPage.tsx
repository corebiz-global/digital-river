/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-key */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import type { FC } from 'react'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-apollo'
import { Alert, ButtonWithIcon, IconDelete } from 'vtex.styleguide'

import AppSettings from './graphql/appSettings.graphql'

declare global {
  interface Window {
    DigitalRiver: any
  }
}

const CreditCardsPage: FC = () => {
  const { formatMessage } = useIntl()
  const [customer, setCustomer] = useState({})
  const [alert, setAlert] = useState({})

  const { data } = useQuery(AppSettings, {
    variables: {
      version: process.env.VTEX_APP_VERSION,
    },
    ssr: false,
  })

  const getCustomer = async () => {
    const sourcesResponse = await fetch(
      `/_v/api/digital-river/checkout/sources?v=${new Date().getTime()}`
    )
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        return json
      })

    setCustomer(sourcesResponse?.customer || {})
  }

  const addCard = async (id: any) => {
    await fetch(`/_v/api/digital-river/source/${id}`)
    setTimeout(() => {
      getCustomer()
    }, 500)
  }

  const loadDigitalRiver = async (publicKey: string) => {
    const response = await fetch(
      `/_v/api/digital-river/my-account/profile?v=${new Date().getTime()}`
    )
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        return json
      })

    const {
      locale,
      firstName,
      lastName,
      email,
      address,
      phoneNumber,
    } = response

    const digitalriver = new window.DigitalRiver(publicKey, {
      locale,
    })

    const configuration = {
      options: {
        flow: 'managePaymentMethods',
        showComplianceSection: true,
        showSavePaymentAgreement: true,
        showTermsOfSaleDisclosure: true,
      },
      billingAddress: {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
      },
      onSuccess(data: any) {
        setAlert({})
        const { source, readyForStorage } = data

        if (source && readyForStorage) {
          addCard(source.id)
        }
      },
      onCancel() {},
      onError(data: any) {
        setAlert({})
        const { errors } = data

        if (errors.length > 0) {
          setAlert({
            type: 'error',
            message: errors[0].message,
          })
        }
      },
      onReady() {},
    }

    if (!firstName || !lastName || !email || !address) {
      setAlert({
        type: 'warning',
        message: (
          <label>
            {formatMessage({
              id: 'store/digital-river.credit-cards.warningText',
            })}
          </label>
        ),
      })
    } else {
      const dropin = digitalriver.createDropin(configuration)

      dropin.mount('drop-in')
    }
  }

  const deleteCard = async (id: any) => {
    await fetch(`/_v/api/digital-river/delete-source/${id}`)
    setTimeout(() => {
      getCustomer()
    }, 500)
  }

  const getCards = () => {
    const { sources }: any = customer

    return sources?.map((source: any) => {
      return (
        <div className="mb3">
          <label className="mr3" htmlFor={source.id}>{`${
            source.creditCard.brand
          } ${formatMessage({
            id: 'store/digital-river.credit-cards.endingWithLabel',
          })} ${source.creditCard.lastFourDigits} ${formatMessage({
            id: 'store/digital-river.credit-cards.expiresLabel',
          })} ${`0${source.creditCard.expirationMonth}`.slice(-2)}/${
            source.creditCard.expirationYear
          }`}</label>
          <ButtonWithIcon
            size="small"
            onClick={() => deleteCard(source.id)}
            icon={<IconDelete />}
          />
        </div>
      )
    })
  }

  useEffect(() => {
    if (!data?.appSettings?.message) return

    const parsedSettings = JSON.parse(data.appSettings.message)

    if (!parsedSettings?.digitalRiverPublicKey) return
    loadDigitalRiver(parsedSettings.digitalRiverPublicKey)
    getCustomer()
  }, [data])
  const { sources }: any = customer
  const { type, message }: any = alert

  return (
    <div className="pa7 mw7" style={{ margin: 'auto' }}>
      <div className="mb7">
        {sources?.length > 0 ? (
          <h3>
            {formatMessage({
              id: 'store/digital-river.credit-cards.storedLabel',
            })}
          </h3>
        ) : null}
        {getCards()}
      </div>
      {message ? (
        <div className="mb7">
          <Alert type={type}>{message}</Alert>
        </div>
      ) : null}
      <div id="drop-in" />
    </div>
  )
}

export default CreditCardsPage
