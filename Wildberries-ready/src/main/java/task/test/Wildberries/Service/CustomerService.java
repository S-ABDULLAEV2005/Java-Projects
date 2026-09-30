package task.test.Wildberries.Service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import task.test.Wildberries.customer.Customer;
import task.test.Wildberries.customer.CustomerRepository;
import task.test.Wildberries.dto.CustomerRequest;
import task.test.Wildberries.dto.CustomerResponse;
import task.test.Wildberries.dto.DtoMapper;
import task.test.Wildberries.exception.DatabaseOperationException;
import task.test.Wildberries.exception.DuplicateEmailException;
import task.test.Wildberries.exception.ResourceNotFoundException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional
    public CustomerResponse addCustomer(CustomerRequest request) {

        if(customerRepository.existsByEmail(request.email())){
            throw new DuplicateEmailException("Customer with email " + request.email() + " already exists!");
        }
        Customer customer = DtoMapper.toCustomerEntity(request);

        try {

            Customer savedCustomer = customerRepository.save(customer);

            return DtoMapper.toCustomerResponse(savedCustomer);

        } catch (Exception exception){

            throw new DatabaseOperationException("Failed to save the customer");
        }
    }

    public List<CustomerResponse> getAllCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(DtoMapper::toCustomerResponse)
                .toList();
    }

    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer with ID: " + id + " was not found"));



        return DtoMapper.toCustomerResponse(customer);
    }

    @Transactional
    public CustomerResponse updateCustomer(
            Long id,
            CustomerRequest request) {

        Customer existingCustomer = customerRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer with ID: " + id + " was not found"));

            DtoMapper.updateCustomer(existingCustomer, request);
        try {

            Customer savedCustomer =
                    customerRepository.save(existingCustomer);

            return DtoMapper.toCustomerResponse(savedCustomer);

        }catch (Exception exception){

            throw new DatabaseOperationException("Failed to update a customer");
        }


    }

    @Transactional
    public void deleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {

            throw new ResourceNotFoundException("Customer with ID: " + id + " was not found");
        }

        try{

            customerRepository.deleteById(id);

        }catch(Exception exception){

            throw new DatabaseOperationException("Failed to delete a customer");

        }

    }
}