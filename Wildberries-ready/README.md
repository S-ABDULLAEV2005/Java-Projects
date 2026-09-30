# Wildberries REST API

Base package: `task.test.Wildberries`

Before starting, create a PostgreSQL database named `wildberries` and replace
`CHANGE_ME` in `src/main/resources/application.properties` with your password.

## Postman endpoints

### Categories

- `POST /categories`
- `GET /categories`
- `GET /categories/{id}`
- `PUT /categories/{id}`
- `DELETE /categories/{id}`

Category request body:

```json
{
  "name": "Electronics"
}
```

### Products

- `POST /products/category/{categoryId}`
- `GET /products`
- `GET /products/{id}`
- `GET /products/search?name=Phone`
- `GET /products/category/{categoryId}`
- `GET /products/cheaper-than?price=1000.00`
- `PUT /products/{id}/category/{categoryId}`
- `DELETE /products/{id}`

Product request body:

```json
{
  "name": "Phone",
  "description": "Smartphone",
  "price": 799.99,
  "quantity": 10,
  "brand": "Example"
}
```

### Customers

- `POST /customers`
- `GET /customers`
- `GET /customers/{id}`
- `PUT /customers/{id}`
- `DELETE /customers/{id}`

Customer request body:

```json
{
  "name": "Alex",
  "email": "alex@example.com"
}
```

### Orders

- `POST /orders/customer/{customerId}`
- `GET /orders`
- `GET /orders/{id}`
- `GET /orders/customer/{customerId}`
- `GET /orders/status/{status}`
- `PATCH /orders/{id}/status?status=SHIPPED`
- `DELETE /orders/{id}`

New orders automatically receive the current date and the `NEW` status.
