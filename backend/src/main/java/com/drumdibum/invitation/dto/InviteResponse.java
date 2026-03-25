package com.drumdibum.invitation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class InviteResponse {
    private String token;
    private String invitedEmail;
    private String groupName;
    private Instant expiresAt;
}
