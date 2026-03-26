package com.drumdibum.group;

import com.drumdibum.activity.RsvpRepository;
import com.drumdibum.activity.RsvpService;
import com.drumdibum.exception.ResourceNotFoundException;
import com.drumdibum.group.dto.CreateGroupRequest;
import com.drumdibum.group.dto.GroupResponse;
import com.drumdibum.group.dto.MemberResponse;
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
        findGroupById(groupId);

        rsvpRepository.deleteByUserIdAndGroupId(user.getId(), groupId);
        membershipRepository.deleteByUserIdAndGroupId(user.getId(), groupId);
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
