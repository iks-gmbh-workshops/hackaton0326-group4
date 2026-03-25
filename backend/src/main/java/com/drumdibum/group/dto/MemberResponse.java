package com.drumdibum.group.dto;

import com.drumdibum.group.GroupMembership;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class MemberResponse {
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String status;
    private Instant joinedAt;

    public static MemberResponse from(GroupMembership membership) {
        var user = membership.getUser();
        return new MemberResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                membership.getStatus().name(),
                membership.getJoinedAt());
    }
}
