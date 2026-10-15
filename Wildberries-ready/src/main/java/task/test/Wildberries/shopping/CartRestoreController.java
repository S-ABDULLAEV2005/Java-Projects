package task.test.Wildberries.shopping;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;

@RestController
@RequestMapping("/shopping/cart")
public class CartRestoreController {

    private final ShoppingService service;

    public CartRestoreController(ShoppingService service) {
        this.service = service;
    }

    public record RestoreRequest(
            Marketplace marketplace,
            String productKey,
            Integer quantity
    ) {
    }

    @PostMapping("/restore")
    public SavedItemResponse restore(
            Principal principal,
            @RequestBody RestoreRequest request
    ) {
        if (principal == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please sign in"
            );
        }

        if (request.quantity() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity is required"
            );
        }

        return service.restoreCart(
                principal.getName(),
                request.marketplace(),
                request.productKey(),
                request.quantity()
        );
    }
}