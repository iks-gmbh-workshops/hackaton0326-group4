package com.drumdibum.activity;

import com.drumdibum.group.Group;
import com.drumdibum.group.GroupMembership;
import com.drumdibum.group.GroupMembershipRepository;
import com.drumdibum.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RsvpServiceTest {

    @Mock
    private RsvpRepository rsvpRepository;
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private GroupMembershipRepository membershipRepository;

    @InjectMocks
    private RsvpService rsvpService;

    private User user(Long id, String email) {
        return User.builder()
                .id(id)
                .email(email)
                .firstName("Test")
                .lastName("User")
                .build();
    }

    private Group group(User creator) {
        return Group.builder()
                .id(10L)
                .name("Test Group")
                .createdBy(creator)
                .createdAt(Instant.now())
                .build();
    }

    private Activity activity(Long id, Group group, User creator) {
        return Activity.builder()
                .id(id)
                .title("Activity " + id)
                .group(group)
                .createdBy(creator)
                .scheduledAt(Instant.now().plusSeconds(3600))
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void createOpenRsvpsForActivity_activeMembersGetOpenRsvps() {
        User creator = user(1L, "creator@example.com");
        User invited = user(2L, "invited@example.com");
        User inactive = user(3L, "inactive@example.com");
        Group group = group(creator);
        Activity activity = activity(100L, group, creator);

        GroupMembership activeMembership1 = GroupMembership.builder()
                .user(creator)
                .group(group)
                .status(GroupMembership.MembershipStatus.ACTIVE)
                .build();
        GroupMembership activeMembership2 = GroupMembership.builder()
                .user(invited)
                .group(group)
                .status(GroupMembership.MembershipStatus.ACTIVE)
                .build();
        GroupMembership inactiveMembership = GroupMembership.builder()
                .user(inactive)
                .group(group)
                .status(GroupMembership.MembershipStatus.INACTIVE)
                .build();

        when(membershipRepository.findByGroupId(10L))
                .thenReturn(List.of(activeMembership1, activeMembership2, inactiveMembership));

        rsvpService.createOpenRsvpsForActivity(activity);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Rsvp>> captor = ArgumentCaptor.forClass(List.class);
        verify(rsvpRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
        assertThat(captor.getValue())
                .extracting(rsvp -> rsvp.getUser().getEmail())
                .containsExactlyInAnyOrder("creator@example.com", "invited@example.com");
        assertThat(captor.getValue())
                .extracting(Rsvp::getStatus)
                .containsOnly(Rsvp.RsvpStatus.OPEN);
    }

    @Test
    void createOpenRsvpsForUserInGroup_existingActivitiesCreateMissingOpenRsvps() {
        User creator = user(1L, "creator@example.com");
        User invited = user(2L, "invited@example.com");
        Group group = group(creator);
        Activity firstActivity = activity(100L, group, creator);
        Activity secondActivity = activity(101L, group, creator);
        Rsvp existingRsvp = Rsvp.builder()
                .id(99L)
                .user(invited)
                .activity(secondActivity)
                .status(Rsvp.RsvpStatus.OPEN)
                .build();

        when(activityRepository.findByGroupId(10L)).thenReturn(List.of(firstActivity, secondActivity));
        when(rsvpRepository.findByUserIdAndActivityId(2L, 100L)).thenReturn(Optional.empty());
        when(rsvpRepository.findByUserIdAndActivityId(2L, 101L)).thenReturn(Optional.of(existingRsvp));

        rsvpService.createOpenRsvpsForUserInGroup(invited, group);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Rsvp>> captor = ArgumentCaptor.forClass(List.class);
        verify(rsvpRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().get(0).getActivity()).isEqualTo(firstActivity);
        assertThat(captor.getValue().get(0).getStatus()).isEqualTo(Rsvp.RsvpStatus.OPEN);
    }

    @Test
    void createOpenRsvpsForUserInGroup_noActivities_skipsSave() {
        User creator = user(1L, "creator@example.com");
        Group group = group(creator);

        when(activityRepository.findByGroupId(10L)).thenReturn(List.of());

        rsvpService.createOpenRsvpsForUserInGroup(creator, group);

        verify(rsvpRepository, never()).saveAll(anyList());
    }
}
