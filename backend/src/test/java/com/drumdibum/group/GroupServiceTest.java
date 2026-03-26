package com.drumdibum.group;

import com.drumdibum.activity.RsvpRepository;
import com.drumdibum.activity.RsvpService;
import com.drumdibum.exception.ResourceNotFoundException;
import com.drumdibum.group.dto.CreateGroupRequest;
import com.drumdibum.group.dto.GroupResponse;
import com.drumdibum.group.dto.MemberResponse;
import com.drumdibum.user.User;
import com.drumdibum.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock
    private GroupRepository groupRepository;
    @Mock
    private GroupMembershipRepository membershipRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RsvpRepository rsvpRepository;
    @Mock
    private RsvpService rsvpService;

    @InjectMocks
    private GroupService groupService;

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
                .description("A test group")
                .createdBy(user)
                .createdAt(Instant.now())
                .build();
    }

    // --- createGroup ---

    @Test
    void createGroup_success() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(groupRepository.save(any(Group.class))).thenAnswer(inv -> {
            Group g = inv.getArgument(0);
            g.setId(10L);
            g.setCreatedAt(Instant.now());
            return g;
        });
        when(membershipRepository.save(any(GroupMembership.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateGroupRequest req = new CreateGroupRequest();
        req.setName("My Group");
        req.setDescription("Desc");

        GroupResponse response = groupService.createGroup("test@example.com", req);

        assertThat(response.getName()).isEqualTo("My Group");
        assertThat(response.getDescription()).isEqualTo("Desc");
        assertThat(response.getCreatedByEmail()).isEqualTo("test@example.com");
        assertThat(response.getMemberCount()).isEqualTo(1);

        verify(groupRepository).save(any(Group.class));

        ArgumentCaptor<GroupMembership> captor = ArgumentCaptor.forClass(GroupMembership.class);
        verify(membershipRepository).save(captor.capture());
        GroupMembership membership = captor.getValue();
        assertThat(membership.getUser()).isEqualTo(user);
        assertThat(membership.getStatus()).isEqualTo(GroupMembership.MembershipStatus.ACTIVE);
        verify(rsvpService).createOpenRsvpsForUserInGroup(eq(user), any(Group.class));
    }

    @Test
    void createGroup_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        CreateGroupRequest req = new CreateGroupRequest();
        req.setName("Group");

        assertThatThrownBy(() -> groupService.createGroup("missing@example.com", req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    // --- getMyGroups ---

    @Test
    void getMyGroups_returnsGroupsWithMemberCounts() {
        User user = testUser();
        Group group1 = testGroup(user);
        Group group2 = Group.builder().id(20L).name("Group 2").createdBy(user).createdAt(Instant.now()).build();

        GroupMembership m1 = GroupMembership.builder().user(user).group(group1).status(GroupMembership.MembershipStatus.ACTIVE).joinedAt(Instant.now()).build();
        GroupMembership m2 = GroupMembership.builder().user(user).group(group2).status(GroupMembership.MembershipStatus.ACTIVE).joinedAt(Instant.now()).build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserId(1L)).thenReturn(List.of(m1, m2));
        when(membershipRepository.findByGroupId(10L)).thenReturn(List.of(m1, mock(GroupMembership.class)));
        when(membershipRepository.findByGroupId(20L)).thenReturn(List.of(m2));

        List<GroupResponse> groups = groupService.getMyGroups("test@example.com");

        assertThat(groups).hasSize(2);
        assertThat(groups.get(0).getName()).isEqualTo("Test Group");
        assertThat(groups.get(0).getMemberCount()).isEqualTo(2);
        assertThat(groups.get(1).getName()).isEqualTo("Group 2");
        assertThat(groups.get(1).getMemberCount()).isEqualTo(1);
    }

    @Test
    void getMyGroups_noGroups_returnsEmpty() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserId(1L)).thenReturn(List.of());

        List<GroupResponse> groups = groupService.getMyGroups("test@example.com");

        assertThat(groups).isEmpty();
    }

    @Test
    void getMyGroups_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.getMyGroups("missing@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- getGroup ---

    @Test
    void getGroup_success() {
        User user = testUser();
        Group group = testGroup(user);
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.findByGroupId(10L)).thenReturn(List.of(
                mock(GroupMembership.class), mock(GroupMembership.class), mock(GroupMembership.class)));

        GroupResponse response = groupService.getGroup(10L);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("Test Group");
        assertThat(response.getMemberCount()).isEqualTo(3);
    }

    @Test
    void getGroup_notFound_throws() {
        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.getGroup(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Group not found");
    }

    // --- getMembers ---

    @Test
    void getMembers_success() {
        User user = testUser();
        Group group = testGroup(user);
        GroupMembership membership = GroupMembership.builder()
                .user(user).group(group)
                .status(GroupMembership.MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build();

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.findByGroupId(10L)).thenReturn(List.of(membership));

        List<MemberResponse> members = groupService.getMembers(10L);

        assertThat(members).hasSize(1);
        assertThat(members.get(0).getEmail()).isEqualTo("test@example.com");
        assertThat(members.get(0).getFirstName()).isEqualTo("John");
        assertThat(members.get(0).getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    void getMembers_groupNotFound_throws() {
        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.getMembers(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Group not found");
    }

    // --- leaveGroup ---

    @Test
    void leaveGroup_deletesRsvpsThenMembership() {
        User user = testUser();
        Group group = testGroup(user);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));

        groupService.leaveGroup("test@example.com", 10L);

        InOrder inOrder = inOrder(rsvpRepository, membershipRepository);
        inOrder.verify(rsvpRepository).deleteByUserIdAndGroupId(1L, 10L);
        inOrder.verify(membershipRepository).deleteByUserIdAndGroupId(1L, 10L);
    }

    @Test
    void leaveGroup_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.leaveGroup("missing@example.com", 10L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void leaveGroup_groupNotFound_throws() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.leaveGroup("test@example.com", 999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Group not found");
    }
}
