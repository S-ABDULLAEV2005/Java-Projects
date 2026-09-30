package task.test.Wildberries.Integration.Alif;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AlifShopClient {
    private final RestClient alifShopRestClient;

    public AlifShopClient(RestClient alifShopRestClient) {
        this.alifShopRestClient = alifShopRestClient;
    }

    public JsonNode getProducts(String categorySlug, Integer cityId,
                                Integer page, Integer limit, String sortType) {
        return alifShopRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/service_product/products")
                        .queryParam("city_id", cityId)
                        .queryParam("category_slug", categorySlug)
                        .queryParam("page", page)
                        .queryParam("limit", limit)
                        .queryParam("sort_type", sortType)
                        .build())
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode getCategory(String categorySlug, Integer cityId) {
        return alifShopRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/service_product/categories/{slug}")
                        .queryParam("city_id", cityId)
                        .build(categorySlug))
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode getProductDetails(String productSlug, Integer cityId) {
        return alifShopRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/service_product/products/{slug}")
                        .queryParam("city_id", cityId)
                        .build(productSlug))
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode getProductReviews(String productSlug, Integer page, Integer limit) {
        return alifShopRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/service_product/reviews/by_product_slug/{slug}")
                        .queryParam("page", page)
                        .queryParam("limit", limit)
                        .build(productSlug))
                .retrieve()
                .body(JsonNode.class);
    }

}
