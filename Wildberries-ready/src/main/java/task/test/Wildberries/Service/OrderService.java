package task.test.Wildberries.Service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import task.test.Wildberries.customer.Customer;
import task.test.Wildberries.customer.CustomerRepository;
import task.test.Wildberries.dto.DtoMapper;
import task.test.Wildberries.dto.OrderResponse;
import task.test.Wildberries.exception.DatabaseOperationException;
import task.test.Wildberries.exception.ResourceNotFoundException;
import task.test.Wildberries.order.Order;
import task.test.Wildberries.order.OrderRepository;
import task.test.Wildberries.order.OrderStatus;
import task.test.Wildberries.order.MyOrderResponse;
import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Subquery;
import jakarta.persistence.criteria.Predicate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import task.test.Wildberries.order.OrderHistoryResponse;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    public OrderService(
            OrderRepository orderRepository,
            CustomerRepository customerRepository) {

        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public OrderResponse createOrder(Long customerId) {
        Customer customer = customerRepository
                .findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Order with an ID: " + customerId + " was not found"));



        Order order = new Order();

        order.setCustomer(customer);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(OrderStatus.NEW);

        try{

            Order savedOrder = orderRepository.save(order);
            return DtoMapper.toOrderResponse(savedOrder);

        } catch (Exception exception) {

            throw new DatabaseOperationException("Failed to create an order");
        }

    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(DtoMapper::toOrderResponse)
                .toList();
    }

    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order with ID: " + id + " was not found"));



        return DtoMapper.toOrderResponse(order);
    }

    public List<OrderResponse> getOrdersByCustomer(
            Long customerId) {

        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Order with ID: " + customerId + " was not found");
        }

        return orderRepository.findByCustomerId(customerId)
                .stream()
                .map(DtoMapper::toOrderResponse)
                .toList();
    }

    public List<OrderResponse> getOrdersByStatus(
            OrderStatus status) {

        return orderRepository.findByStatus(status)
                .stream()
                .map(DtoMapper::toOrderResponse)
                .toList();
    }

    @Transactional
    public OrderResponse changeOrderStatus(
            Long id,
            OrderStatus status) {

        Order order = orderRepository
                .findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Order with ID: " + id + " was not found"));


        order.setStatus(status);

        try{

            Order savedOrder = orderRepository.save(order);

            return DtoMapper.toOrderResponse(savedOrder);
        } catch (Exception exception) {
            throw new DatabaseOperationException("Failed to save an order");
        }
    }

    @Transactional
    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Order with ID: " + id + " was not found");
        }

        try {

            orderRepository.deleteById(id);
        } catch (Exception exception) {
            throw new DatabaseOperationException("Failed to delete an order");
        }

    }

    public List<MyOrderResponse> getMyOrders(String username) {
        return orderRepository
                .findByCustomer_AppUser_UsernameOrderByOrderDateDescIdDesc(
                        username
                )
                .stream()
                .map(MyOrderResponse::from)
                .toList();
    }
    public OrderHistoryResponse getMyOrderHistory(
            String username,
            String from,
            String to,
            String q,
            String status,
            int page,
            int size
    ) {
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please sign in"
            );
        }

        if (page < 0 || page > 999_999) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid page number"
            );
        }

        if (size < 1 || size > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page size must be between 1 and 50"
            );
        }

        LocalDate firstDay = parseHistoryDate(from);
        LocalDate lastDay = parseHistoryDate(to);

        if (firstDay != null
                && lastDay != null
                && firstDay.isAfter(lastDay)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "From date must not be after To date"
            );
        }

        String search = normalizeHistorySearch(q);
        boolean exactOrderOnly = search.startsWith("#");

        Long orderId = exactOrderOnly || search.matches("[0-9]+")
                ? parseHistoryOrderId(search)
                : null;

        String productPattern = search.isEmpty() || exactOrderOnly
                ? null
                : "%" + escapeHistoryLike(
                search.toLowerCase(Locale.ROOT)
        ) + "%";

        OrderStatus orderStatus = parseHistoryStatus(status);

        LocalDateTime start = firstDay == null
                ? null
                : firstDay.atStartOfDay();

        // Exclusive boundary includes the entire selected final day.
        LocalDateTime end = lastDay == null
                ? null
                : lastDay.plusDays(1).atStartOfDay();

        Specification<Order> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always restrict results to the authenticated account.
            predicates.add(
                    builder.equal(
                            root.get("customer")
                                    .get("appUser")
                                    .get("username"),
                            username
                    )
            );

            if (start != null) {
                predicates.add(
                        builder.greaterThanOrEqualTo(
                                root.<LocalDateTime>get("orderDate"),
                                start
                        )
                );
            }

            if (end != null) {
                predicates.add(
                        builder.lessThan(
                                root.<LocalDateTime>get("orderDate"),
                                end
                        )
                );
            }

            if (productPattern != null) {
                // Check whether this order has a matching purchased item.
                Subquery<Integer> matchingItems =
                        query.subquery(Integer.class);

                Join<Order, ?> item = matchingItems
                        .correlate(root)
                        .join("items");

                matchingItems.select(builder.literal(1));

                matchingItems.where(
                        builder.like(
                                builder.lower(
                                        item.<String>get("productName")
                                ),
                                productPattern,
                                '!'
                        )
                );

                Predicate nameMatches = builder.exists(matchingItems);

                predicates.add(
                        orderId == null
                                ? nameMatches
                                : builder.or(
                                builder.equal(
                                        root.get("id"),
                                        orderId
                                ),
                                nameMatches
                        )
                );
            } else if (orderId != null) {
                predicates.add(
                        builder.equal(root.get("id"), orderId)
                );
            }

            if (orderStatus != null) {
                predicates.add(
                        builder.equal(root.get("status"), orderStatus)
                );
            }

            return builder.and(
                    predicates.toArray(new Predicate[0])
            );
        };

        Sort sort = Sort.by(
                Sort.Order.desc("orderDate"),
                Sort.Order.desc("id")
        );

        Page<Order> result = orderRepository.findAll(
                specification,
                PageRequest.of(page, size, sort)
        );

        // Recover if a bookmarked page is beyond the available results.
        if (result.getTotalPages() > 0
                && page >= result.getTotalPages()) {
            result = orderRepository.findAll(
                    specification,
                    PageRequest.of(
                            result.getTotalPages() - 1,
                            size,
                            sort
                    )
            );
        }

        List<MyOrderResponse> orders = result.getContent()
                .stream()
                .map(MyOrderResponse::from)
                .toList();

        return new OrderHistoryResponse(
                orders,
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize(),
                LocalDate.now()
        );
    }

    private LocalDate parseHistoryDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            LocalDate date = LocalDate.parse(value.trim());

            if (date.getYear() < 1900 || date.getYear() > 9998) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Date year must be between 1900 and 9998"
                );
            }

            return date;
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Enter a valid date in YYYY-MM-DD format"
            );
        }
    }
    private String normalizeHistorySearch(String value) {
        String search = value == null ? "" : value.trim();

        if (search.length() > 200) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Search must not exceed 200 characters"
            );
        }

        return search;
    }

    private String escapeHistoryLike(String value) {
        return value
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
    }

    private Long parseHistoryOrderId(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String number = value.trim();

        if (number.startsWith("#")) {
            number = number.substring(1);
        }

        try {
            long id = Long.parseLong(number);

            if (id <= 0) {
                throw new NumberFormatException();
            }

            return id;
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Order number must be a positive whole number"
            );
        }
    }

    private OrderStatus parseHistoryStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return OrderStatus.valueOf(
                    value.trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid order status"
            );
        }
    }
}