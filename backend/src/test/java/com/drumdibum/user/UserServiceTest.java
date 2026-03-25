package com.drumdibum.user;

import com.drumdibum.activity.RsvpRepository;
import com.drumdibum.exception.ResourceNotFoundException;
import com.drumdibum.group.GroupMembershipRepository;
import com.drumdibum.user.dto.UpdateProfileRequest;
import com.drumdibum.user.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private GroupMembershipRepository groupMembershipRepository;
    @Mock
    private RsvpRepository rsvpRepository;

    @InjectMocks
    private UserService userService;

    private User testUser() {
        return User.builder()
                .id(1L)
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .createdAt(Instant.parse("2025-01-01T00:00:00Z"))
                .build();
    }

    // --- getProfile ---

    @Test
    void getProfile_success() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        UserResponse response = userService.getProfile("test@example.com");

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getFirstName()).isEqualTo("John");
        assertThat(response.getLastName()).isEqualTo("Doe");
        assertThat(response.getCreatedAt()).isEqualTo(Instant.parse("2025-01-01T00:00:00Z"));
    }

    @Test
    void getProfile_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getProfile("missing@example.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    // --- updateProfile ---

    @Test
    void updateProfile_success() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setFirstName("Jane");
        req.setLastName("Smith");

        UserResponse response = userService.updateProfile("test@example.com", req);

        assertThat(response.getFirstName()).isEqualTo("Jane");
        assertThat(response.getLastName()).isEqualTo("Smith");
        verify(userRepository).save(user);
    }

    @Test
    void updateProfile_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setFirstName("A");
        req.setLastName("B");

        assertThatThrownBy(() -> userService.updateProfile("missing@example.com", req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- deleteAccount ---

    @Test
    void deleteAccount_success_deletesInCorrectOrder() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        userService.deleteAccount("test@example.com");

        InOrder inOrder = inOrder(rsvpRepository, groupMembershipRepository, userRepository);
        inOrder.verify(rsvpRepository).deleteByUserId(1L);
        inOrder.verify(groupMembershipRepository).deleteByUserId(1L);
        inOrder.verify(userRepository).delete(user);
    }

    @Test
    void deleteAccount_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteAccount("missing@example.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");

        verify(rsvpRepository, never()).deleteByUserId(any());
        verify(groupMembershipRepository, never()).deleteByUserId(any());
        verify(userRepository, never()).delete(any());
    }
}
