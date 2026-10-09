package task.test.Wildberries.product;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import task.test.Wildberries.Service.ProductService;
import task.test.Wildberries.dto.ProductImageRequest;
import task.test.Wildberries.dto.ProductRequest;
import task.test.Wildberries.dto.ProductResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping("/category/{categoryId}")
    public ResponseEntity<ProductResponse> addProduct(
            @PathVariable Long categoryId,
            @RequestBody ProductRequest request) {

        ProductResponse response =
                productService.addProduct(categoryId, request);

        if (response == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/page")
    public Page<ProductResponse> getProductsWithPagination(@RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "5") int size,
                                                           @RequestParam(defaultValue = "id") String sortBy,
                                                           @RequestParam(defaultValue = "asc") String direction){
        return productService.getProductWithPagination(page, size, sortBy, direction);
    }


    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(
            @PathVariable Long id) {

        ProductResponse response =
                productService.getProductById(id);

        if (response == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/sort/{field}")
    public List<ProductResponse> getSortedProduct(@PathVariable String field){
        return productService.getSortedProducts(field);
    }

    @GetMapping("/search/{name}")
    public List<ProductResponse> findByExactName(
            @PathVariable String name) {

        return productService.findByExactName(name);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ProductResponse>> getProductsByCategory(
            @PathVariable Long categoryId) {

        List<ProductResponse> responses =
                productService.getProductsByCategory(categoryId);

        if (responses == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/price/{price}")
    public List<ProductResponse> getProductsCheaperThan(
            @PathVariable BigDecimal price) {

        return productService.getProductsCheaperThan(price);
    }

    @PutMapping("/{id}/category/{categoryId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @PathVariable Long categoryId,
            @RequestBody ProductRequest request) {

        ProductResponse response =
                productService.updateProduct(
                        id,
                        categoryId,
                        request
                );

        if (response == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(
            @PathVariable Long id) {

        try {
            productService.deleteProduct(id);

            return ResponseEntity.noContent().build();

        } catch (DataIntegrityViolationException exception) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message",
                            "Cannot delete this product because another related record prevents deletion."
                    ));
        }
    }

    @PatchMapping("/{id}/image")
    public ResponseEntity<ProductResponse> updateProductImage(
            @PathVariable Long id,
            @RequestBody ProductImageRequest request) {

        ProductResponse response =
                productService.updateProductImage(
                        id,
                        request.imageUrl()
                );

        return ResponseEntity.ok(response);
    }

}