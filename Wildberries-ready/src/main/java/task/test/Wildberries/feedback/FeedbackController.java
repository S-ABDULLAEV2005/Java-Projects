package task.test.Wildberries.feedback;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import task.test.Wildberries.Service.FeedbackService;
import task.test.Wildberries.dto.FeedbackRequest;
import task.test.Wildberries.dto.FeedbackResponse;

import java.util.List;

@RestController
@RequestMapping("/feedbacks")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping("/product/{productId}")
    public ResponseEntity<FeedbackResponse> createFeedback(
            @PathVariable Long productId,
            @RequestBody FeedbackRequest request) {

        FeedbackResponse response =
                feedbackService.createFeedback(
                        productId,
                        request
                );

        if (response == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public List<FeedbackResponse> getAllFeedbacks() {
        return feedbackService.getAllFeedbacks();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeedbackResponse> getFeedbackById(
            @PathVariable Long id) {

        FeedbackResponse response =
                feedbackService.getFeedbackById(id);

        if (response == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<FeedbackResponse>> getFeedbacksByProductId(
            @PathVariable Long productId) {

        List<FeedbackResponse> responses =
                feedbackService.getFeedbacksByProductId(productId);

        if (responses == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FeedbackResponse> updateFeedback(
            @PathVariable Long id,
            @RequestBody FeedbackRequest request) {

        FeedbackResponse response =
                feedbackService.updateFeedback(id, request);

        if (response == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(
            @PathVariable Long id) {

        feedbackService.deleteFeedback(id);


        return ResponseEntity.noContent().build();
    }
}