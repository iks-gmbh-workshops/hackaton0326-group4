package com.drumdibum.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface GroupRepository extends JpaRepository<Group, Long> {
    @Modifying
    @Query("DELETE FROM Group g WHERE g.createdBy.id = :userId")
    void deleteByCreatedById(Long userId);
}
