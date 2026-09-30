package task.test.Wildberries.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import task.test.Wildberries.category.Category;
import task.test.Wildberries.category.CategoryRepository;
import task.test.Wildberries.dto.DtoMapper;
import task.test.Wildberries.dto.ProductRequest;
import task.test.Wildberries.dto.ProductResponse;
import task.test.Wildberries.exception.DatabaseOperationException;
import task.test.Wildberries.exception.ResourceNotFoundException;
import task.test.Wildberries.product.Product;
import task.test.Wildberries.product.ProductRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository) {

        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public ProductResponse addProduct(
            Long categoryId,
            ProductRequest request) {

        Category category = categoryRepository
                .findById(categoryId)
                .orElseThrow(()-> new ResourceNotFoundException("Product with the category ID: " + categoryId + " was not found"));

        Product product = DtoMapper.toProductEntity(request, category);

        try{

            Product savedProduct = productRepository.save(product);
            return DtoMapper.toProductResponse(savedProduct);
        } catch (Exception exception) {
            throw new DatabaseOperationException("Failed to add a product");
        }

    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(DtoMapper::toProductResponse)
                .toList();
    }

    public List<ProductResponse> getSortedProducts(String field){
        return productRepository.findAll(Sort.by(field))
                .stream()
                .map(DtoMapper :: toProductResponse)
                .toList();
    }


    public ProductResponse getProductById(Long id) {
        Product product = productRepository
                .findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Product with ID: " + id + " was not found"));


        return DtoMapper.toProductResponse(product);
    }

    public List<ProductResponse> findByExactName(String name) {
        return productRepository.findByNameIgnoreCase(name)
                .stream()
                .map(DtoMapper::toProductResponse)
                .toList();
    }

    public List<ProductResponse> getProductsByCategory(
            Long categoryId) {

        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category with ID: " + categoryId + " was not found");
        }

        return productRepository.findByCategoryId(categoryId)
                .stream()
                .map(DtoMapper::toProductResponse)
                .toList();
    }

    public List<ProductResponse> getProductsCheaperThan(
            BigDecimal price) {

        return productRepository.findByPriceLessThan(price)
                .stream()
                .map(DtoMapper::toProductResponse)
                .toList();
    }

    @Transactional
    public ProductResponse updateProduct(
            Long id,
            Long categoryId,
            ProductRequest request) {

        Product existingProduct = productRepository
                .findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Product with ID: " + id + " was not found"));


        Category category = categoryRepository
                .findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category with ID: " + categoryId + " was not found"));


        DtoMapper.updateProduct(
                existingProduct,
                request,
                category
        );

        try {

            Product savedProduct = productRepository.save(existingProduct);

            return DtoMapper.toProductResponse(savedProduct);
        }catch(Exception exception){

            throw new DatabaseOperationException("Failed to update product");
        }
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product with ID: " + id + " was not found");
        }

        try {

            productRepository.deleteById(id);
        } catch (Exception exception) {
            throw new DatabaseOperationException("Failed to delete a product");
        }

    }

    public Page<ProductResponse> getProductWithPagination(int page,int size, String sortBy, String direction){
        Sort.Direction sortDirection;

        if(direction.equalsIgnoreCase("desc")){
            sortDirection = Sort.Direction.DESC;
        }else{
            sortDirection = Sort.Direction.ASC;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        return productRepository
                .findAll(pageable)
                .map(DtoMapper :: toProductResponse);
    }

    @Transactional
    public ProductResponse updateProductImage(
            Long productId,
            String imageUrl) {

        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException(
                    "Image URL must not be empty"
            );
        }

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product with ID: "
                                        + productId
                                        + " was not found"
                        )
                );

        product.setImageUrl(imageUrl);

        Product savedProduct = productRepository.save(product);

        return DtoMapper.toProductResponse(savedProduct);
    }
}