package com.drumdibum.user;

import com.drumdibum.security.CookieService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;
    @Mock
    private CookieService cookieService;

    @InjectMocks
    private UserController userController;

    @Test
    void deleteAccount_success_deletesUserAndClearsCookie() {
        UserDetails userDetails = new User("test@example.com", "password", java.util.Collections.emptyList());
        HttpServletResponse response = mock(HttpServletResponse.class);

        var result = userController.deleteAccount(userDetails, response);

        verify(userService).deleteAccount("test@example.com");
        verify(cookieService).clearJwtCookie(response);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
