package task.test.Wildberries.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log =
            LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        long startedAt = System.nanoTime();
        boolean escapedFailure = false;

        try {
            filterChain.doFilter(request, response);
        } catch (IOException | ServletException | RuntimeException exception) {
            escapedFailure = true;

            log.error(
                    "Unhandled request failure: method={} route={}",
                    request.getMethod(),
                    routePattern(request),
                    exception
            );

            throw exception;
        } finally {
            long durationMs = TimeUnit.NANOSECONDS.toMillis(
                    System.nanoTime() - startedAt
            );

            if (!escapedFailure) {
                int status = response.getStatus();
                String route = routePattern(request);

                if (status >= 500) {
                    log.error(
                            "HTTP method={} route={} status={} durationMs={}",
                            request.getMethod(),
                            route,
                            status,
                            durationMs
                    );
                } else if (status >= 400) {
                    log.warn(
                            "HTTP method={} route={} status={} durationMs={}",
                            request.getMethod(),
                            route,
                            status,
                            durationMs
                    );
                } else {
                    log.info(
                            "HTTP method={} route={} status={} durationMs={}",
                            request.getMethod(),
                            route,
                            status,
                            durationMs
                    );
                }
            }
        }
    }

    private String routePattern(HttpServletRequest request) {
        Object pattern = request.getAttribute(
                HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE
        );

        return pattern == null
                ? "<unmapped>"
                : pattern.toString();
    }
}