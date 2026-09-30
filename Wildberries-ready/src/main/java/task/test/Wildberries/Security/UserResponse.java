package task.test.Wildberries.Security;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private Role role;
}
