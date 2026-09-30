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

import java.time.LocalDateTime;
import java.util.List;

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
}