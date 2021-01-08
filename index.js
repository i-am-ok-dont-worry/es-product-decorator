class ElasticsearchProductMapper {

    /**
     * Decorates partial product object with full product data
     * fetched from ES
     * @param {sku: string, product_id: string, last_ordered_data: Date} assortmentProducts
     * @returns {Promise<Product[]>}
     */
    decorateProducts (assortmentProducts) {
        if (!assortmentProducts || !(assortmentProducts instanceof Array)) {
            return Promise.reject(new Error('Products should be a valid array'));
        }

        const productIds = assortmentProducts.map(({ product_id }) => product_id);
        return this.es.search({
            index: `${this.index}_product`,
            body: {
                query: {
                    terms: {
                        id: [...productIds]
                    }
                }
            }
        })
            .then(res => {
                const { hits: resp } = res.body;
                const docs = resp.hits.map(doc => doc._source);

                // Decorate assortment list products which only contains partial
                // product info with full ElasticSearch product data
                let output = assortmentProducts.reduce((acc, next) => {
                    const { product_id: productId, ...rest } = next;
                    const esProduct = docs.find(p => p.id === productId);
                    return [...acc, { ...rest, ...esProduct }];
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
