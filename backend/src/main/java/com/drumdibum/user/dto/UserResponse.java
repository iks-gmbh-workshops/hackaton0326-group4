package com.drumdibum.user.dto;

import com.drumdibum.user.User;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private Instant createdAt;

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(), 
                user.getEmail(),
                user.getFirstName(), 
                user.getLastName(),
                user.getCreatedAt());
    }
}
