const omit = require('lodash/omit');

class ElasticsearchProductMapper {

    /**
     * Decorates partial product object with full product data
     * fetched from ES
     * @param {Product[]} products
     * @returns {Promise<Product[]>}
     */
    decorateProducts (products, mapBy = 'product_id', omitFields = []) {
        if (!products || !(products instanceof Array)) {
            return Promise.reject(new Error('Products should be a valid array'));
        }

        const identifiers = products.map((product) => product[mapBy]);
        return this.es.search({
            index: `${this.index}_product`,
            body: {
                query: {
                    terms: {
                        id: [...identifiers]
                    }
                }
            }
        })
            .then(res => {
                const { hits: resp } = res.body;
                const docs = resp.hits.map(doc => doc._source);

                // Decorate assortment list products which only contains partial
                // product info with full ElasticSearch product data
                let output = products.reduce((acc, next) => {
                    const { [mapBy]: identifier, ...rest } = next;
                    const esProduct = docs.find(p => String(p.id) === String(identifier));
                    return [...acc, { ...rest, ...omit(esProduct, omitFields) }];
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

    constructor (db, config, storeCode) {
        this.es = db.getElasticClient();
        this.setIndex(storeCode, config);
    }
}

module.exports = ElasticsearchProductMapper;
