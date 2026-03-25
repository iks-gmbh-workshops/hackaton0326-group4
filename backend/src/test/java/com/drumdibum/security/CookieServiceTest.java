package com.drumdibum.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class CookieServiceTest {

    @InjectMocks
    private CookieService cookieService;

    @Test
    void setJwtCookie_setsCorrectProperties() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        cookieService.setJwtCookie(response, "my-jwt-token");

        Cookie cookie = response.getCookie("jwt");
        assertThat(cookie).isNotNull();
        assertThat(cookie.getValue()).isEqualTo("my-jwt-token");
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getPath()).isEqualTo("/");
        assertThat(cookie.getMaxAge()).isEqualTo(86400);
    }

    @Test
    void clearJwtCookie_setsMaxAgeToZero() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        cookieService.clearJwtCookie(response);

        Cookie cookie = response.getCookie("jwt");
        assertThat(cookie).isNotNull();
        assertThat(cookie.getValue()).isEmpty();
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getPath()).isEqualTo("/");
        assertThat(cookie.getMaxAge()).isEqualTo(0);
    }
}
