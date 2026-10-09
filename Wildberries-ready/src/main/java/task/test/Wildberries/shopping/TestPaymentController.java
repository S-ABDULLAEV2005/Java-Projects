package task.test.Wildberries.shopping;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import task.test.Wildberries.order.MyOrderResponse;

import java.security.Principal;

@RestController
@RequestMapping("/shopping/test-payments")
public class TestPaymentController {

    private final TestPaymentService payments;

    public TestPaymentController(TestPaymentService payments) {
        this.payments = payments;
    }

    public record PaymentRequest(
            TestPaymentService.Outcome outcome
    ) {
    }

    @GetMapping("/{orderId}")
    public MyOrderResponse get(
            @PathVariable Long orderId,
            Principal principal) {

        return payments.get(
                username(principal),
                orderId
        );
    }

    @PostMapping("/{orderId}")
    public MyOrderResponse simulate(
            @PathVariable Long orderId,
            @RequestBody PaymentRequest request,
            Principal principal) {

        return payments.simulate(
                username(principal),
                orderId,
                request.outcome()
        );
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
}