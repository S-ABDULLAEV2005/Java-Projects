package task.test.Wildberries.exception;

public class ResourceNotFoundException extends RuntimeException{
    public ResourceNotFoundException(String message){
        super (message);
    }
}
