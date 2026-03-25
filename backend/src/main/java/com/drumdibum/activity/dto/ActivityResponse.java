package com.drumdibum.activity.dto;

import com.drumdibum.activity.Activity;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class ActivityResponse {
    private Long id;
    private String title;
    private String description;
    private Long groupId;
    private String groupName;
    private String createdByEmail;
    private Instant scheduledAt;
    private Instant createdAt;

    public static ActivityResponse from(Activity activity) {
        return new ActivityResponse(
                activity.getId(),
                activity.getTitle(),
                activity.getDescription(),
                activity.getGroup().getId(),
                activity.getGroup().getName(),
                activity.getCreatedBy().getEmail(),
                activity.getScheduledAt(),
                activity.getCreatedAt());
    }
}
