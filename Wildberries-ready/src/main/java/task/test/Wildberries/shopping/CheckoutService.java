package task.test.Wildberries.shopping;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import task.test.Wildberries.product.Product;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class CheckoutService {

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

        // Shared with cart mutations and customer-account linking.
        entityManager.lock(user, LockModeType.PESSIMISTIC_WRITE);

        Customer customer = customers.findByAppUser_Id(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Your account needs a linked customer profile before ordering"
                ));

        entityManager.lock(customer, LockModeType.PESSIMISTIC_WRITE);

        List<SavedItem> cart = savedItems
                .findAllByUser_IdAndItemTypeOrderByIdDesc(
                        user.getId(),
                        SavedItemType.CART
                )
                .stream()
                .filter(item ->
                        item.getMarketplace() == Marketplace.WILDMARKET
                )
                // Consistent product-lock order reduces deadlock risk.
                .sorted(Comparator.comparingLong(
                        item -> productId(item.getProductKey())
                ))
                .toList();

        if (cart.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Add a WildMarket product to your cart before ordering"
            );
        }

        Order order = new Order();
        order.setCustomer(customer);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(OrderStatus.NEW);

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

            order.addItem(orderItem);

            // The locked product is managed by Hibernate.
            product.setQuantity(stock - quantity);
        }

        Order savedOrder = orders.saveAndFlush(order);

        // Remove only the WildMarket rows included in this order.
        savedItems.deleteAll(cart);
        savedItems.flush();

        return MyOrderResponse.from(savedOrder);
    }

    private static long productId(String key) {
        try {
            long id = Long.parseLong(key);

            if (id > 0) {
                return id;
            }
        } catch (NumberFormatException ignored) {
            // Return a clear conflict for an invalid saved reference.
        }

        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A cart product reference is invalid"
        );
    }
}