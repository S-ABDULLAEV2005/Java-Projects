package task.test.Wildberries.feedback;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

import java.util.ArrayList;

public interface FeedbackRepo extends JpaRepository<Feedback, Long > {
    List<Feedback> findByProductId(Long productId);
}
