package com.drumdibum.activity;

import com.drumdibum.activity.dto.*;
import com.drumdibum.exception.ResourceNotFoundException;
import com.drumdibum.group.Group;
import com.drumdibum.group.GroupMembership;
import com.drumdibum.group.GroupMembershipRepository;
import com.drumdibum.group.GroupRepository;
import com.drumdibum.user.User;
import com.drumdibum.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private static final DateTimeFormatter CANCELLATION_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm 'UTC'").withZone(ZoneOffset.UTC);

    private final ActivityRepository activityRepository;
    private final RsvpRepository rsvpRepository;
    private final GroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

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

        return ActivityResponse.from(activity);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getUpcomingActivities(Long groupId) {
        groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        return activityRepository
                .findByGroupIdAndCanceledFalseAndScheduledAtAfterOrderByScheduledAtAsc(groupId, Instant.now())
                .stream()
                .map(ActivityResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivity(Long activityId) {
        Activity activity = findActivityById(activityId);
        return ActivityResponse.from(activity);
    }

    @Transactional
    public void cancelActivity(String email, Long activityId) {
        User user = findUserByEmail(email);
        Activity activity = findActivityById(activityId);

        if (!membershipRepository.existsByUserIdAndGroupId(user.getId(), activity.getGroup().getId())) {
            throw new IllegalArgumentException("You are not a member of this group");
        }

        if (activity.isCanceled()) {
            throw new IllegalArgumentException("Activity has already been canceled");
        }

        activity.setCanceled(true);
        activityRepository.save(activity);
        sendCancellationEmails(activity, user);
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
        if (activity.isCanceled()) {
            throw new IllegalArgumentException("Canceled activities cannot be updated");
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

    private void sendCancellationEmails(Activity activity, User canceledBy) {
        String scheduledFor = CANCELLATION_TIME_FORMATTER.format(activity.getScheduledAt());
        String canceledByName = (canceledBy.getFirstName() + " " + canceledBy.getLastName()).trim();

        membershipRepository.findByGroupId(activity.getGroup().getId()).stream()
                .filter(membership -> membership.getStatus() == GroupMembership.MembershipStatus.ACTIVE)
                .map(GroupMembership::getUser)
                .forEach(user -> {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setTo(user.getEmail());
                    message.setSubject("Activity canceled in " + activity.getGroup().getName());
                    message.setText(String.format(
                            "Hi %s,\n\n" +
                            "the activity \"%s\" in the group \"%s\" was canceled.\n\n" +
                            "Scheduled time: %s\n" +
                            "Canceled by: %s\n",
                            user.getFirstName(),
                            activity.getTitle(),
                            activity.getGroup().getName(),
                            scheduledFor,
                            canceledByName));
                    mailSender.send(message);
                });
    }
}
