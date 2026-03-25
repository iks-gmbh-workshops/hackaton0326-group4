package com.drumdibum.auth;

import com.drumdibum.auth.dto.AuthResponse;
import com.drumdibum.auth.dto.LoginRequest;
import com.drumdibum.auth.dto.RegisterRequest;
import com.drumdibum.security.CookieService;
import com.drumdibum.security.JwtService;
import com.drumdibum.user.User;
import com.drumdibum.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private CookieService cookieService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest buildRegisterRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("test@example.com");
        req.setPassword("Password1!");
        req.setFirstName("John");
        req.setLastName("Doe");
        req.setTosAccepted(true);
        return req;
    }

    // --- register ---

    @Test
    void register_success() {
        RegisterRequest req = buildRegisterRequest();
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password1!")).thenReturn("encodedPw");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = authService.register(req);

        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getFirstName()).isEqualTo("John");
        assertThat(response.getLastName()).isEqualTo("Doe");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("test@example.com");
        assertThat(saved.getPassword()).isEqualTo("encodedPw");
        assertThat(saved.isTosAccepted()).isTrue();
    }

    @Test
    void register_duplicateEmail_throws() {
        RegisterRequest req = buildRegisterRequest();
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email is already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_encodesPassword() {
        RegisterRequest req = buildRegisterRequest();
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode("Password1!")).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.register(req);

        verify(passwordEncoder).encode("Password1!");
    }

    // --- login ---

    @Test
    void login_success() {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("Password1!");
        HttpServletResponse response = mock(HttpServletResponse.class);

        User user = User.builder()
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .build();

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(jwtService.generateToken("test@example.com")).thenReturn("jwt-token");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        AuthResponse authResponse = authService.login(req, response);

        assertThat(authResponse.getEmail()).isEqualTo("test@example.com");
        assertThat(authResponse.getFirstName()).isEqualTo("John");
        assertThat(authResponse.getLastName()).isEqualTo("Doe");

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService).generateToken("test@example.com");
        verify(cookieService).setJwtCookie(response, "jwt-token");
    }

    @Test
    void login_authenticatesWithCorrectCredentials() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@test.com");
        req.setPassword("secret");
        HttpServletResponse response = mock(HttpServletResponse.class);

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(jwtService.generateToken(any())).thenReturn("token");
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(
                User.builder().email("user@test.com").firstName("A").lastName("B").build()));

        authService.login(req, response);

        ArgumentCaptor<UsernamePasswordAuthenticationToken> captor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(captor.capture());
        assertThat(captor.getValue().getPrincipal()).isEqualTo("user@test.com");
        assertThat(captor.getValue().getCredentials()).isEqualTo("secret");
    }

    // --- logout ---

    @Test
    void logout_clearsCookie() {
        HttpServletResponse response = mock(HttpServletResponse.class);

        authService.logout(response);

        verify(cookieService).clearJwtCookie(response);
    }
}
