package task.test.Wildberries.product;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import jakarta.persistence.*;
import task.test.Wildberries.category.Category;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import lombok.*;
import task.test.Wildberries.feedback.Feedback;

@Entity
@Getter
@Setter
@NoArgsConstructor
@JsonPropertyOrder({
        "id",
        "name",
        "description",
        "price",
        "quantity",
        "brand",
        "imageUrl",
        "category",
        "feedback"
})
public class Product {/*Long productId, String productName, String productDescription, BigDecimal productPrice, Integer productQuantity, String productBrand*/

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private BigDecimal price;
    private Integer quantity;
    private String brand;

    @Column(name = "image_url")
    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @JsonManagedReference
    @OneToMany(mappedBy = "product")
    private List<Feedback> feedbacks = new ArrayList<>();

}
