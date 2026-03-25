package com.drumdibum.group.dto;

import com.drumdibum.group.Group;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class GroupResponse {
    private Long id;
    private String name;
    private String description;
    private String createdByEmail;
    private Instant createdAt;
    private int memberCount;

    public static GroupResponse from(Group group, int memberCount) {
        return new GroupResponse(
                group.getId(),
                group.getName(),
                group.getDescription(),
                group.getCreatedBy().getEmail(),
                group.getCreatedAt(),
                memberCount);
    }
}
