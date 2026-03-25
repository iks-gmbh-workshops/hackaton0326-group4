package com.drumdibum.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RsvpRepository extends JpaRepository<Rsvp, Long> {
    List<Rsvp> findByActivityId(Long activityId);
    Optional<Rsvp> findByUserIdAndActivityId(Long userId, Long activityId);
    void deleteByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM Rsvp r WHERE r.user.id = :userId AND r.activity.group.id = :groupId")
    void deleteByUserIdAndGroupId(Long userId, Long groupId);
}
