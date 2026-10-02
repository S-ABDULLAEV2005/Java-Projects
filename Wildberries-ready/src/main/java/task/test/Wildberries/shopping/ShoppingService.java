package task.test.Wildberries.shopping;

import jakarta.persistence.LockModeType;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import task.test.Wildberries.Security.AppUser;
import task.test.Wildberries.Security.AppUserRepository;
import task.test.Wildberries.product.Product;

import java.util.List;

@Service
@Transactional
public class ShoppingService {

    private final SavedItemRepository items;
    private final AppUserRepository users;
    private final EntityManager entityManager;

    public ShoppingService(
            SavedItemRepository items,
            AppUserRepository users,
            EntityManager entityManager
    ) {
        this.items = items;
        this.users = users;
        this.entityManager = entityManager;
    }

    private AppUser owner(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found"
                ));
    }
    private AppUser lockedOwner(String username) {
        AppUser user = owner(username);
        entityManager.lock(user, LockModeType.PESSIMISTIC_WRITE);
        return user;
    }

    private String validateKey(
            Marketplace marketplace,
            String productKey
    ) {
        if (marketplace == null || productKey == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Marketplace and product key are required"
            );
        }

        String key = productKey.trim();

        if (key.isEmpty() || key.length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid product key"
            );
        }

        if (marketplace == Marketplace.WILDMARKET) {
            long id;

            try {
                id = Long.parseLong(key);
            } catch (NumberFormatException exception) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid product ID"
                );
            }

            if (id <= 0 ||
                    entityManager.find(Product.class, id) == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found"
                );
            }

            return Long.toString(id);
        }

        // AlifShop keys are slugs, not local product IDs.
        return key;
    }

    private void validateQuantity(SavedItem item, int quantity) {
        if (quantity < 1 || quantity > 99) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity must be between 1 and 99"
            );
        }

        if (item.getMarketplace() == Marketplace.WILDMARKET) {
            Product product = entityManager.find(
                    Product.class,
                    Long.parseLong(item.getProductKey())
            );

            if (product == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product no longer exists"
                );
            }

            int stock = product.getQuantity() == null
                    ? 0 : product.getQuantity();

            if (quantity > stock) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Requested quantity exceeds available stock"
                );
            }
        }
    }

    @Transactional(readOnly = true)
    public List<SavedItemResponse> list(
            String username,
            SavedItemType type
    ) {
        return items
                .findAllByUser_IdAndItemTypeOrderByIdDesc(
                        owner(username).getId(), type
                )
                .stream()
                .map(SavedItemResponse::from)
                .toList();
    }

    public SavedItemResponse add(
            String username,
            SavedItemType type,
            Marketplace marketplace,
            String productKey
    ) {
        AppUser user = lockedOwner(username);
        String key = validateKey(marketplace, productKey);

        SavedItem item = items
                .findByUser_IdAndMarketplaceAndProductKeyAndItemType(
                        user.getId(), marketplace, key, type
                )
                .orElse(null);

        boolean existing = item != null;

        if (!existing) {
            item = new SavedItem();
            item.setUser(user);
            item.setMarketplace(marketplace);
            item.setProductKey(key);
            item.setItemType(type);
        }

        int quantity = type == SavedItemType.CART && existing
                ? item.getQuantity() + 1 : 1;

        if (type == SavedItemType.CART) {
            validateQuantity(item, quantity);
        }

        item.setQuantity(quantity);
        return SavedItemResponse.from(items.save(item));
    }

    public SavedItemResponse updateQuantity(
            String username,
            Long itemId,
            int quantity
    ) {
        SavedItem item = ownedItem(username, itemId);

        if (item.getItemType() != SavedItemType.CART) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only cart items have adjustable quantities"
            );
        }

        validateQuantity(item, quantity);
        item.setQuantity(quantity);

        return SavedItemResponse.from(items.save(item));
    }

    public void remove(String username, Long itemId) {
        items.delete(ownedItem(username, itemId));
    }

    private SavedItem ownedItem(String username, Long itemId) {
        AppUser user = lockedOwner(username);

        return items.findByIdAndUser_Id(itemId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Saved item not found"
                ));
    }
}