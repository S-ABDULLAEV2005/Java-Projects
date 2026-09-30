package task.test.Wildberries.dto;

public record FeedbackResponse(Long id,
                               Integer rating,
                               String comment,
                               Long productId,
                               String productName) {
}
