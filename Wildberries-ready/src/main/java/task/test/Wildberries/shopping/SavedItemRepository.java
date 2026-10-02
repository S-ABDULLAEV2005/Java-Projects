package task.test.Wildberries.shopping;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedItemRepository
        extends JpaRepository<SavedItem, Long> {

    List<SavedItem> findAllByUser_IdAndItemTypeOrderByIdDesc(
            Long userId,
            SavedItemType itemType
    );

    Optional<SavedItem>
    findByUser_IdAndMarketplaceAndProductKeyAndItemType(
            Long userId,
            Marketplace marketplace,
            String productKey,
            SavedItemType itemType
    );

    Optional<SavedItem> findByIdAndUser_Id(
            Long id,
            Long userId
    );
}