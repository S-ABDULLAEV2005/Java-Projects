package task.test.Wildberries.Integration.Alif;

import com.fasterxml.jackson.databind.JsonNode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Component
public class AlifShopClient {

    private static final Logger log =
            LoggerFactory.getLogger(AlifShopClient.class);

    private static final long SLOW_REQUEST_MS = 3000;

    private final RestClient alifShopRestClient;

    public AlifShopClient(RestClient alifShopRestClient) {
        this.alifShopRestClient = alifShopRestClient;
    }

    public JsonNode getProducts(
            String categorySlug,
            Integer cityId,
            Integer page,
            Integer limit,
            String sortType) {

        return execute("getProducts", () ->
                alifShopRestClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/service_product/products")
                                .queryParam("city_id", cityId)
                                .queryParam("category_slug", categorySlug)
                                .queryParam("page", page)
                                .queryParam("limit", limit)
                                .queryParam("sort_type", sortType)
                                .build())
                        .retrieve()
                        .body(JsonNode.class)
        );
    }

    public JsonNode getCategory(
            String categorySlug,
            Integer cityId) {

        return execute("getCategory", () ->
                alifShopRestClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/service_product/categories/{slug}")
                                .queryParam("city_id", cityId)
                                .build(categorySlug))
                        .retrieve()
                        .body(JsonNode.class)
        );
    }

    public JsonNode getProductDetails(
            String productSlug,
            Integer cityId) {

        return execute("getProductDetails", () ->
                alifShopRestClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/service_product/products/{slug}")
                                .queryParam("city_id", cityId)
                                .build(productSlug))
                        .retrieve()
                        .body(JsonNode.class)
        );
    }

    public JsonNode getProductReviews(
            String productSlug,
            Integer page,
            Integer limit) {

        return execute("getProductReviews", () ->
                alifShopRestClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/service_product/reviews/by_product_slug/{slug}")
                                .queryParam("page", page)
                                .queryParam("limit", limit)
                                .build(productSlug))
                        .retrieve()
                        .body(JsonNode.class)
        );
    }

    private JsonNode execute(
            String operation,
            Supplier<JsonNode> request) {

        long startedAt = System.nanoTime();

        log.debug("AlifShop request started: operation={}", operation);

        try {
            JsonNode result = request.get();
            long durationMs = elapsedMillis(startedAt);

            if (durationMs >= SLOW_REQUEST_MS) {
                log.warn(
                        "AlifShop request was slow: operation={} durationMs={}",
                        operation,
                        durationMs
                );
            } else {
                log.debug(
                        "AlifShop request completed: operation={} durationMs={}",
                        operation,
                        durationMs
                );
            }

            return result;
        } catch (RestClientResponseException exception) {
            log.warn(
                    "AlifShop HTTP failure: operation={} status={} durationMs={}",
                    operation,
                    exception.getStatusCode().value(),
                    elapsedMillis(startedAt)
            );

            throw exception;
        } catch (RestClientException exception) {
            log.warn(
                    "AlifShop client failure: operation={} type={} durationMs={}",
                    operation,
                    exception.getClass().getSimpleName(),
                    elapsedMillis(startedAt)
            );

            throw exception;
        }
    }

    private long elapsedMillis(long startedAt) {
        return TimeUnit.NANOSECONDS.toMillis(
                System.nanoTime() - startedAt
        );
    }
}