/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-key */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Fragment } from 'react'
import type { FC } from 'react'
import { Route } from 'vtex.my-account-commons/Router'

import InvoicesPage from './InvoicesPage'
import CreditCardsPage from './CreditCardsPage'

const MyAppPage: FC = () => {
  return (
    <Fragment>
      <Route exact path="/credit-cards" component={CreditCardsPage} />
      <Route exact path="/invoices" component={InvoicesPage} />
    </Fragment>
  )
}

export default MyAppPage
