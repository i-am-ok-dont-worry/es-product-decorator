# Elasticsearch product decorator
Decorates partial Magento products with full ES response. This class is useful for every case 
when Magento returns picked properties of a product object and response must be extended 
with full product object.

## API

* `decorateProducts(products, mapBy = 'product_id', omitFields = [])` - returns list of 
[Product](https://gitlab.grupakmk.pl/internal/frontend/api/lib/libstorefront/-/blob/development/src/model/product.ts) objects.
`products` parameter is a list of a partial 
product objects for example: 
```javascript
[
  { 
    product_id: 123131
  }
]
```
`mapBy` - is a key by which ES will be bound - `product_id` by default
`omitFields` - use this parameter to specify which fields will not be overriden with ES response (e.g. price)

* `setIndex(storeCode, config)` - sets custom index which will be queried to retrive products data (`vue_storefront_catalog`) by default.
Index data is by default pumped from `local.json` config file by API config.
