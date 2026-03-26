package com.drumdibum.group;

import com.drumdibum.group.dto.ChangeRoleRequest;
import com.drumdibum.group.dto.CreateGroupRequest;
import com.drumdibum.group.dto.GroupResponse;
import com.drumdibum.group.dto.MemberResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(@AuthenticationPrincipal UserDetails userDetails,
                                                      @Valid @RequestBody CreateGroupRequest request) {
        return ResponseEntity.ok(groupService.createGroup(userDetails.getUsername(), request));
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getMyGroups(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(groupService.getMyGroups(userDetails.getUsername()));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponse> getGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroup(groupId));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<MemberResponse>> getMembers(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getMembers(groupId));
    }

    @DeleteMapping("/{groupId}/members/me")
    public ResponseEntity<Void> leaveGroup(@AuthenticationPrincipal UserDetails userDetails,
                                            @PathVariable Long groupId) {
        groupService.leaveGroup(userDetails.getUsername(), groupId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(@AuthenticationPrincipal UserDetails userDetails,
                                             @PathVariable Long groupId) {
        groupService.deleteGroup(userDetails.getUsername(), groupId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> kickMember(@AuthenticationPrincipal UserDetails userDetails,
                                            @PathVariable Long groupId,
                                            @PathVariable Long userId) {
        groupService.kickMember(userDetails.getUsername(), groupId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{groupId}/members/{userId}/role")
    public ResponseEntity<MemberResponse> changeRole(@AuthenticationPrincipal UserDetails userDetails,
                                                      @PathVariable Long groupId,
                                                      @PathVariable Long userId,
                                                      @Valid @RequestBody ChangeRoleRequest request) {
        return ResponseEntity.ok(groupService.changeRole(userDetails.getUsername(), groupId, userId, request));
    }
}
