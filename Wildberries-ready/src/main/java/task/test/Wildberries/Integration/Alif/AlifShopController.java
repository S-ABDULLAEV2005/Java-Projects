package task.test.Wildberries.Integration.Alif;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alif")
public class AlifShopController {
    private final AlifShopService alifShopService;

    public AlifShopController(AlifShopService alifShopService) {
        this.alifShopService = alifShopService;
    }

    @GetMapping("/categories")
    public List<AlifCategory> getCategories() {
        return List.of(
                new AlifCategory("Смартфоны", "smartfony"),
                new AlifCategory("Парфюмерия", "parfyumeriya"),
                new AlifCategory("Книги", "knigi"),
                new AlifCategory("Бытовая техника", "bytovaya-tehnika"),
                new AlifCategory("Наушники и аксессуары", "naushniki-i-aksessuary"),
                new AlifCategory("Компьютерная техника", "kompyuternaya-tehnika"),
                new AlifCategory("Мелкая бытовая техника", "melkaya-bytovaya-tehnika"),
                new AlifCategory("Спорт и хобби", "sport-i-hobbi"),
                new AlifCategory("Автотовары", "avtotovary"),
                new AlifCategory("Товары для красоты", "tovary-dlya-krasoty"),
                new AlifCategory("Техника для красоты", "tehnika-dlya-krasoty"),
                new AlifCategory("Строительство и ремонт", "stroitelstvo-i-remont"),
                new AlifCategory("Образование", "obrazovanie")
        );
    }

    @GetMapping("/categories/{categorySlug}")
    public ResponseEntity<JsonNode> getCategory(
            @PathVariable String categorySlug,
            @RequestParam(defaultValue = "1") Integer cityId) {
        return ResponseEntity.ok(alifShopService.getCategory(categorySlug, cityId));
    }

    @GetMapping("/products")
    public ResponseEntity<JsonNode> getProducts(
            @RequestParam String category,
            @RequestParam(defaultValue = "1") Integer cityId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "24") Integer limit,
            @RequestParam(defaultValue = "popular") String sortType) {
        return ResponseEntity.ok(
                alifShopService.getProducts(category, cityId, page, limit, sortType)
        );
    }

    @GetMapping("/products/{productSlug}")
    public ResponseEntity<JsonNode> getProductDetails(
            @PathVariable String productSlug,
            @RequestParam(defaultValue = "1") Integer cityId) {
        return ResponseEntity.ok(alifShopService.getProductDetails(productSlug, cityId));
    }

    @GetMapping("/products/{productSlug}/reviews")
    public ResponseEntity<JsonNode> getProductReviews(
            @PathVariable String productSlug,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer limit) {
        return ResponseEntity.ok(alifShopService.getProductReviews(productSlug, page, limit));
    }

    public record AlifCategory(String name, String slug) {
    }

}
