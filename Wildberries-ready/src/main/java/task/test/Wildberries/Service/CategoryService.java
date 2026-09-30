package task.test.Wildberries.Service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import task.test.Wildberries.category.Category;
import task.test.Wildberries.category.CategoryRepository;
import task.test.Wildberries.dto.CategoryRequest;
import task.test.Wildberries.dto.CategoryResponse;
import task.test.Wildberries.dto.DtoMapper;
import task.test.Wildberries.exception.DatabaseOperationException;
import task.test.Wildberries.exception.ResourceNotFoundException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public CategoryResponse addCategory(CategoryRequest request) {
        Category category = DtoMapper.toCategoryEntity(request);

        try {
            Category savedCategory = categoryRepository.save(category);
            return DtoMapper.toCategoryResponse(savedCategory);

        } catch (Exception exception) {
            throw new DatabaseOperationException("Failed to save the category");
        }
        }


        public List<CategoryResponse> getAllCategories () {
            return categoryRepository.findAll()
                    .stream()
                    .map(DtoMapper::toCategoryResponse)
                    .toList();
        }

        public CategoryResponse getCategoryById (Long id){
            Category category = categoryRepository
                    .findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Category with ID: " + id + " was not found"));


            return DtoMapper.toCategoryResponse(category);
        }

        @Transactional
        public CategoryResponse updateCategory (
                Long id,
                CategoryRequest request) {

            Category existingCategory = categoryRepository
                    .findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Category with ID: " + id + " was not found"));


            DtoMapper.updateCategory(existingCategory, request);

            try {
                Category savedCategory = categoryRepository.save(existingCategory);

                return DtoMapper.toCategoryResponse(savedCategory);
            } catch (Exception exception) {
                throw new DatabaseOperationException("Failed to update category");
            }
        }

        @Transactional
        public void deleteCategory (Long id){
            if (!categoryRepository.existsById(id)) {
                throw new ResourceNotFoundException("Category with ID: " + id + " not found");
            }
            try {
                categoryRepository.deleteById(id);

            }catch (Exception exception) {
                throw new DatabaseOperationException("Failed to delete category");

            }



        }
    }
