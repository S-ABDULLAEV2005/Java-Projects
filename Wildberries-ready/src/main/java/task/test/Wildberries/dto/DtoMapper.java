package task.test.Wildberries.dto;

import task.test.Wildberries.category.Category;

import task.test.Wildberries.customer.Customer;
import task.test.Wildberries.feedback.Feedback;
import task.test.Wildberries.order.Order;
import task.test.Wildberries.product.Product;

import java.util.List;

public final class DtoMapper {

    private DtoMapper() {
    }

    public static Category toCategoryEntity(CategoryRequest request) {
        Category category = new Category();

        category.setName(request.name());

        return category;
    }

    public static CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName()
        );
    }

    public static void updateCategory(
            Category existingCategory,
            CategoryRequest request) {

        existingCategory.setName(request.name());
    }

    public static Product toProductEntity(
            ProductRequest request,
            Category category) {

        Product product = new Product();

        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setQuantity(request.quantity());
        product.setBrand(request.brand());
        product.setImageUrl(request.imageUrl());
        product.setCategory(category);

        return product;
    }

    public static ProductResponse toProductResponse(Product product) {

        List<FeedbackResponse> feedbackResponses =
                product.getFeedbacks()
                        .stream()
                        .map(DtoMapper::toFeedbackResponse)
                        .toList();

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getQuantity(),
                product.getBrand(),
                product.getImageUrl(),
                toCategoryResponse(product.getCategory()),
                feedbackResponses
        );
    }

    public static void updateProduct(
            Product existingProduct,
            ProductRequest request,
            Category category) {

        existingProduct.setName(request.name());
        existingProduct.setDescription(request.description());
        existingProduct.setPrice(request.price());
        existingProduct.setQuantity(request.quantity());
        existingProduct.setBrand(request.brand());
        existingProduct.setImageUrl(request.imageUrl());
        existingProduct.setCategory(category);
    }

    public static Customer toCustomerEntity(CustomerRequest request) {
        Customer customer = new Customer();

        customer.setName(request.name());
        customer.setEmail(request.email());

        return customer;
    }

    public static CustomerResponse toCustomerResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getEmail()
        );
    }

    public static void updateCustomer(
            Customer existingCustomer,
            CustomerRequest request) {

        existingCustomer.setName(request.name());
        existingCustomer.setEmail(request.email());
    }

    public static OrderResponse toOrderResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                toCustomerResponse(order.getCustomer()),
                order.getOrderDate(),
                order.getStatus()
        );
    }

    public static Feedback toFeedbackEntity(
            FeedbackRequest request,
            Product product) {

        Feedback feedback = new Feedback();

        feedback.setRating(request.rating());
        feedback.setComment(request.comment());
        feedback.setProduct(product);

        return feedback;
    }

    public static FeedbackResponse toFeedbackResponse(
            Feedback feedback) {

        return new FeedbackResponse(
                feedback.getId(),
                feedback.getRating(),
                feedback.getComment(),
                feedback.getProduct().getId(),
                feedback.getProduct().getName()
        );
    }

    public static void updateFeedback(
            Feedback existingFeedback,
            FeedbackRequest request) {

        existingFeedback.setRating(request.rating());
        existingFeedback.setComment(request.comment());
    }
}