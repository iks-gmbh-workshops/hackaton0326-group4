package com.drumdibum.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        // Use a test secret that is long enough for HMAC-SHA256
        jwtService = new JwtService("test-secret-key-that-is-long-enough-for-hmac", 86400000L);
    }

    @Test
    void generateToken_returnsNonEmptyString() {
        String token = jwtService.generateToken("user@example.com");

        assertThat(token).isNotBlank();
    }

    @Test
    void extractEmail_returnsCorrectEmail() {
        String token = jwtService.generateToken("user@example.com");

        String email = jwtService.extractEmail(token);

        assertThat(email).isEqualTo("user@example.com");
    }

    @Test
    void isTokenValid_validToken_returnsTrue() {
        String token = jwtService.generateToken("user@example.com");

        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_invalidToken_returnsFalse() {
        assertThat(jwtService.isTokenValid("not.a.valid.jwt")).isFalse();
    }

    @Test
    void isTokenValid_emptyString_returnsFalse() {
        assertThat(jwtService.isTokenValid("")).isFalse();
    }

    @Test
    void isTokenValid_tamperedToken_returnsFalse() {
        String token = jwtService.generateToken("user@example.com");
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";

        assertThat(jwtService.isTokenValid(tampered)).isFalse();
    }

    @Test
    void isTokenValid_expiredToken_returnsFalse() {
        // Create a service with 0ms expiration so token is immediately expired
        JwtService expiredService = new JwtService("test-secret-key-that-is-long-enough-for-hmac", 0L);
        String token = expiredService.generateToken("user@example.com");

        assertThat(expiredService.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_tokenFromDifferentKey_returnsFalse() {
        JwtService otherService = new JwtService("completely-different-secret-key-for-testing", 86400000L);
        String token = otherService.generateToken("user@example.com");

        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void generateToken_differentEmailsProduceDifferentTokens() {
        String token1 = jwtService.generateToken("user1@example.com");
        String token2 = jwtService.generateToken("user2@example.com");

        assertThat(token1).isNotEqualTo(token2);
    }
}
