package com.drumdibum.activity.dto;

import jakarta.validation.constraints.Future;
import lombok.Data;

import java.time.Instant;

@Data
public class UpdateActivityRequest {
    private String title;
    private String description;
    @Future
    private Instant scheduledAt;
}
