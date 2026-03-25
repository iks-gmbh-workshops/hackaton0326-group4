package com.drumdibum.activity;

import com.drumdibum.group.Group;
import com.drumdibum.group.GroupMembership;
import com.drumdibum.group.GroupMembershipRepository;
import com.drumdibum.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RsvpService {

    private final RsvpRepository rsvpRepository;
    private final ActivityRepository activityRepository;
    private final GroupMembershipRepository membershipRepository;

    public void createOpenRsvpsForActivity(Activity activity) {
        List<Rsvp> rsvps = membershipRepository.findByGroupId(activity.getGroup().getId()).stream()
                .filter(membership -> membership.getStatus() == GroupMembership.MembershipStatus.ACTIVE)
                .map(GroupMembership::getUser)
                .map(user -> Rsvp.builder()
                        .user(user)
                        .activity(activity)
                        .status(Rsvp.RsvpStatus.OPEN)
                        .build())
                .toList();

        if (!rsvps.isEmpty()) {
            rsvpRepository.saveAll(rsvps);
        }
    }

    public void createOpenRsvpsForUserInGroup(User user, Group group) {
        List<Rsvp> rsvps = activityRepository.findByGroupId(group.getId()).stream()
                .filter(activity -> rsvpRepository.findByUserIdAndActivityId(user.getId(), activity.getId()).isEmpty())
                .map(activity -> Rsvp.builder()
                        .user(user)
                        .activity(activity)
                        .status(Rsvp.RsvpStatus.OPEN)
                        .build())
                .toList();

        if (!rsvps.isEmpty()) {
            rsvpRepository.saveAll(rsvps);
        }
    }
}
