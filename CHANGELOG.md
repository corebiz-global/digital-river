# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Fix SonarCloud integration (GitHub Actions)

## [2.0.1] - 2021-12-03

### Fixed

- Disable automatic retry of Digital River API requests and increase timeout

## [2.0.0] - 2021-11-23

### Added

- Digital river invoices page under my account
- Digital river credit cards page under my account
- Added compliance in checkout's footer
- Added tax calculation inclusive and exclusive

## [1.3.0] - 2021-11-08

### Added

- Attached taxId to checkout whenever present

## [1.2.0] - 2021-11-01

### Added

- Added a post request for /tax-identifiers
- Returned customerId in createCheckout

## [1.1.2] - 2021-10-25

### Added

- Updated the /customers and /tax-identifiers API to use orderFormId in the header for auth
- Changed response of /tax-identifiers API to only return tax ids

## [1.1.1] - 2021-10-22

### Changed

- Use built in (to @vtex/api) session client

## [1.1.0] - 2021-10-08

### Added

- Added the /customers and /tax-identifiers API

## [1.0.0] - 2021-09-20

### Added

- Added submenu for configuration keys and catalog sync logs
- Added digital river key input type as password
- Added call service to add initial setup, it creates MD table for catalog sync logs and required specs at a product level (ECCN, Country of origin)
- Added configuration toggle for enable/disable full catalog sync
- Catalog sync logs is showed in a pagination table and can filter by status(error/success), order by product id, sku, executed
- Added service that adds specs product level (ECCN, Country of origin) and MD table
- Added service to sync full catalog to DR catalog
- Added trigger event to sync sku every time there is a sku change
- Added in checkout custom js support for saving profile
- Added in checkout custom js support for saving credit cards
- Added in checkout custom js support for use stored credit cards
- Added in checkout custom js support for compliance
- Added in checkout custom js support for terms and conditions

## [0.0.22] - 2021-04-19

### Fixed

- Changed the value of `authorizationId` to prevent overwriting when authorization is retried

## [0.0.21] - 2021-03-05

### Added

- Include VTEX cart item `uniqueId` when creating Digital River checkout
- Additional transaction log messaging

## [0.0.20] - 2021-02-17

### Changed

- When creating a Digital River checkout that includes products from a seller account, app now sends the seller SKU for each item instead of the marketplace SKU
- Update docs to explain new gateway affiliation Auto Settlement option

## [0.0.19] - 2021-02-15

### Changed

- Add `delayToAutoSettle` value of 7 days in authorization response
- Add shopper's credit card information to transaction log in authorization response

## [0.0.18] - 2021-02-14

### Fixed

- Send browser IP to Digital River when creating checkout
- Return early cancellation response if no Digital River Order ID is provided

## [0.0.17] - 2021-02-11

### Fixed

- `upstreamIds` should not be an array in `getOrdersByUpstreamId`

## [0.0.16] - 2021-02-11

### Fixed

- Send percentual discounts to Digital River as `percentOff` instead of `amountOff`

## [0.0.15] - 2021-02-11

### Fixed

- Percentual discount calculation

## [0.0.14] - 2021-02-11

### Fixed

- Add `ViewPayments` policy

## [0.0.13] - 2021-02-11

### Fixed

- Fixed URL parsing method from prior version again

## [0.0.12] - 2021-02-11

### Fixed

- Fixed URL parsing method from prior version again

## [0.0.11] - 2021-02-11

### Fixed

- Fixed URL parsing method from prior version again

## [0.0.10] - 2021-02-11

### Fixed

- Fixed URL parsing method from prior version

## [0.0.9] - 2021-02-11

### Fixed

- Improved method to get marketplace account name in a marketplace-seller authorization request

## [0.0.8] - 2021-02-11

### Changed

- Use locale from orderForm when creating Digital River checkout

## [0.0.7] - 2021-02-11

### Fixed

- Add mapping to determine originating Motorola account

## [0.0.6] - 2021-02-11

### Changed

- Set same address for Digital River `shipFrom` and `shipTo`

## [0.0.5] - 2021-02-11

### Changed

- Added `delayToCancel` attribute to payment authorization response
- Updated docs

## [0.0.4] - 2021-02-11

### Changed

- Improved transaction log messages

## [0.0.3] - 2021-02-11

### Fixed

- During payment authorization, update Digital River checkout with `upstreamId` prior to creating Digital River order

## [0.0.2] - 2021-02-11

### Changed

- Removed debug code related to Affirm payment connector
- Updated docs

## [0.0.1] - 2021-02-11

### Added

- Initial release
