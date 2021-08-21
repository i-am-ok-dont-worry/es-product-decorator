const omit = require('lodash/omit');
const merge = require('lodash/merge');

class ElasticsearchProductMapper {

    /**
     * Decorates partial product object with full product data
     * fetched from ES
     * @param {Product[]} products
     * @returns {Promise<Product[]>}
     */
    decorateProducts (products, mapBy = 'product_id', omitFields = [], minimumShouldMatch) {
        if (!products || !(products instanceof Array)) {
            return Promise.reject(new Error('Products should be a valid array'));
        }

        const identifiers = products.map((product) => String(product[mapBy]));
        const mapFrom = mapBy === 'sku' ? 'sku_c' : 'id';
        const compareBy = mapBy === 'product_id' ? 'id' : mapBy;
        return this.es.search(this.getQuery(this.index, minimumShouldMatch ? mapBy : mapFrom, identifiers, minimumShouldMatch))
            .then(res => {
                const { hits: resp } = res.body;
                const docs = resp.hits.map(doc => doc._source);

                // Decorate assortment list products which only contains partial
                // product info with full ElasticSearch product data
                let output = products.reduce((acc, next) => {
                    const { [mapBy]: identifier, ...rest } = next;
                    const esProduct = docs.find(p => String(p[compareBy]) === String(identifier));
                    const extension_attributes = merge(next.extension_attributes, esProduct.extension_attributes);
                    return [...acc, { ...rest, [mapBy]: identifier, ...omit(esProduct, omitFields), extension_attributes }];
                }, []);

                return output;
            });
    }

    setIndex (storeCode, config) {
        if (storeCode) {
            const storeView = config.storeViews[storeCode];
            if (storeView && storeView.hasOwnProperty('elasticsearch')) {
                this.index = storeView.elasticsearch.index;
            } else if (config.hasOwnProperty('elasticsearch')) {
                this.index = config.elasticsearch.index;
            }
        } else {
            this.index = config.elasticsearch.index;
        }
    }

    getQuery(index, mapBy, identifier, minimumShouldMatch) {
        if (minimumShouldMatch && typeof minimumShouldMatch === 'string') {
            return {
                index: `${index}_product`,
                size: 1000,
                body: {
                    query: {
                        match: {
                            [mapBy]: {
                                query: identifier,
                                minimum_should_match: minimumShouldMatch
                            }
                        }
                    }
                }
            };
        } else {
            return {
                index: `${index}_product`,
                size: 1000,
                body: {
                    query: {
                        terms: {
                            [mapBy]: [...identifier]
                        }
                    }
                }
            };
        }
    }

    constructor (db, config, storeCode) {
        this.es = db.getElasticClient();
        this.setIndex(storeCode, config);
    }
}

module.exports = ElasticsearchProductMapper;
