package task.test.Wildberries.shopping;

import java.util.Comparator;
import java.util.List;

public record FavoriteCollectionResponse(
        Long id,
        String name,
        int itemCount,
        List<SavedItemResponse> items
) {

    public static FavoriteCollectionResponse from(
            FavoriteCollection collection
    ) {
        List<SavedItemResponse> favorites = collection.getFavorites()
                .stream()
                .sorted(Comparator.comparing(SavedItem::getId).reversed())
                .map(SavedItemResponse::from)
                .toList();

        return new FavoriteCollectionResponse(
                collection.getId(),
                collection.getName(),
                favorites.size(),
                favorites
        );
    }
}