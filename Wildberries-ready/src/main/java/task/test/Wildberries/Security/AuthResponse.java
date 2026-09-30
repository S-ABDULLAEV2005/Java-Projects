package task.test.Wildberries.Security;

public record AuthResponse(
        String token, String type, long expiresIn
) {
}
