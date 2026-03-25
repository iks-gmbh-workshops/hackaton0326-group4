package com.drumdibum.user;

import com.drumdibum.activity.ActivityRepository;
import com.drumdibum.activity.RsvpRepository;
import com.drumdibum.exception.ResourceNotFoundException;
import com.drumdibum.group.GroupRepository;
import com.drumdibum.group.GroupMembershipRepository;
import com.drumdibum.user.dto.UpdateProfileRequest;
import com.drumdibum.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final ActivityRepository activityRepository;
    private final GroupMembershipRepository groupMembershipRepository;
    private final RsvpRepository rsvpRepository;

    public UserResponse getProfile(String email) {
        User user = findByEmail(email);
        return UserResponse.from(user);
    }

    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findByEmail(email);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        userRepository.save(user);
        return UserResponse.from(user);
    }

    @Transactional
    public void deleteAccount(String email) {
        User user = findByEmail(email);
        groupRepository.deleteByCreatedById(user.getId());
        activityRepository.deleteByCreatedById(user.getId());
        rsvpRepository.deleteByUserId(user.getId());
        groupMembershipRepository.deleteByUserId(user.getId());
        userRepository.delete(user);
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
