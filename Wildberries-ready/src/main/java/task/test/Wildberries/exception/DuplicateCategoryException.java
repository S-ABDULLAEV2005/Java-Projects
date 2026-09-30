package task.test.Wildberries.exception;

import org.springframework.web.bind.annotation.ExceptionHandler;


public class DuplicateCategoryException extends RuntimeException{
    public DuplicateCategoryException(String message){
        super(message);
    }
}
