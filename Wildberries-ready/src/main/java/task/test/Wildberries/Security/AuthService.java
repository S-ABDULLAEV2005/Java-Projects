package task.test.Wildberries.Security;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import task.test.Wildberries.exception.DuplicateUsernameException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {

        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public UserResponse register(
            RegistrationRequest request) {

        if (appUserRepository.existsByUsername(
                request.getUsername())) {
            log.debug("Registration rejected: username already exists");

            throw new DuplicateUsernameException(
                    "Username already exists: "
                            + request.getUsername()
            );
        }

        AppUser appUser = new AppUser();

        appUser.setUsername(request.getUsername());

        appUser.setPassword(passwordEncoder.encode(request.getPassword()
                )
        );

        appUser.setRole(Role.USER);

        AppUser savedUser =
                appUserRepository.save(appUser);

        log.info(
                "User registered: userId={} role={}",
                savedUser.getId(),
                savedUser.getRole()
        );

        return new UserResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getRole()
        );
    }

    public AuthResponse login(LoginRequest request) {
        log.debug("Login authentication started");

        Authentication authentication;

        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException exception) {
            log.debug(
                    "Login authentication rejected: type={}",
                    exception.getClass().getSimpleName()
            );

            throw exception;
        }

        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        String token = jwtService.generateToken(userDetails);

        log.info("Login successful: access token issued");

        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds()
        );
    }
}