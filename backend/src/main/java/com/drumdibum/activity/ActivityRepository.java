package com.drumdibum.activity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByGroupId(Long groupId);
    List<Activity> findByGroupIdAndScheduledAtAfterOrderByScheduledAtAsc(Long groupId, Instant now);
}
