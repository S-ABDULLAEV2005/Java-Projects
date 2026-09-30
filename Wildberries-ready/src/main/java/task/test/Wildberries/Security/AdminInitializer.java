package task.test.Wildberries.Security;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    public CommandLineRunner createAdmin(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder) {

        return args ->  {

            if (!appUserRepository
                    .existsByUsername("admin")) {

                AppUser admin = new AppUser();

                admin.setUsername("admin");

                admin.setPassword(
                        passwordEncoder.encode("admin123")
                );

                admin.setRole(Role.ADMIN);

                appUserRepository.save(admin);
            }
        };
    }
}