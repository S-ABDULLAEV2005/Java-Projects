package task.test.Wildberries.shopping;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import task.test.Wildberries.Security.AppUser;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "favorite_collections")
@Getter
@Setter
@NoArgsConstructor
public class FavoriteCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 80)
    private String name;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "favorite_collection_items",
            joinColumns = @JoinColumn(name = "collection_id"),
            inverseJoinColumns = @JoinColumn(name = "saved_item_id"),
            uniqueConstraints = @UniqueConstraint(
                    name = "uk_collection_saved_item",
                    columnNames = {"collection_id", "saved_item_id"}
            )
    )
    private Set<SavedItem> favorites = new LinkedHashSet<>();
}