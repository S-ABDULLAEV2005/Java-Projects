package task.test.Wildberries.shopping;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import task.test.Wildberries.Security.AppUser;
import task.test.Wildberries.Security.AppUserRepository;

import java.util.List;

@Service
@Transactional
public class FavoriteCollectionService {

    private static final Logger log =
            LoggerFactory.getLogger(FavoriteCollectionService.class);

    private final FavoriteCollectionRepository collections;
    private final SavedItemRepository savedItems;
    private final AppUserRepository users;
    private final EntityManager entityManager;

    public FavoriteCollectionService(
            FavoriteCollectionRepository collections,
            SavedItemRepository savedItems,
            AppUserRepository users,
            EntityManager entityManager
    ) {
        this.collections = collections;
        this.savedItems = savedItems;
        this.users = users;
        this.entityManager = entityManager;
    }

    private AppUser owner(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"
                ));
    }

    private AppUser lockedOwner(String username) {
        AppUser user = owner(username);
        entityManager.lock(user, LockModeType.PESSIMISTIC_WRITE);
        return user;
    }

    private FavoriteCollection ownedCollection(
            Long collectionId,
            Long userId
    ) {
        return collections.findByIdAndUser_Id(collectionId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Collection not found"
                ));
    }

    private String validateName(String name) {
        if (name == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Collection name is required"
            );
        }

        String trimmed = name.strip();

        if (trimmed.isEmpty() || trimmed.length() > 80) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Collection name must contain between 1 and 80 characters"
            );
        }

        if (trimmed.codePoints().anyMatch(Character::isISOControl)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Collection name contains invalid characters"
            );
        }

        return trimmed;
    }

    @Transactional(readOnly = true)
    public List<FavoriteCollectionResponse> list(String username) {
        Long userId = owner(username).getId();

        return collections.findAllByUser_IdOrderByIdDesc(userId)
                .stream()
                .map(FavoriteCollectionResponse::from)
                .toList();
    }

    public FavoriteCollectionResponse create(
            String username,
            String name
    ) {
        AppUser user = lockedOwner(username);

        FavoriteCollection collection = new FavoriteCollection();
        collection.setUser(user);
        collection.setName(validateName(name));

        FavoriteCollection saved = collections.save(collection);

        log.info(
                "Favorite collection created: userId={} collectionId={}",
                user.getId(),
                saved.getId()
        );

        return FavoriteCollectionResponse.from(saved);
    }

    public FavoriteCollectionResponse rename(
            String username,
            Long collectionId,
            String name
    ) {
        AppUser user = lockedOwner(username);
        FavoriteCollection collection =
                ownedCollection(collectionId, user.getId());

        collection.setName(validateName(name));

        log.info(
                "Favorite collection renamed: userId={} collectionId={}",
                user.getId(),
                collectionId
        );

        return FavoriteCollectionResponse.from(
                collections.save(collection)
        );
    }

    public FavoriteCollectionResponse addFavorite(
            String username,
            Long collectionId,
            Long savedItemId
    ) {
        AppUser user = lockedOwner(username);

        FavoriteCollection collection =
                ownedCollection(collectionId, user.getId());

        SavedItem favorite = savedItems
                .findByIdAndUser_Id(savedItemId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Favorite not found"
                ));

        if (favorite.getItemType() != SavedItemType.FAVORITE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only favorites can be added to a collection"
            );
        }

        boolean exists = collection.getFavorites()
                .stream()
                .anyMatch(item -> item.getId().equals(savedItemId));

        if (!exists) {
            collection.getFavorites().add(favorite);

            log.info(
                    "Favorite added to collection: userId={} collectionId={} itemId={}",
                    user.getId(),
                    collectionId,
                    savedItemId
            );
        }

        return FavoriteCollectionResponse.from(
                collections.save(collection)
        );
    }

    public void removeFavorite(
            String username,
            Long collectionId,
            Long savedItemId
    ) {
        AppUser user = lockedOwner(username);

        FavoriteCollection collection =
                ownedCollection(collectionId, user.getId());

        boolean removed = collection.getFavorites()
                .removeIf(item -> item.getId().equals(savedItemId));

        if (removed) {
            collections.save(collection);

            log.info(
                    "Favorite removed from collection: userId={} collectionId={} itemId={}",
                    user.getId(),
                    collectionId,
                    savedItemId
            );
        }
    }

    public void delete(String username, Long collectionId) {
        AppUser user = lockedOwner(username);

        FavoriteCollection collection =
                ownedCollection(collectionId, user.getId());

        collections.delete(collection);

        log.info(
                "Favorite collection deleted: userId={} collectionId={}",
                user.getId(),
                collectionId
        );
    }
}