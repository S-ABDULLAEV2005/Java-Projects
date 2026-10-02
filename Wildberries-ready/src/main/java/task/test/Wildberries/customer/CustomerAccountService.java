package task.test.Wildberries.customer;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import task.test.Wildberries.Security.AppUser;
import task.test.Wildberries.Security.AppUserRepository;

@Service
public class CustomerAccountService {

    private final CustomerRepository customerRepository;
    private final AppUserRepository appUserRepository;
    private final EntityManager entityManager;

    public CustomerAccountService(
            CustomerRepository customerRepository,
            AppUserRepository appUserRepository,
            EntityManager entityManager) {

        this.customerRepository = customerRepository;
        this.appUserRepository = appUserRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public void linkAccount(Long customerId, String username) {
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Username is required"
            );
        }

        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Account was not found"
                ));

        // Serialize links targeting the same account.
        entityManager.lock(user, LockModeType.PESSIMISTIC_WRITE);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer was not found"
                ));

        entityManager.lock(customer, LockModeType.PESSIMISTIC_WRITE);
        entityManager.refresh(customer);

        if (customer.getAppUser() != null) {
            if (customer.getAppUser().getId().equals(user.getId())) {
                return; // Already linked correctly.
            }

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This customer is already linked to another account"
            );
        }

        if (customerRepository.existsByAppUser_Id(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This account is already linked to another customer"
            );
        }

        customer.setAppUser(user);
        customerRepository.saveAndFlush(customer);
    }
}