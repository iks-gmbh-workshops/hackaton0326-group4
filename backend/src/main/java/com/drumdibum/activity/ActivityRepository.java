package com.drumdibum.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByGroupId(Long groupId);
    List<Activity> findByGroupIdAndCanceledFalseAndScheduledAtAfterOrderByScheduledAtAsc(Long groupId, Instant now);

    @Modifying
    @Query("DELETE FROM Activity a WHERE a.createdBy.id = :userId")
    void deleteByCreatedById(Long userId);
}
