package task.test.Wildberries.dto;

import java.math.BigDecimal;

public record ProductRequest( String name,
                              String description,
                              BigDecimal price,
                              Integer quantity,
                              String brand,
                              String imageUrl) {
}
