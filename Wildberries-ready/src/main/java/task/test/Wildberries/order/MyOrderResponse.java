package task.test.Wildberries.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record MyOrderResponse(
        Long id,
        LocalDateTime orderDate,
        OrderStatus status,
        List<ItemResponse> items,
        BigDecimal total,
        PaymentStatus paymentStatus,
        boolean testPayment,
        LocalDateTime paidAt
) {

    public record ItemResponse(
            Long productId,
            String productName,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal
    ) {
    }

    public static MyOrderResponse from(Order order) {
        List<ItemResponse> items = order.getItems()
                .stream()
                .map(item -> new ItemResponse(
                        item.getProductId(),
                        item.getProductName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal()
                ))
                .toList();

        BigDecimal total = items.isEmpty()
                ? null
                : items.stream()
                .map(ItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new MyOrderResponse(
                order.getId(),
                order.getOrderDate(),
                order.getStatus(),
                items,
                total,
                order.getPaymentStatus(),
                order.isTestPayment(),
                order.getPaidAt()
        );
    }
}