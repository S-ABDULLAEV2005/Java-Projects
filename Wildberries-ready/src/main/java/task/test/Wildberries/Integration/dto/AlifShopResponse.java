package task.test.Wildberries.Integration.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AlifShopResponse (
        AlifMetaResponse meta,
        List<AlifProductResponse> response
){
}
