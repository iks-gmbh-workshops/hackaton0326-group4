package com.drumdibum.activity.dto;

import com.drumdibum.activity.Rsvp;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RsvpRequest {

    @NotNull
    private Rsvp.RsvpStatus status;
}
