package task.test.Wildberries.shopping;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteCollectionRepository
        extends JpaRepository<FavoriteCollection, Long> {

    @EntityGraph(attributePaths = "favorites")
    List<FavoriteCollection> findAllByUser_IdOrderByIdDesc(Long userId);

    @EntityGraph(attributePaths = "favorites")
    Optional<FavoriteCollection> findByIdAndUser_Id(
            Long id,
            Long userId
    );

    @Modifying(flushAutomatically = true)
    @Query(
            value = """
                    DELETE FROM favorite_collection_items
                    WHERE saved_item_id = :itemId
                    """,
            nativeQuery = true
    )
    int deleteMembershipsBySavedItemId(@Param("itemId") Long itemId);
}