package task.test.Wildberries.shopping;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/shopping/collections")
public class FavoriteCollectionController {

    private final FavoriteCollectionService service;

    public FavoriteCollectionController(
            FavoriteCollectionService service
    ) {
        this.service = service;
    }

    public record NameRequest(String name) {
    }

    private String username(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please sign in"
            );
        }

        return principal.getName();
    }

    @GetMapping
    public List<FavoriteCollectionResponse> list(
            Principal principal
    ) {
        return service.list(username(principal));
    }

    @PostMapping
    public ResponseEntity<FavoriteCollectionResponse> create(
            Principal principal,
            @RequestBody NameRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(
                        username(principal),
                        request.name()
                ));
    }

    @PatchMapping("/{collectionId}")
    public FavoriteCollectionResponse rename(
            Principal principal,
            @PathVariable Long collectionId,
            @RequestBody NameRequest request
    ) {
        return service.rename(
                username(principal),
                collectionId,
                request.name()
        );
    }

    @PutMapping("/{collectionId}/items/{savedItemId}")
    public FavoriteCollectionResponse addFavorite(
            Principal principal,
            @PathVariable Long collectionId,
            @PathVariable Long savedItemId
    ) {
        return service.addFavorite(
                username(principal),
                collectionId,
                savedItemId
        );
    }

    @DeleteMapping("/{collectionId}/items/{savedItemId}")
    public ResponseEntity<Void> removeFavorite(
            Principal principal,
            @PathVariable Long collectionId,
            @PathVariable Long savedItemId
    ) {
        service.removeFavorite(
                username(principal),
                collectionId,
                savedItemId
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{collectionId}")
    public ResponseEntity<Void> delete(
            Principal principal,
            @PathVariable Long collectionId
    ) {
        service.delete(username(principal), collectionId);
        return ResponseEntity.noContent().build();
    }
}