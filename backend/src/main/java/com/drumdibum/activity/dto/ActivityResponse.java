package com.drumdibum.activity.dto;

import com.drumdibum.activity.Activity;
import com.drumdibum.activity.Rsvp;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.List;

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
    private boolean canceled;
    private Instant createdAt;
    private int acceptedCount;
    private int declinedCount;
    private int openCount;

    public static ActivityResponse from(Activity activity, List<Rsvp> rsvps) {
        int acceptedCount = (int) rsvps.stream()
                .filter(rsvp -> rsvp.getStatus() == Rsvp.RsvpStatus.ACCEPTED)
                .count();
        int declinedCount = (int) rsvps.stream()
                .filter(rsvp -> rsvp.getStatus() == Rsvp.RsvpStatus.DECLINED)
                .count();
        int openCount = (int) rsvps.stream()
                .filter(rsvp -> rsvp.getStatus() == Rsvp.RsvpStatus.OPEN)
                .count();

        return new ActivityResponse(
                activity.getId(),
                activity.getTitle(),
                activity.getDescription(),
                activity.getGroup().getId(),
                activity.getGroup().getName(),
                activity.getCreatedBy().getEmail(),
                activity.getScheduledAt(),
                activity.isCanceled(),
                activity.getCreatedAt(),
                acceptedCount,
                declinedCount,
                openCount);
    }
}
