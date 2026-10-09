package task.test.Wildberries.media;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/products/images")
public class ProductImageController {

    private final ProductImageService images;

    public ProductImageController(ProductImageService images) {
        this.images = images;
    }

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        if (authentication == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please sign in"
            );
        }

        boolean admin = authentication.getAuthorities()
                .stream()
                .anyMatch(role ->
                        role.getAuthority().equals("ROLE_ADMIN")
                );

        if (!admin) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin access is required"
            );
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of("imageUrl", images.upload(file)));
    }
}