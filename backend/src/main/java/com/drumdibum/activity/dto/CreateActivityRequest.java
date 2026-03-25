package com.drumdibum.activity.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class CreateActivityRequest {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private Long groupId;

    @NotNull
    @Future(message = "Scheduled date must be in the future")
    private Instant scheduledAt;
}
