package task.test.Wildberries.Security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;


import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AppUserRepository appUserRepository;

    @Test
    void shouldRegisterLoginAndAccessProtectedEndpoint()
            throws Exception {

        // ARRANGE: prepare registration information
        String username = "integration_user_" + UUID.randomUUID();

        String password = "password123";

        RegistrationRequest registrationRequest =
                new RegistrationRequest();

        registrationRequest.setUsername(username);
        registrationRequest.setPassword(password);

        // ACT 1: register the user
        mockMvc.perform( post("/auth/register")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(
                                                registrationRequest))
                )
                // ASSERT 1: check registration response
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());

        // ASSERT 2: check that user was saved
        AppUser savedUser = appUserRepository
                .findByUsername(username)
                .orElseThrow();

        assertThat(savedUser.getUsername())
                .isEqualTo(username);

        assertThat(savedUser.getRole())
                .isEqualTo(Role.USER);

        assertThat(savedUser.getPassword())
                .isNotEqualTo(password);

        assertThat(savedUser.getPassword())
                .startsWith("$2");

        // ARRANGE: prepare login information
        LoginRequest loginRequest = new LoginRequest();

        loginRequest.setUsername(username);
        loginRequest.setPassword(password);

        // ACT 2: log in and receive JWT
        MvcResult loginResult =
                mockMvc.perform(
                                post("/auth/login")
                                        .contentType("application/json")
                                        .content(
                                                objectMapper.writeValueAsString(
                                                        loginRequest
                                                )
                                        )
                        )
                        // ASSERT 3: check login response
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.token").isNotEmpty())
                        .andExpect(jsonPath("$.type").value("Bearer"))
                        .andExpect(jsonPath("$.expiresIn").value(3600))
                        .andReturn();

        // Extract JWT from the response
        String responseBody =
                loginResult.getResponse().getContentAsString();

        JsonNode responseJson =
                objectMapper.readTree(responseBody);

        String token =
                responseJson.get("token").asText();

        // ACT 3: send JWT to a protected endpoint
        mockMvc.perform(
                        get("/auth/me")
                                .header(
                                        "Authorization",
                                        "Bearer " + token
                                )
                )
                // ASSERT 4: Spring recognizes the user
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.username")
                                .value(username)
                )
                .andExpect(
                        jsonPath(
                                "$.authorities[0].authority"
                        ).value("ROLE_USER")
                );
    }

    @Test
    void shouldReturnConflictWhenUsernameAlreadyExists()
            throws Exception {

        String username =
                "duplicate_user_" + UUID.randomUUID();

        String password = "password123";

        RegistrationRequest request =
                new RegistrationRequest();

        request.setUsername(username);
        request.setPassword(password);

        String requestJson =
                objectMapper.writeValueAsString(request);

        // First registration must succeed
        mockMvc.perform(
                        post("/auth/register")
                                .contentType("application/json")
                                .content(requestJson)
                )
                .andExpect(status().isCreated());

        // Second registration with the same username must fail
        mockMvc.perform(
                        post("/auth/register")
                                .contentType("application/json")
                                .content(requestJson)
                )
                .andExpect(status().isConflict())
                .andExpect(
                        jsonPath("$.status")
                                .value(409)
                )
                .andExpect(
                        jsonPath("$.error")
                                .value("Conflict")
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Username already exists: "
                                                + username
                                )
                )
                .andExpect(
                        jsonPath("$.path")
                                .value("/auth/register")
                );
    }

    @Test
    void shouldReturnUnauthorizedWithoutJwt()
            throws Exception {

        mockMvc.perform(
                        get("/auth/me")
                )
                .andExpect(status().isUnauthorized());
    }
}