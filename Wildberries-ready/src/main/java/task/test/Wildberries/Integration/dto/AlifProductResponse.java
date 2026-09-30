package task.test.Wildberries.Integration.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AlifProductResponse(
        Long id,
        String name,
        String slug,
        BigDecimal rating,
        @JsonProperty("rating_count")
        Integer ratingCount,

        @JsonProperty("min_price")
        BigDecimal minPrice,

        @JsonProperty("final_price")
        BigDecimal finalPrice,

        @JsonProperty("default_duration")
        Integer defaultDuration,

        List<String> images,

        BigDecimal discount,

        @JsonProperty("discount_percent")
        Integer discountPercent,

        @JsonProperty("monthly_payment")
        BigDecimal monthlyPayment

){

}
