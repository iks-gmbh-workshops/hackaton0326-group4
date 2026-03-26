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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final RsvpRepository rsvpRepository;
    private final RsvpService rsvpService;
    private final ActivityRepository activityRepository;
    private final InvitationRepository invitationRepository;

    @Transactional
    public GroupResponse createGroup(String email, CreateGroupRequest request) {
        User user = findUserByEmail(email);

        Group group = Group.builder()
                .name(request.getName())
                .description(request.getDescription())
                .createdBy(user)
                .build();
        groupRepository.save(group);

        GroupMembership membership = GroupMembership.builder()
                .user(user)
                .group(group)
                .status(GroupMembership.MembershipStatus.ACTIVE)
                .role(GroupMembership.GroupRole.ADMIN)
                .build();
        membershipRepository.save(membership);
        rsvpService.createOpenRsvpsForUserInGroup(user, group);

        return GroupResponse.from(group, 1);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getMyGroups(String email) {
        User user = findUserByEmail(email);
        return membershipRepository.findByUserId(user.getId()).stream()
                .map(m -> {
                    int count = membershipRepository.findByGroupId(m.getGroup().getId()).size();
                    return GroupResponse.from(m.getGroup(), count);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroup(Long groupId) {
        Group group = findGroupById(groupId);
        int count = membershipRepository.findByGroupId(groupId).size();
        return GroupResponse.from(group, count);
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> getMembers(Long groupId) {
        findGroupById(groupId);
        return membershipRepository.findByGroupId(groupId).stream()
                .map(MemberResponse::from)
                .toList();
    }

    @Transactional
    public void leaveGroup(String email, Long groupId) {
        User user = findUserByEmail(email);
        GroupMembership membership = membershipRepository.findByUserIdAndGroupId(user.getId(), groupId)
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (membership.getRole() == GroupMembership.GroupRole.ADMIN) {
            long adminCount = membershipRepository.countByGroupIdAndRole(groupId, GroupMembership.GroupRole.ADMIN);
            if (adminCount <= 1) {
                deleteGroupCascade(groupId);
                return;
            }
        }

        rsvpRepository.deleteByUserIdAndGroupId(user.getId(), groupId);
        membershipRepository.deleteByUserIdAndGroupId(user.getId(), groupId);
    }

    @Transactional
    public void deleteGroup(String email, Long groupId) {
        User user = findUserByEmail(email);
        requireAdmin(user.getId(), groupId);
        deleteGroupCascade(groupId);
    }

    @Transactional
    public void kickMember(String email, Long groupId, Long targetUserId) {
        User admin = findUserByEmail(email);
        requireAdmin(admin.getId(), groupId);

        membershipRepository.findByUserIdAndGroupId(targetUserId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("Target user is not a member of this group"));

        if (admin.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot kick yourself. Use leave group instead.");
        }

        rsvpRepository.deleteByUserIdAndGroupId(targetUserId, groupId);
        membershipRepository.deleteByUserIdAndGroupId(targetUserId, groupId);
    }

    @Transactional
    public MemberResponse changeRole(String email, Long groupId, Long targetUserId, ChangeRoleRequest request) {
        User admin = findUserByEmail(email);
        requireAdmin(admin.getId(), groupId);

        GroupMembership targetMembership = membershipRepository.findByUserIdAndGroupId(targetUserId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("Target user is not a member of this group"));

        GroupMembership.GroupRole newRole = GroupMembership.GroupRole.valueOf(request.getRole());

        if (targetMembership.getRole() == GroupMembership.GroupRole.ADMIN
                && newRole == GroupMembership.GroupRole.MEMBER) {
            long adminCount = membershipRepository.countByGroupIdAndRole(groupId, GroupMembership.GroupRole.ADMIN);
            if (adminCount <= 1) {
                throw new IllegalArgumentException("Cannot demote the last admin of the group");
            }
        }

        targetMembership.setRole(newRole);
        membershipRepository.save(targetMembership);
        return MemberResponse.from(targetMembership);
    }

    private void deleteGroupCascade(Long groupId) {
        rsvpRepository.deleteByGroupId(groupId);
        activityRepository.deleteByGroupId(groupId);
        invitationRepository.deleteByGroupId(groupId);
        membershipRepository.deleteByGroupId(groupId);
        groupRepository.deleteById(groupId);
    }

    private void requireAdmin(Long userId, Long groupId) {
        GroupMembership membership = membershipRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));
        if (membership.getRole() != GroupMembership.GroupRole.ADMIN) {
            throw new IllegalArgumentException("Only admins can perform this action");
        }
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Group findGroupById(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
    }
}
