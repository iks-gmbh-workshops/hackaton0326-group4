package com.drumdibum.auth;

import com.drumdibum.auth.dto.AuthResponse;
import com.drumdibum.auth.dto.LoginRequest;
import com.drumdibum.auth.dto.RegisterRequest;
import com.drumdibum.security.CookieService;
import com.drumdibum.security.JwtService;
import com.drumdibum.user.User;
import com.drumdibum.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CookieService cookieService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .tosAccepted(request.isTosAccepted())
                .build();

        userRepository.save(user);
        return new AuthResponse(user.getEmail(), user.getFirstName(), user.getLastName());
    }

    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        String token = jwtService.generateToken(request.getEmail());
        cookieService.setJwtCookie(response, token);

        var user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        return new AuthResponse(user.getEmail(), user.getFirstName(), user.getLastName());
    }

    public void logout(HttpServletResponse response) {
        cookieService.clearJwtCookie(response);
    }
}
