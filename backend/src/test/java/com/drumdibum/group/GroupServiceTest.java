package com.drumdibum.group;

import com.drumdibum.activity.ActivityRepository;
import com.drumdibum.activity.RsvpRepository;
import com.drumdibum.activity.RsvpService;
import com.drumdibum.exception.ResourceNotFoundException;
import com.drumdibum.group.dto.ChangeRoleRequest;
import com.drumdibum.group.dto.CreateGroupRequest;
import com.drumdibum.group.dto.GroupResponse;
import com.drumdibum.group.dto.MemberResponse;
import com.drumdibum.invitation.InvitationRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private InvitationRepository invitationRepository;

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

    private User anotherUser(Long id, String email, String firstName, String lastName) {
        return User.builder()
                .id(id)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
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

    private GroupMembership membership(User user, Group group, GroupMembership.GroupRole role) {
        return GroupMembership.builder()
                .id(1L)
                .user(user)
                .group(group)
                .status(GroupMembership.MembershipStatus.ACTIVE)
                .role(role)
                .joinedAt(Instant.now())
                .build();
    }

    private ChangeRoleRequest changeRoleRequest(GroupMembership.GroupRole role) {
        ChangeRoleRequest request = new ChangeRoleRequest();
        request.setRole(role.name());
        return request;
    }

    @Test
    void createGroup_success_assignsCreatorAsAdmin() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(groupRepository.save(any(Group.class))).thenAnswer(invocation -> {
            Group group = invocation.getArgument(0);
            group.setId(10L);
            group.setCreatedAt(Instant.now());
            return group;
        });
        when(membershipRepository.save(any(GroupMembership.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateGroupRequest request = new CreateGroupRequest();
        request.setName("My Group");
        request.setDescription("Desc");

        GroupResponse response = groupService.createGroup("test@example.com", request);

        assertThat(response.getName()).isEqualTo("My Group");
        assertThat(response.getDescription()).isEqualTo("Desc");
        assertThat(response.getCreatedByEmail()).isEqualTo("test@example.com");
        assertThat(response.getMemberCount()).isEqualTo(1);

        ArgumentCaptor<GroupMembership> membershipCaptor = ArgumentCaptor.forClass(GroupMembership.class);
        verify(membershipRepository).save(membershipCaptor.capture());
        GroupMembership savedMembership = membershipCaptor.getValue();
        assertThat(savedMembership.getUser()).isEqualTo(user);
        assertThat(savedMembership.getStatus()).isEqualTo(GroupMembership.MembershipStatus.ACTIVE);
        assertThat(savedMembership.getRole()).isEqualTo(GroupMembership.GroupRole.ADMIN);
        verify(rsvpService).createOpenRsvpsForUserInGroup(eq(user), any(Group.class));
    }

    @Test
    void createGroup_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        CreateGroupRequest request = new CreateGroupRequest();
        request.setName("Group");

        assertThatThrownBy(() -> groupService.createGroup("missing@example.com", request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    void getMyGroups_returnsGroupsWithMemberCounts() {
        User user = testUser();
        Group group1 = testGroup(user);
        Group group2 = Group.builder()
                .id(20L)
                .name("Group 2")
                .createdBy(user)
                .createdAt(Instant.now())
                .build();

        GroupMembership membership1 = membership(user, group1, GroupMembership.GroupRole.ADMIN);
        GroupMembership membership2 = membership(user, group2, GroupMembership.GroupRole.MEMBER);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserId(1L)).thenReturn(List.of(membership1, membership2));
        when(membershipRepository.findByGroupId(10L)).thenReturn(List.of(membership1, mock(GroupMembership.class)));
        when(membershipRepository.findByGroupId(20L)).thenReturn(List.of(membership2));

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
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    void getGroup_success_returnsMemberCount() {
        User user = testUser();
        Group group = testGroup(user);
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.findByGroupId(10L)).thenReturn(List.of(
                mock(GroupMembership.class),
                mock(GroupMembership.class),
                mock(GroupMembership.class)));

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

    @Test
    void getMembers_success_includesRole() {
        User user = testUser();
        Group group = testGroup(user);
        GroupMembership adminMembership = membership(user, group, GroupMembership.GroupRole.ADMIN);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.findByGroupId(10L)).thenReturn(List.of(adminMembership));

        List<MemberResponse> members = groupService.getMembers(10L);

        assertThat(members).hasSize(1);
        assertThat(members.get(0).getEmail()).isEqualTo("test@example.com");
        assertThat(members.get(0).getFirstName()).isEqualTo("John");
        assertThat(members.get(0).getStatus()).isEqualTo("ACTIVE");
        assertThat(members.get(0).getRole()).isEqualTo("ADMIN");
    }

    @Test
    void getMembers_groupNotFound_throws() {
        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.getMembers(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Group not found");
    }

    @Test
    void leaveGroup_asMember_deletesRsvpsThenMembership() {
        User user = testUser();
        Group group = testGroup(user);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(user, group, GroupMembership.GroupRole.MEMBER)));

        groupService.leaveGroup("test@example.com", 10L);

        InOrder inOrder = inOrder(rsvpRepository, membershipRepository);
        inOrder.verify(rsvpRepository).deleteByUserIdAndGroupId(1L, 10L);
        inOrder.verify(membershipRepository).deleteByUserIdAndGroupId(1L, 10L);
        verify(membershipRepository, never()).countByGroupIdAndRole(any(), any());
        verify(groupRepository, never()).deleteById(any());
    }

    @Test
    void leaveGroup_asAdminWithOtherAdmins_deletesOnlyOwnMembership() {
        User user = testUser();
        Group group = testGroup(user);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(user, group, GroupMembership.GroupRole.ADMIN)));
        when(membershipRepository.countByGroupIdAndRole(10L, GroupMembership.GroupRole.ADMIN)).thenReturn(2L);

        groupService.leaveGroup("test@example.com", 10L);

        InOrder inOrder = inOrder(rsvpRepository, membershipRepository);
        inOrder.verify(rsvpRepository).deleteByUserIdAndGroupId(1L, 10L);
        inOrder.verify(membershipRepository).deleteByUserIdAndGroupId(1L, 10L);
        verify(groupRepository, never()).deleteById(any());
        verify(activityRepository, never()).deleteByGroupId(any());
        verify(invitationRepository, never()).deleteByGroupId(any());
        verify(membershipRepository, never()).deleteByGroupId(any());
    }

    @Test
    void leaveGroup_asLastAdmin_deletesEntireGroupCascade() {
        User user = testUser();
        Group group = testGroup(user);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(user, group, GroupMembership.GroupRole.ADMIN)));
        when(membershipRepository.countByGroupIdAndRole(10L, GroupMembership.GroupRole.ADMIN)).thenReturn(1L);

        groupService.leaveGroup("test@example.com", 10L);

        InOrder inOrder = inOrder(rsvpRepository, activityRepository, invitationRepository, membershipRepository, groupRepository);
        inOrder.verify(rsvpRepository).deleteByGroupId(10L);
        inOrder.verify(activityRepository).deleteByGroupId(10L);
        inOrder.verify(invitationRepository).deleteByGroupId(10L);
        inOrder.verify(membershipRepository).deleteByGroupId(10L);
        inOrder.verify(groupRepository).deleteById(10L);

        verify(rsvpRepository, never()).deleteByUserIdAndGroupId(any(), any());
        verify(membershipRepository, never()).deleteByUserIdAndGroupId(any(), any());
    }

    @Test
    void leaveGroup_membershipNotFound_throws() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.leaveGroup("test@example.com", 10L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("You are not a member of this group");

        verify(rsvpRepository, never()).deleteByUserIdAndGroupId(any(), any());
    }

    @Test
    void leaveGroup_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.leaveGroup("missing@example.com", 10L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    void deleteGroup_asAdmin_deletesEntireGroupCascade() {
        User user = testUser();
        Group group = testGroup(user);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(user, group, GroupMembership.GroupRole.ADMIN)));

        groupService.deleteGroup("test@example.com", 10L);

        InOrder inOrder = inOrder(rsvpRepository, activityRepository, invitationRepository, membershipRepository, groupRepository);
        inOrder.verify(rsvpRepository).deleteByGroupId(10L);
        inOrder.verify(activityRepository).deleteByGroupId(10L);
        inOrder.verify(invitationRepository).deleteByGroupId(10L);
        inOrder.verify(membershipRepository).deleteByGroupId(10L);
        inOrder.verify(groupRepository).deleteById(10L);
    }

    @Test
    void deleteGroup_asMember_throws() {
        User user = testUser();
        Group group = testGroup(user);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(user, group, GroupMembership.GroupRole.MEMBER)));

        assertThatThrownBy(() -> groupService.deleteGroup("test@example.com", 10L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only admins can perform this action");

        verify(groupRepository, never()).deleteById(any());
    }

    @Test
    void deleteGroup_membershipNotFound_throws() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.deleteGroup("test@example.com", 10L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("You are not a member of this group");

        verify(groupRepository, never()).deleteById(any());
    }

    @Test
    void kickMember_asAdmin_deletesTargetRsvpsThenMembership() {
        User admin = testUser();
        User targetUser = anotherUser(2L, "member@example.com", "Jamie", "Stone");
        Group group = testGroup(admin);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(admin));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(admin, group, GroupMembership.GroupRole.ADMIN)));
        when(membershipRepository.findByUserIdAndGroupId(2L, 10L))
                .thenReturn(Optional.of(membership(targetUser, group, GroupMembership.GroupRole.MEMBER)));

        groupService.kickMember("test@example.com", 10L, 2L);

        InOrder inOrder = inOrder(rsvpRepository, membershipRepository);
        inOrder.verify(rsvpRepository).deleteByUserIdAndGroupId(2L, 10L);
        inOrder.verify(membershipRepository).deleteByUserIdAndGroupId(2L, 10L);
    }

    @Test
    void kickMember_asMember_throws() {
        User user = testUser();
        Group group = testGroup(user);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(user, group, GroupMembership.GroupRole.MEMBER)));

        assertThatThrownBy(() -> groupService.kickMember("test@example.com", 10L, 2L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only admins can perform this action");

        verify(rsvpRepository, never()).deleteByUserIdAndGroupId(any(), any());
    }

    @Test
    void kickMember_membershipNotFound_throws() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.kickMember("test@example.com", 10L, 2L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("You are not a member of this group");

        verify(rsvpRepository, never()).deleteByUserIdAndGroupId(any(), any());
    }

    @Test
    void kickMember_targetMembershipNotFound_throws() {
        User admin = testUser();
        Group group = testGroup(admin);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(admin));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(admin, group, GroupMembership.GroupRole.ADMIN)));
        when(membershipRepository.findByUserIdAndGroupId(2L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.kickMember("test@example.com", 10L, 2L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Target user is not a member of this group");

        verify(rsvpRepository, never()).deleteByUserIdAndGroupId(any(), any());
    }

    @Test
    void kickMember_selfKick_throws() {
        User admin = testUser();
        Group group = testGroup(admin);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(admin));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(admin, group, GroupMembership.GroupRole.ADMIN)))
                .thenReturn(Optional.of(membership(admin, group, GroupMembership.GroupRole.ADMIN)));

        assertThatThrownBy(() -> groupService.kickMember("test@example.com", 10L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("You cannot kick yourself. Use leave group instead.");

        verify(rsvpRepository, never()).deleteByUserIdAndGroupId(any(), any());
    }

    @Test
    void changeRole_promoteMemberToAdmin_savesUpdatedMembership() {
        User admin = testUser();
        User targetUser = anotherUser(2L, "member@example.com", "Jamie", "Stone");
        Group group = testGroup(admin);
        GroupMembership targetMembership = membership(targetUser, group, GroupMembership.GroupRole.MEMBER);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(admin));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(admin, group, GroupMembership.GroupRole.ADMIN)));
        when(membershipRepository.findByUserIdAndGroupId(2L, 10L)).thenReturn(Optional.of(targetMembership));
        when(membershipRepository.save(targetMembership)).thenReturn(targetMembership);

        MemberResponse response = groupService.changeRole(
                "test@example.com",
                10L,
                2L,
                changeRoleRequest(GroupMembership.GroupRole.ADMIN));

        assertThat(response.getUserId()).isEqualTo(2L);
        assertThat(response.getEmail()).isEqualTo("member@example.com");
        assertThat(response.getRole()).isEqualTo("ADMIN");
        verify(membershipRepository).save(targetMembership);
        verify(membershipRepository, never()).countByGroupIdAndRole(any(), any());
    }

    @Test
    void changeRole_demoteAdminWithAnotherAdmin_savesUpdatedMembership() {
        User admin = testUser();
        User targetUser = anotherUser(2L, "admin2@example.com", "Jamie", "Stone");
        Group group = testGroup(admin);
        GroupMembership targetMembership = membership(targetUser, group, GroupMembership.GroupRole.ADMIN);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(admin));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(admin, group, GroupMembership.GroupRole.ADMIN)));
        when(membershipRepository.findByUserIdAndGroupId(2L, 10L)).thenReturn(Optional.of(targetMembership));
        when(membershipRepository.countByGroupIdAndRole(10L, GroupMembership.GroupRole.ADMIN)).thenReturn(2L);
        when(membershipRepository.save(targetMembership)).thenReturn(targetMembership);

        MemberResponse response = groupService.changeRole(
                "test@example.com",
                10L,
                2L,
                changeRoleRequest(GroupMembership.GroupRole.MEMBER));

        assertThat(response.getRole()).isEqualTo("MEMBER");
        verify(membershipRepository).countByGroupIdAndRole(10L, GroupMembership.GroupRole.ADMIN);
        verify(membershipRepository).save(targetMembership);
    }

    @Test
    void changeRole_demoteLastAdmin_throws() {
        User admin = testUser();
        User targetUser = anotherUser(2L, "admin2@example.com", "Jamie", "Stone");
        Group group = testGroup(admin);
        GroupMembership targetMembership = membership(targetUser, group, GroupMembership.GroupRole.ADMIN);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(admin));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(admin, group, GroupMembership.GroupRole.ADMIN)));
        when(membershipRepository.findByUserIdAndGroupId(2L, 10L)).thenReturn(Optional.of(targetMembership));
        when(membershipRepository.countByGroupIdAndRole(10L, GroupMembership.GroupRole.ADMIN)).thenReturn(1L);

        assertThatThrownBy(() -> groupService.changeRole(
                "test@example.com",
                10L,
                2L,
                changeRoleRequest(GroupMembership.GroupRole.MEMBER)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cannot demote the last admin of the group");

        verify(membershipRepository, never()).save(any(GroupMembership.class));
    }

    @Test
    void changeRole_asMember_throws() {
        User user = testUser();
        Group group = testGroup(user);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(user, group, GroupMembership.GroupRole.MEMBER)));

        assertThatThrownBy(() -> groupService.changeRole(
                "test@example.com",
                10L,
                2L,
                changeRoleRequest(GroupMembership.GroupRole.ADMIN)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only admins can perform this action");

        verify(membershipRepository, never()).save(any(GroupMembership.class));
    }

    @Test
    void changeRole_membershipNotFound_throws() {
        User user = testUser();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.changeRole(
                "test@example.com",
                10L,
                2L,
                changeRoleRequest(GroupMembership.GroupRole.ADMIN)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("You are not a member of this group");

        verify(membershipRepository, never()).save(any(GroupMembership.class));
    }

    @Test
    void changeRole_targetMembershipNotFound_throws() {
        User admin = testUser();
        Group group = testGroup(admin);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(admin));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L))
                .thenReturn(Optional.of(membership(admin, group, GroupMembership.GroupRole.ADMIN)));
        when(membershipRepository.findByUserIdAndGroupId(2L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.changeRole(
                "test@example.com",
                10L,
                2L,
                changeRoleRequest(GroupMembership.GroupRole.ADMIN)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Target user is not a member of this group");

        verify(membershipRepository, never()).save(any(GroupMembership.class));
    }
}
