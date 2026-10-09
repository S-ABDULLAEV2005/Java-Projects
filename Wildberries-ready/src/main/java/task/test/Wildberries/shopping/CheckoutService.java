package task.test.Wildberries.shopping;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import task.test.Wildberries.Security.AppUser;
import task.test.Wildberries.Security.AppUserRepository;
import task.test.Wildberries.customer.Customer;
import task.test.Wildberries.customer.CustomerRepository;
import task.test.Wildberries.order.MyOrderResponse;
import task.test.Wildberries.order.Order;
import task.test.Wildberries.order.OrderItem;
import task.test.Wildberries.order.OrderRepository;
import task.test.Wildberries.order.OrderStatus;
import task.test.Wildberries.product.Product;
import org.springframework.beans.factory.annotation.Value;
import task.test.Wildberries.order.PaymentStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutService.class);
    @Value("${payment.test.enabled:false}")
    private boolean testPaymentsEnabled;

    private final AppUserRepository users;
    private final CustomerRepository customers;
    private final SavedItemRepository savedItems;
    private final OrderRepository orders;
    private final EntityManager entityManager;

    public CheckoutService(
            AppUserRepository users,
            CustomerRepository customers,
            SavedItemRepository savedItems,
            OrderRepository orders,
            EntityManager entityManager) {

        this.users = users;
        this.customers = customers;
        this.savedItems = savedItems;
        this.orders = orders;
        this.entityManager = entityManager;
    }

    @Transactional
    public MyOrderResponse checkout(String username) {
        AppUser user = users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Please sign in"
                ));

        entityManager.lock(user, LockModeType.PESSIMISTIC_WRITE);
        log.info("Checkout test payments enabled={}", testPaymentsEnabled);
        log.info("Checkout started: userId={}", user.getId());

        Customer customer = customers.findByAppUser_Id(user.getId())
                .orElseThrow(() -> {
                    log.warn(
                            "Checkout rejected: userId={} reason=missing_customer_profile",
                            user.getId()
                    );

                    return new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Your account needs a linked customer profile before ordering"
                    );
                });

        entityManager.lock(customer, LockModeType.PESSIMISTIC_WRITE);
        // Reuse an unfinished test order instead of reserving stock again.
        if (testPaymentsEnabled) {
            List<Order> unfinished = entityManager.createQuery(
                            """
                            select o from Order o
                            where o.customer.id = :customerId
                              and o.testPayment = true
                              and o.status = :orderStatus
                              and o.paymentStatus in :paymentStatuses
                            order by o.id desc
                            """,
                            Order.class
                    )
                    .setParameter("customerId", customer.getId())
                    .setParameter("orderStatus", OrderStatus.NEW)
                    .setParameter(
                            "paymentStatuses",
                            List.of(
                                    PaymentStatus.PENDING,
                                    PaymentStatus.DECLINED
                            )
                    )
                    .setMaxResults(1)
                    .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                    .getResultList();

            if (!unfinished.isEmpty()) {
                Order existing = unfinished.get(0);

                log.info(
                        "Existing test checkout reused: orderId={} userId={}",
                        existing.getId(),
                        user.getId()
                );

                return MyOrderResponse.from(existing);
            }
        }

        List<SavedItem> cart = savedItems
                .findAllByUser_IdAndItemTypeOrderByIdDesc(
                        user.getId(),
                        SavedItemType.CART
                )
                .stream()
                .filter(item ->
                        item.getMarketplace() == Marketplace.WILDMARKET
                )

                .sorted(Comparator.comparingLong(
                        item -> productId(item.getProductKey())
                ))
                .toList();

        if (cart.isEmpty()) {
            log.warn(
                    "Checkout rejected: userId={} reason=empty_local_cart",
                    user.getId()
            );
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Add a WildMarket product to your cart before ordering"
            );
        }

        Order order = new Order();
        order.setCustomer(customer);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(OrderStatus.NEW);
        order.setTestPayment(testPaymentsEnabled);

        order.setPaymentStatus(
                testPaymentsEnabled
                        ? PaymentStatus.PENDING
                        : PaymentStatus.UNPAID
        );

        BigDecimal loggingTotal = BigDecimal.ZERO;

        for (SavedItem cartItem : cart) {
            Long productId = productId(cartItem.getProductKey());

            Product product = entityManager.find(
                    Product.class,
                    productId,
                    LockModeType.PESSIMISTIC_WRITE
            );

            if (product == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A product in your cart no longer exists"
                );
            }

            Integer quantity = cartItem.getQuantity();

            if (quantity == null || quantity < 1 || quantity > 99) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A cart quantity is invalid"
                );
            }

            int stock = product.getQuantity() == null
                    ? 0
                    : product.getQuantity();

            if (quantity > stock) {
                log.warn(
                        "Checkout rejected: userId={} productId={} requested={} available={}",
                        user.getId(),
                        productId,
                        quantity,
                        stock
                );

                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Not enough stock for " + product.getName()
                );
            }

            BigDecimal price = product.getPrice();

            if (price == null || price.signum() < 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Price unavailable for " + product.getName()
                );
            }

            String name = product.getName();

            if (name == null || name.isBlank() || name.length() > 1000) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A product has invalid catalog information"
                );
            }

            BigDecimal unitPrice = price.setScale(
                    2,
                    RoundingMode.HALF_UP
            );

            if (unitPrice.precision() > 19) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A product price exceeds the supported amount"
                );
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(product.getId());
            orderItem.setProductName(name);
            orderItem.setQuantity(quantity);
            orderItem.setUnitPrice(unitPrice);
            loggingTotal = loggingTotal.add(
                    unitPrice.multiply(BigDecimal.valueOf(quantity))
            );

            log.debug(
                    "Checkout line prepared: userId={} productId={} quantity={}",
                    user.getId(),
                    productId,
                    quantity
            );

            order.addItem(orderItem);


            product.setQuantity(stock - quantity);
        }

        Order savedOrder = orders.saveAndFlush(order);


        savedItems.deleteAll(cart);
        savedItems.flush();

        Long loggedOrderId = savedOrder.getId();
        Long loggedUserId = user.getId();
        int loggedProductCount = cart.size();
        BigDecimal loggedTotal = loggingTotal;

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        log.info(
                                "Order committed: orderId={} userId={} productCount={} total={} currency=TJS",
                                loggedOrderId,
                                loggedUserId,
                                loggedProductCount,
                                loggedTotal
                        );
                    }

                    @Override
                    public void afterCompletion(int status) {
                        if (status != TransactionSynchronization.STATUS_COMMITTED) {
                            log.warn(
                                    "Checkout transaction did not commit: orderId={} userId={} completionStatus={}",
                                    loggedOrderId,
                                    loggedUserId,
                                    status
                            );
                        }
                    }
                }
        );

        return MyOrderResponse.from(savedOrder);
    }

    private static long productId(String key) {
        try {
            long id = Long.parseLong(key);

            if (id > 0) {
                return id;
            }
        } catch (NumberFormatException ignored) {

        }

        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A cart product reference is invalid"
        );
    }
}