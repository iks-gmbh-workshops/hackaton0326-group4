package com.drumdibum.activity;

import com.drumdibum.activity.dto.ActivityResponse;
import com.drumdibum.activity.dto.CreateActivityRequest;
import com.drumdibum.activity.dto.RsvpRequest;
import com.drumdibum.activity.dto.RsvpResponse;
import com.drumdibum.exception.ResourceNotFoundException;
import com.drumdibum.group.Group;
import com.drumdibum.group.GroupMembershipRepository;
import com.drumdibum.group.GroupRepository;
import com.drumdibum.user.User;
import com.drumdibum.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private RsvpRepository rsvpRepository;
    @Mock
    private GroupRepository groupRepository;
    @Mock
    private GroupMembershipRepository membershipRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RsvpService rsvpService;

    @InjectMocks
    private ActivityService activityService;

    private User testUser() {
        return User.builder()
                .id(1L)
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .build();
    }

    private Group testGroup(User user) {
        return Group.builder()
                .id(10L)
                .name("Test Group")
                .createdBy(user)
                .createdAt(Instant.now())
                .build();
    }

    private Activity testActivity(User user, Group group) {
        return Activity.builder()
                .id(100L)
                .title("Test Activity")
                .description("Fun stuff")
                .group(group)
                .createdBy(user)
                .scheduledAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .createdAt(Instant.now())
                .build();
    }

    // --- createActivity ---

    @Test
    void createActivity_success() {
        User user = testUser();
        Group group = testGroup(user);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.existsByUserIdAndGroupId(1L, 10L)).thenReturn(true);
        when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
            Activity a = inv.getArgument(0);
            a.setId(100L);
            a.setCreatedAt(Instant.now());
            return a;
        });

        CreateActivityRequest req = new CreateActivityRequest();
        req.setTitle("Hiking");
        req.setDescription("Mountain hike");
        req.setGroupId(10L);
        req.setScheduledAt(Instant.now().plus(1, ChronoUnit.DAYS));

        ActivityResponse response = activityService.createActivity("test@example.com", req);

        assertThat(response.getTitle()).isEqualTo("Hiking");
        assertThat(response.getDescription()).isEqualTo("Mountain hike");
        assertThat(response.getGroupId()).isEqualTo(10L);
        assertThat(response.getGroupName()).isEqualTo("Test Group");
        assertThat(response.getCreatedByEmail()).isEqualTo("test@example.com");
        verify(rsvpService).createOpenRsvpsForActivity(any(Activity.class));
    }

    @Test
    void createActivity_notMember_throws() {
        User user = testUser();
        Group group = testGroup(user);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.existsByUserIdAndGroupId(1L, 10L)).thenReturn(false);

        CreateActivityRequest req = new CreateActivityRequest();
        req.setTitle("Hiking");
        req.setGroupId(10L);
        req.setScheduledAt(Instant.now().plus(1, ChronoUnit.DAYS));

        assertThatThrownBy(() -> activityService.createActivity("test@example.com", req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("You are not a member of this group");

        verify(activityRepository, never()).save(any());
    }

    @Test
    void createActivity_groupNotFound_throws() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        CreateActivityRequest req = new CreateActivityRequest();
        req.setTitle("Hiking");
        req.setGroupId(999L);
        req.setScheduledAt(Instant.now().plus(1, ChronoUnit.DAYS));

        assertThatThrownBy(() -> activityService.createActivity("test@example.com", req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Group not found");
    }

    @Test
    void createActivity_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        CreateActivityRequest req = new CreateActivityRequest();
        req.setTitle("Hiking");
        req.setGroupId(10L);
        req.setScheduledAt(Instant.now().plus(1, ChronoUnit.DAYS));

        assertThatThrownBy(() -> activityService.createActivity("missing@example.com", req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    // --- getUpcomingActivities ---

    @Test
    void getUpcomingActivities_success() {
        User user = testUser();
        Group group = testGroup(user);
        Activity activity = testActivity(user, group);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(activityRepository.findByGroupIdAndScheduledAtAfterOrderByScheduledAtAsc(eq(10L), any(Instant.class)))
                .thenReturn(List.of(activity));

        List<ActivityResponse> activities = activityService.getUpcomingActivities(10L);

        assertThat(activities).hasSize(1);
        assertThat(activities.get(0).getTitle()).isEqualTo("Test Activity");
    }

    @Test
    void getUpcomingActivities_groupNotFound_throws() {
        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> activityService.getUpcomingActivities(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Group not found");
    }

    @Test
    void getUpcomingActivities_noActivities_returnsEmpty() {
        Group group = testGroup(testUser());
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(activityRepository.findByGroupIdAndScheduledAtAfterOrderByScheduledAtAsc(eq(10L), any()))
                .thenReturn(List.of());

        List<ActivityResponse> activities = activityService.getUpcomingActivities(10L);

        assertThat(activities).isEmpty();
    }

    // --- getActivity ---

    @Test
    void getActivity_success() {
        User user = testUser();
        Group group = testGroup(user);
        Activity activity = testActivity(user, group);
        when(activityRepository.findById(100L)).thenReturn(Optional.of(activity));

        ActivityResponse response = activityService.getActivity(100L);

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getTitle()).isEqualTo("Test Activity");
    }

    @Test
    void getActivity_notFound_throws() {
        when(activityRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> activityService.getActivity(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Activity not found");
    }

    // --- getRsvps ---

    @Test
    void getRsvps_success() {
        User user = testUser();
        Group group = testGroup(user);
        Activity activity = testActivity(user, group);
        Rsvp rsvp = Rsvp.builder()
                .id(1L).user(user).activity(activity).status(Rsvp.RsvpStatus.ACCEPTED).build();

        when(activityRepository.findById(100L)).thenReturn(Optional.of(activity));
        when(rsvpRepository.findByActivityId(100L)).thenReturn(List.of(rsvp));

        List<RsvpResponse> rsvps = activityService.getRsvps(100L);

        assertThat(rsvps).hasSize(1);
        assertThat(rsvps.get(0).getEmail()).isEqualTo("test@example.com");
        assertThat(rsvps.get(0).getStatus()).isEqualTo("ACCEPTED");
    }

    @Test
    void getRsvps_activityNotFound_throws() {
        when(activityRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> activityService.getRsvps(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Activity not found");
    }

    // --- updateRsvp ---

    @Test
    void updateRsvp_createsNewRsvp() {
        User user = testUser();
        Group group = testGroup(user);
        Activity activity = testActivity(user, group);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(activityRepository.findById(100L)).thenReturn(Optional.of(activity));
        when(membershipRepository.existsByUserIdAndGroupId(1L, 10L)).thenReturn(true);
        when(rsvpRepository.findByUserIdAndActivityId(1L, 100L)).thenReturn(Optional.empty());
        when(rsvpRepository.save(any(Rsvp.class))).thenAnswer(inv -> inv.getArgument(0));

        RsvpRequest req = new RsvpRequest();
        req.setStatus(Rsvp.RsvpStatus.ACCEPTED);

        RsvpResponse response = activityService.updateRsvp("test@example.com", 100L, req);

        assertThat(response.getStatus()).isEqualTo("ACCEPTED");
        assertThat(response.getEmail()).isEqualTo("test@example.com");

        ArgumentCaptor<Rsvp> captor = ArgumentCaptor.forClass(Rsvp.class);
        verify(rsvpRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(user);
        assertThat(captor.getValue().getActivity()).isEqualTo(activity);
    }

    @Test
    void updateRsvp_updatesExistingRsvp() {
        User user = testUser();
        Group group = testGroup(user);
        Activity activity = testActivity(user, group);
        Rsvp existingRsvp = Rsvp.builder()
                .id(1L).user(user).activity(activity).status(Rsvp.RsvpStatus.OPEN).build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(activityRepository.findById(100L)).thenReturn(Optional.of(activity));
        when(membershipRepository.existsByUserIdAndGroupId(1L, 10L)).thenReturn(true);
        when(rsvpRepository.findByUserIdAndActivityId(1L, 100L)).thenReturn(Optional.of(existingRsvp));
        when(rsvpRepository.save(any(Rsvp.class))).thenAnswer(inv -> inv.getArgument(0));

        RsvpRequest req = new RsvpRequest();
        req.setStatus(Rsvp.RsvpStatus.DECLINED);

        RsvpResponse response = activityService.updateRsvp("test@example.com", 100L, req);

        assertThat(response.getStatus()).isEqualTo("DECLINED");
        assertThat(existingRsvp.getStatus()).isEqualTo(Rsvp.RsvpStatus.DECLINED);
    }

    @Test
    void updateRsvp_notMember_throws() {
        User user = testUser();
        Group group = testGroup(user);
        Activity activity = testActivity(user, group);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(activityRepository.findById(100L)).thenReturn(Optional.of(activity));
        when(membershipRepository.existsByUserIdAndGroupId(1L, 10L)).thenReturn(false);

        RsvpRequest req = new RsvpRequest();
        req.setStatus(Rsvp.RsvpStatus.ACCEPTED);

        assertThatThrownBy(() -> activityService.updateRsvp("test@example.com", 100L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("You are not a member of this group");

        verify(rsvpRepository, never()).save(any());
    }

    @Test
    void updateRsvp_activityNotFound_throws() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(activityRepository.findById(999L)).thenReturn(Optional.empty());

        RsvpRequest req = new RsvpRequest();
        req.setStatus(Rsvp.RsvpStatus.ACCEPTED);

        assertThatThrownBy(() -> activityService.updateRsvp("test@example.com", 999L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Activity not found");
    }

    @Test
    void updateRsvp_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        RsvpRequest req = new RsvpRequest();
        req.setStatus(Rsvp.RsvpStatus.ACCEPTED);

        assertThatThrownBy(() -> activityService.updateRsvp("missing@example.com", 100L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }
}
