package task.test.Wildberries.Service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import task.test.Wildberries.dto.DtoMapper;
import task.test.Wildberries.dto.FeedbackRequest;
import task.test.Wildberries.dto.FeedbackResponse;
import task.test.Wildberries.exception.DatabaseOperationException;
import task.test.Wildberries.exception.ResourceNotFoundException;
import task.test.Wildberries.feedback.Feedback;
import task.test.Wildberries.feedback.FeedbackRepo;
import task.test.Wildberries.product.Product;
import task.test.Wildberries.product.ProductRepository;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class FeedbackService {

    private final FeedbackRepo feedbackRepo;
    private final ProductRepository productRepository;

    public FeedbackService(
            FeedbackRepo feedbackRepo,
            ProductRepository productRepository) {

        this.feedbackRepo = feedbackRepo;
        this.productRepository = productRepository;
    }

    @Transactional
    public FeedbackResponse createFeedback(
            Long productId,
            FeedbackRequest request) {

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID: " + productId + " was not found"));

        Feedback feedback = DtoMapper.toFeedbackEntity(request, product);

        try{

            Feedback savedFeedback = feedbackRepo.save(feedback);
            return DtoMapper.toFeedbackResponse(savedFeedback);

        }catch (Exception exception){

            throw new DatabaseOperationException("Failed to create a feedback");
        }


    }

    public List<FeedbackResponse> getAllFeedbacks() {
        return feedbackRepo.findAll()
                .stream()
                .map(DtoMapper::toFeedbackResponse)
                .toList();
    }

    public FeedbackResponse getFeedbackById(Long id) {
        Feedback feedback = feedbackRepo
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("feedback with ID: " + id + " was not found"));


        return DtoMapper.toFeedbackResponse(feedback);

    }

    public List<FeedbackResponse> getFeedbacksByProductId(
            Long productId) {

        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Feedback with the product ID: " + productId + " was not found");
        }

        return feedbackRepo.findByProductId(productId)
                .stream()
                .map(DtoMapper::toFeedbackResponse)
                .toList();
    }

    @Transactional
    public FeedbackResponse updateFeedback(
            Long id,
            FeedbackRequest request) {

        Feedback existingFeedback = feedbackRepo
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback with ID: " + id + " was not found"));

        DtoMapper.updateFeedback(existingFeedback, request);
        try {

            Feedback savedFeedback = feedbackRepo.save(existingFeedback);
            return DtoMapper.toFeedbackResponse(savedFeedback);

        }catch (Exception exception){

            throw new DatabaseOperationException("Failed to update a feedback");
        }



    }

    @Transactional
    public void deleteFeedback(Long id) {
        if (!feedbackRepo.existsById(id)) {
            throw new ResourceNotFoundException("Feedback with ID: " + id + " was not found");
        }

        try {

            feedbackRepo.deleteById(id);

        }catch (Exception exception){

            throw new DatabaseOperationException("Failed to delete a feedback");
        }

    }
}