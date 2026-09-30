package task.test.Wildberries.Integration.Alif;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class AlifShopConfig {

    @Bean
    public RestClient alifShopRestClient(@Value("${alif-shop.base-url}") String baseUrl){
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Accept", "application/json")
                .build();
    }
}
