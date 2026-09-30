package task.test.Wildberries.Integration.Alif;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

@Service
public class AlifShopService {
    private final AlifShopClient alifShopClient;

    public AlifShopService(AlifShopClient alifShopClient) {
        this.alifShopClient = alifShopClient;
    }

    public JsonNode getProducts(String categorySlug, Integer cityId,
                                Integer page, Integer limit, String sortType) {
        validateSlug(categorySlug, "Category");
        validateCityId(cityId);
        validatePagination(page, limit);
        String safeSortType = sortType == null || sortType.isBlank() ? "popular" : sortType;
        return alifShopClient.getProducts(categorySlug, cityId, page, limit, safeSortType);
    }

    public JsonNode getCategory(String categorySlug, Integer cityId) {
        validateSlug(categorySlug, "Category");
        validateCityId(cityId);
        return alifShopClient.getCategory(categorySlug, cityId);
    }

    public JsonNode getProductDetails(String productSlug, Integer cityId) {
        validateSlug(productSlug, "Product");
        validateCityId(cityId);
        return alifShopClient.getProductDetails(productSlug, cityId);
    }

    public JsonNode getProductReviews(String productSlug, Integer page, Integer limit) {
        validateSlug(productSlug, "Product");
        validatePagination(page, limit);
        return alifShopClient.getProductReviews(productSlug, page, limit);
    }

    private void validateCityId(Integer cityId) {
        if (cityId == null || cityId < 1) {
            throw new IllegalArgumentException("cityId must be greater than 0");
        }
    }

    private void validatePagination(Integer page, Integer limit) {
        if (page == null || page < 1) {
            throw new IllegalArgumentException("page must be greater than 0");
        }
        if (limit == null || limit < 1 || limit > 100) {
            throw new IllegalArgumentException("limit must be between 1 and 100");
        }
    }

    private void validateSlug(String slug, String fieldName) {
        if (slug == null || slug.isBlank()) {
            throw new IllegalArgumentException(fieldName + " slug must not be empty");
        }
        if (!slug.matches("[a-z0-9-]+")) {
            throw new IllegalArgumentException(fieldName + " slug is invalid");
        }
    }

}