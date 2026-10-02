package task.test.Wildberries.customer;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByEmail(String email);

    boolean existsByAppUser_Id(Long appUserId);
    Optional<Customer> findByAppUser_Id(Long appUserId);

}