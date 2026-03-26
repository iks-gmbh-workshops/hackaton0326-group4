package com.drumdibum.group;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMembershipRepository extends JpaRepository<GroupMembership, Long> {
    List<GroupMembership> findByUserId(Long userId);
    List<GroupMembership> findByGroupId(Long groupId);
    Optional<GroupMembership> findByUserIdAndGroupId(Long userId, Long groupId);
    boolean existsByUserIdAndGroupId(Long userId, Long groupId);
    long countByGroupIdAndRole(Long groupId, GroupMembership.GroupRole role);
    void deleteByUserId(Long userId);
    void deleteByUserIdAndGroupId(Long userId, Long groupId);
    void deleteByGroupId(Long groupId);
}
