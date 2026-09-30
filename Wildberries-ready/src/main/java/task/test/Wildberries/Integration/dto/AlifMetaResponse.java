package task.test.Wildberries.Integration.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AlifMetaResponse(boolean error, String message, Integer statusCode){

}
