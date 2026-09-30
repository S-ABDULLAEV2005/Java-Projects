package task.test.Wildberries.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(Long id,
                              String name,
                              String description,
                              BigDecimal price,
                              Integer quantity,
                              String brand,
                              String imageUrl,
                              CategoryResponse category,
                              List<FeedbackResponse> feedbacks) {
}
