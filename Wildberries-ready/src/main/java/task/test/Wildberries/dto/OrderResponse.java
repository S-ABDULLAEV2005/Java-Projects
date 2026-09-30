package task.test.Wildberries.dto;

import task.test.Wildberries.order.OrderStatus;

import java.time.LocalDateTime;

public record OrderResponse(Long id,
                            CustomerResponse customer,
                            LocalDateTime orderDate,
                            OrderStatus status) {
}
