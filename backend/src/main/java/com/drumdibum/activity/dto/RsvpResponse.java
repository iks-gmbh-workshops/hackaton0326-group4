package com.drumdibum.activity.dto;

import com.drumdibum.activity.Rsvp;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RsvpResponse {
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String status;

    public static RsvpResponse from(Rsvp rsvp) {
        var user = rsvp.getUser();
        return new RsvpResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                rsvp.getStatus().name());
    }
}
