package com.drumdibum.activity;

import com.drumdibum.activity.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping("/activities")
    public ResponseEntity<ActivityResponse> createActivity(@AuthenticationPrincipal UserDetails userDetails,
                                                            @Valid @RequestBody CreateActivityRequest request) {
        return ResponseEntity.ok(activityService.createActivity(userDetails.getUsername(), request));
    }

    @GetMapping("/groups/{groupId}/activities")
    public ResponseEntity<List<ActivityResponse>> getUpcomingActivities(@PathVariable Long groupId) {
        return ResponseEntity.ok(activityService.getUpcomingActivities(groupId));
    }

    @GetMapping("/activities/{activityId}")
    public ResponseEntity<ActivityResponse> getActivity(@PathVariable Long activityId) {
        return ResponseEntity.ok(activityService.getActivity(activityId));
    }

    @GetMapping("/activities/{activityId}/rsvps")
    public ResponseEntity<List<RsvpResponse>> getRsvps(@PathVariable Long activityId) {
        return ResponseEntity.ok(activityService.getRsvps(activityId));
    }

    @PutMapping("/activities/{activityId}/rsvps/me")
    public ResponseEntity<RsvpResponse> updateRsvp(@AuthenticationPrincipal UserDetails userDetails,
                                                     @PathVariable Long activityId,
                                                     @Valid @RequestBody RsvpRequest request) {
        return ResponseEntity.ok(activityService.updateRsvp(userDetails.getUsername(), activityId, request));
    }
}
