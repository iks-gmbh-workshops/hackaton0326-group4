package com.drumdibum.invitation;

import com.drumdibum.exception.ResourceNotFoundException;
import com.drumdibum.group.Group;
import com.drumdibum.group.GroupMembership;
import com.drumdibum.group.GroupMembershipRepository;
import com.drumdibum.group.GroupRepository;
import com.drumdibum.invitation.dto.InviteRequest;
import com.drumdibum.invitation.dto.InviteResponse;
import com.drumdibum.user.User;
import com.drumdibum.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final GroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.invitation.expiration-hours}")
    private long invitationExpirationHours;

    @Transactional
    public InviteResponse createInvitation(String email, Long groupId, InviteRequest request) {
        User inviter = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        if (!membershipRepository.existsByUserIdAndGroupId(inviter.getId(), groupId)) {
            throw new IllegalArgumentException("You are not a member of this group");
        }

        InvitationToken invitation = InvitationToken.builder()
                .group(group)
                .invitedEmail(request.getEmail())
                .expiresAt(Instant.now().plus(invitationExpirationHours, ChronoUnit.HOURS))
                .build();
        invitationRepository.save(invitation);

        sendInvitationEmail(invitation, group, inviter);

        return new InviteResponse(
                invitation.getToken(),
                invitation.getInvitedEmail(),
                group.getName(),
                invitation.getExpiresAt());
    }

    @Transactional
    public void acceptInvitation(String token) {
        InvitationToken invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        if (invitation.isUsed()) {
            throw new IllegalArgumentException("Invitation has already been used");
        }
        if (invitation.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Invitation has expired");
        }

        User user = userRepository.findByEmail(invitation.getInvitedEmail())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Please register with the email " + invitation.getInvitedEmail() + " first"));

        if (!membershipRepository.existsByUserIdAndGroupId(user.getId(), invitation.getGroup().getId())) {
            GroupMembership membership = GroupMembership.builder()
                    .user(user)
                    .group(invitation.getGroup())
                    .status(GroupMembership.MembershipStatus.ACTIVE)
                    .build();
            membershipRepository.save(membership);
        }

        invitation.setUsed(true);
        invitationRepository.save(invitation);
    }

    private void sendInvitationEmail(InvitationToken invitation, Group group, User inviter) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(invitation.getInvitedEmail());
        message.setSubject("You've been invited to join " + group.getName() + " on DrumDiBum");
        message.setText(String.format(
                "Hi!\n\n%s %s has invited you to join the group \"%s\" on DrumDiBum.\n\n" +
                "Click the link below to accept the invitation:\n%s/invite/%s\n\n" +
                "This invitation expires in %d hours.",
                inviter.getFirstName(), inviter.getLastName(),
                group.getName(), frontendUrl, invitation.getToken(),
                invitationExpirationHours));
        mailSender.send(message);
    }
}
