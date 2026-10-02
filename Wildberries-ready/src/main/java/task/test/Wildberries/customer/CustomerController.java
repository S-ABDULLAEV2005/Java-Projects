package task.test.Wildberries.customer;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import task.test.Wildberries.Service.CustomerService;
import task.test.Wildberries.dto.CustomerRequest;
import task.test.Wildberries.dto.CustomerResponse;

import java.util.List;

@RestController
@RequestMapping("/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final CustomerAccountService customerAccountService;

    public CustomerController(
            CustomerService customerService,
            CustomerAccountService customerAccountService) {

        this.customerService = customerService;
        this.customerAccountService = customerAccountService;
    }
    @PostMapping
    public ResponseEntity<CustomerResponse> addCustomer(
            @RequestBody CustomerRequest request) {

        CustomerResponse response =
                customerService.addCustomer(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public List<CustomerResponse> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getCustomerById(
            @PathVariable Long id) {

        CustomerResponse response =
                customerService.getCustomerById(id);

        if (response == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @RequestBody CustomerRequest request) {

        CustomerResponse response =
                customerService.updateCustomer(id, request);

        if (response == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(
            @PathVariable Long id) {

        customerService.deleteCustomer(id);

        return ResponseEntity.noContent().build();
    }

    public record LinkAccountRequest(String username) {}

    @PatchMapping("/{id}/account")
    public ResponseEntity<Void> linkAccount(
            @PathVariable Long id,
            @RequestBody LinkAccountRequest request) {

        customerAccountService.linkAccount(id, request.username());

        return ResponseEntity.noContent().build();
    }
}