package task.test.Wildberries.shopping;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/shopping")
public class ShoppingController {

    private final ShoppingService service;

    public ShoppingController(ShoppingService service) {
        this.service = service;
    }

    public record AddItemRequest(
            Marketplace marketplace,
            String productKey
    ) {}

    public record QuantityRequest(Integer quantity) {}

    private String username(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Please sign in"
            );
        }
        return principal.getName();
    }

    @GetMapping("/cart")
    public List<SavedItemResponse> cart(Principal principal) {
        return service.list(
                username(principal), SavedItemType.CART
        );
    }

    @GetMapping("/favorites")
    public List<SavedItemResponse> favorites(Principal principal) {
        return service.list(
                username(principal), SavedItemType.FAVORITE
        );
    }

    @PostMapping("/cart")
    public SavedItemResponse addToCart(
            Principal principal,
            @RequestBody AddItemRequest request
    ) {
        return service.add(
                username(principal),
                SavedItemType.CART,
                request.marketplace(),
                request.productKey()
        );
    }

    @PostMapping("/favorites")
    public SavedItemResponse addFavorite(
            Principal principal,
            @RequestBody AddItemRequest request
    ) {
        return service.add(
                username(principal),
                SavedItemType.FAVORITE,
                request.marketplace(),
                request.productKey()
        );
    }

    @PatchMapping("/cart/{itemId}")
    public SavedItemResponse updateQuantity(
            Principal principal,
            @PathVariable Long itemId,
            @RequestBody QuantityRequest request
    ) {
        if (request.quantity() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Quantity is required"
            );
        }

        return service.updateQuantity(
                username(principal), itemId, request.quantity()
        );
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> remove(
            Principal principal,
            @PathVariable Long itemId
    ) {
        service.remove(username(principal), itemId);
        return ResponseEntity.noContent().build();
    }
}