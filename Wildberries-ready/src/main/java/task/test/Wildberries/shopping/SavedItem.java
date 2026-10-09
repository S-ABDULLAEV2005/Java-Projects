package task.test.Wildberries.shopping;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import task.test.Wildberries.Security.AppUser;

@Entity
@Table(
        name = "saved_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_saved_item_user_marketplace_product_type",
                columnNames = {
                        "user_id", "marketplace", "product_key", "item_type"
                }
        )
)
@Getter
@Setter
@NoArgsConstructor
public class SavedItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Marketplace marketplace;


    @Column(name = "product_key", nullable = false, length = 255)
    private String productKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private SavedItemType itemType;

    
    @Column(nullable = false)
    private Integer quantity = 1;
}