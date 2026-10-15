package task.test.Wildberries.order;

import java.time.LocalDate;
import java.util.List;

public record OrderHistoryResponse(
        List<MyOrderResponse> items,
        long totalElements,
        int totalPages,
        int page,
        int size,
        LocalDate today
) {
}