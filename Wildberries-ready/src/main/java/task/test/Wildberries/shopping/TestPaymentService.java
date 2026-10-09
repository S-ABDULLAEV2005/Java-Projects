package task.test.Wildberries.shopping;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;
import task.test.Wildberries.Security.AppUser;
import task.test.Wildberries.Security.AppUserRepository;
import task.test.Wildberries.customer.Customer;
import task.test.Wildberries.customer.CustomerRepository;
import task.test.Wildberries.order.MyOrderResponse;
import task.test.Wildberries.order.Order;
import task.test.Wildberries.order.OrderItem;
import task.test.Wildberries.order.OrderRepository;
import task.test.Wildberries.order.OrderStatus;
import task.test.Wildberries.order.PaymentStatus;
import task.test.Wildberries.product.Product;

import java.time.LocalDateTime;
import java.util.Comparator;

@Service
public class TestPaymentService {

    private static final Logger log =
            LoggerFactory.getLogger(TestPaymentService.class);

    public enum Outcome {
        SUCCESS,
        DECLINE,
        CANCEL
    }

    private final AppUserRepository users;
    private final CustomerRepository customers;
    private final OrderRepository orders;
    private final EntityManager entityManager;
    private final boolean enabled;

    public TestPaymentService(
            AppUserRepository users,
            CustomerRepository customers,
            OrderRepository orders,
            EntityManager entityManager,
            @Value("${payment.test.enabled:false}") boolean enabled) {

        this.users = users;
        this.customers = customers;
        this.orders = orders;
        this.entityManager = entityManager;
        this.enabled = enabled;
    }

    @Transactional(readOnly = true)
    public MyOrderResponse get(String username, Long orderId) {
        requireEnabled();

        AppUser user = owner(username);
        Customer customer = customer(user);

        Order order = orders.findById(orderId)
                .orElseThrow(this::notFound);

        requireOwnedTestOrder(order, customer);

        return MyOrderResponse.from(order);
    }

    @Transactional
    public MyOrderResponse simulate(
            String username,
            Long orderId,
            Outcome outcome) {

        requireEnabled();

        if (outcome == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Choose SUCCESS, DECLINE or CANCEL"
            );
        }

        AppUser user = owner(username);

        // Same first lock as checkout.
        entityManager.lock(user, LockModeType.PESSIMISTIC_WRITE);

        Customer customer = customer(user);

        entityManager.lock(
                customer,
                LockModeType.PESSIMISTIC_WRITE
        );

        Order order = entityManager.find(
                Order.class,
                orderId,
                LockModeType.PESSIMISTIC_WRITE
        );

        if (order == null) {
            throw notFound();
        }

        requireOwnedTestOrder(order, customer);

        PaymentStatus current = order.getPaymentStatus();

        // Repeating success does not change the paid timestamp.
        if (current == PaymentStatus.PAID) {
            if (outcome == Outcome.SUCCESS) {
                return MyOrderResponse.from(order);
            }

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This order is already paid"
            );
        }

        // Repeating cancellation must not restore stock twice.
        if (current == PaymentStatus.CANCELLED) {
            if (outcome == Outcome.CANCEL) {
                return MyOrderResponse.from(order);
            }

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This order was cancelled. Create a new order"
            );
        }

        if (order.getStatus() != OrderStatus.NEW) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only new orders can use test payment"
            );
        }

        if (current != PaymentStatus.PENDING
                && current != PaymentStatus.DECLINED) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This order is not awaiting test payment"
            );
        }

        switch (outcome) {
            case SUCCESS -> {
                order.setPaymentStatus(PaymentStatus.PAID);
                order.setPaidAt(LocalDateTime.now());
            }

            case DECLINE -> {
                order.setPaymentStatus(PaymentStatus.DECLINED);
                order.setPaidAt(null);
            }

            case CANCEL -> {
                restoreStock(order);
                order.setPaymentStatus(PaymentStatus.CANCELLED);
                order.setStatus(OrderStatus.CANCELLED);
                order.setPaidAt(null);
            }
        }

        orders.flush();

        Long loggedOrderId = order.getId();
        PaymentStatus loggedStatus = order.getPaymentStatus();

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        log.info(
                                "Test payment committed: orderId={} paymentStatus={}",
                                loggedOrderId,
                                loggedStatus
                        );
                    }
                }
        );

        return MyOrderResponse.from(order);
    }

    private void restoreStock(Order order) {
        var lines = order.getItems()
                .stream()
                .sorted(Comparator.comparing(OrderItem::getProductId))
                .toList();

        for (OrderItem line : lines) {
            Product product = entityManager.find(
                    Product.class,
                    line.getProductId(),
                    LockModeType.PESSIMISTIC_WRITE
            );

            // An administrator may have deleted the product.
            if (product == null) {
                log.warn(
                        "Cancelled test order references deleted product: orderId={} productId={}",
                        order.getId(),
                        line.getProductId()
                );
                continue;
            }

            Integer quantity = line.getQuantity();

            if (quantity == null || quantity < 1) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "The order contains an invalid quantity"
                );
            }

            int stock = product.getQuantity() == null
                    ? 0
                    : product.getQuantity();

            try {
                product.setQuantity(
                        Math.addExact(stock, quantity)
                );
            } catch (ArithmeticException exception) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Stock exceeds the supported quantity"
                );
            }
        }
    }

    private AppUser owner(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Please sign in"
                ));
    }

    private Customer customer(AppUser user) {
        return customers.findByAppUser_Id(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Your account needs a linked customer profile"
                ));
    }

    private void requireOwnedTestOrder(
            Order order,
            Customer customer) {

        if (!order.isTestPayment()
                || order.getCustomer() == null
                || !customer.getId().equals(
                order.getCustomer().getId()
        )) {

            throw notFound();
        }
    }

    private void requireEnabled() {
        if (!enabled) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Test payments are disabled"
            );
        }
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Test order not found"
        );
    }
}