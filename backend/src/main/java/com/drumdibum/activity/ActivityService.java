package com.drumdibum.activity;

import com.drumdibum.activity.dto.*;
import com.drumdibum.exception.ResourceNotFoundException;
import com.drumdibum.group.Group;
import com.drumdibum.group.GroupMembershipRepository;
import com.drumdibum.group.GroupRepository;
import com.drumdibum.user.User;
import com.drumdibum.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final RsvpRepository rsvpRepository;
    private final GroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final RsvpService rsvpService;

    @Transactional
    public ActivityResponse createActivity(String email, CreateActivityRequest request) {
        User user = findUserByEmail(email);
        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        if (!membershipRepository.existsByUserIdAndGroupId(user.getId(), group.getId())) {
            throw new IllegalArgumentException("You are not a member of this group");
        }

        Activity activity = Activity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .group(group)
                .createdBy(user)
                .scheduledAt(request.getScheduledAt())
                .build();
        activityRepository.save(activity);
        rsvpService.createOpenRsvpsForActivity(activity);

        return toActivityResponse(activity);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getUpcomingActivities(Long groupId) {
        groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        return activityRepository
                .findByGroupIdAndScheduledAtAfterOrderByScheduledAtAsc(groupId, Instant.now())
                .stream()
                .map(this::toActivityResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivity(Long activityId) {
        Activity activity = findActivityById(activityId);
        return toActivityResponse(activity);
    }

    @Transactional(readOnly = true)
    public List<RsvpResponse> getRsvps(Long activityId) {
        findActivityById(activityId);
        return rsvpRepository.findByActivityId(activityId).stream()
                .map(RsvpResponse::from)
                .toList();
    }

    @Transactional
    public RsvpResponse updateRsvp(String email, Long activityId, RsvpRequest request) {
        User user = findUserByEmail(email);
        Activity activity = findActivityById(activityId);

        if (!membershipRepository.existsByUserIdAndGroupId(user.getId(), activity.getGroup().getId())) {
            throw new IllegalArgumentException("You are not a member of this group");
        }

        Rsvp rsvp = rsvpRepository.findByUserIdAndActivityId(user.getId(), activityId)
                .orElseGet(() -> Rsvp.builder()
                        .user(user)
                        .activity(activity)
                        .build());

        rsvp.setStatus(request.getStatus());
        rsvpRepository.save(rsvp);

        return RsvpResponse.from(rsvp);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Activity findActivityById(Long activityId) {
        return activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));
    }

    private ActivityResponse toActivityResponse(Activity activity) {
        return ActivityResponse.from(activity, rsvpRepository.findByActivityId(activity.getId()));
    }
}
