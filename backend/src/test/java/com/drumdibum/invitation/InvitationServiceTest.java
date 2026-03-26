package com.drumdibum.invitation;

import com.drumdibum.activity.RsvpService;
import com.drumdibum.exception.ResourceNotFoundException;
import com.drumdibum.group.Group;
import com.drumdibum.group.GroupMembership;
import com.drumdibum.group.GroupMembershipRepository;
import com.drumdibum.group.GroupRepository;
import com.drumdibum.invitation.dto.InviteRequest;
import com.drumdibum.invitation.dto.InviteResponse;
import com.drumdibum.user.User;
import com.drumdibum.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock
    private InvitationRepository invitationRepository;
    @Mock
    private GroupRepository groupRepository;
    @Mock
    private GroupMembershipRepository membershipRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JavaMailSender mailSender;
    @Mock
    private RsvpService rsvpService;

    @InjectMocks
    private InvitationService invitationService;

    private User testUser() {
        return User.builder()
                .id(1L)
                .email("inviter@example.com")
                .firstName("John")
                .lastName("Doe")
                .build();
    }

    private Group testGroup(User user) {
        return Group.builder()
                .id(10L)
                .name("Test Group")
                .createdBy(user)
                .createdAt(Instant.now())
                .build();
    }

    private GroupMembership adminMembership(User user, Group group) {
        return GroupMembership.builder()
                .id(1L).user(user).group(group)
                .status(GroupMembership.MembershipStatus.ACTIVE)
                .role(GroupMembership.GroupRole.ADMIN)
                .joinedAt(Instant.now())
                .build();
    }

    private GroupMembership memberMembership(User user, Group group) {
        return GroupMembership.builder()
                .id(1L).user(user).group(group)
                .status(GroupMembership.MembershipStatus.ACTIVE)
                .role(GroupMembership.GroupRole.MEMBER)
                .joinedAt(Instant.now())
                .build();
    }

    private void setConfigValues() {
        ReflectionTestUtils.setField(invitationService, "frontendUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(invitationService, "invitationExpirationHours", 48L);
    }

    // --- createInvitation ---

    @Test
    void createInvitation_success() {
        setConfigValues();
        User inviter = testUser();
        Group group = testGroup(inviter);
        when(userRepository.findByEmail("inviter@example.com")).thenReturn(Optional.of(inviter));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L)).thenReturn(Optional.of(adminMembership(inviter, group)));
        when(invitationRepository.save(any(InvitationToken.class))).thenAnswer(inv -> {
            InvitationToken t = inv.getArgument(0);
            t.setId(1L);
            return t;
        });

        InviteRequest req = new InviteRequest();
        req.setEmail("invited@example.com");

        InviteResponse response = invitationService.createInvitation("inviter@example.com", 10L, req);

        assertThat(response.getInvitedEmail()).isEqualTo("invited@example.com");
        assertThat(response.getGroupName()).isEqualTo("Test Group");
        assertThat(response.getToken()).isNotBlank();
        assertThat(response.getExpiresAt()).isAfter(Instant.now());

        verify(invitationRepository).save(any(InvitationToken.class));
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void createInvitation_sendsEmailToInvitedUser() {
        setConfigValues();
        User inviter = testUser();
        Group group = testGroup(inviter);
        when(userRepository.findByEmail("inviter@example.com")).thenReturn(Optional.of(inviter));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L)).thenReturn(Optional.of(adminMembership(inviter, group)));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InviteRequest req = new InviteRequest();
        req.setEmail("friend@example.com");

        invitationService.createInvitation("inviter@example.com", 10L, req);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sentMessage = captor.getValue();
        assertThat(sentMessage.getTo()).containsExactly("friend@example.com");
        assertThat(sentMessage.getSubject()).contains("Test Group");
        assertThat(sentMessage.getText()).contains("John Doe");
        assertThat(sentMessage.getText()).contains("http://localhost:5173/invite/");
    }

    @Test
    void createInvitation_setsExpirationTo48Hours() {
        setConfigValues();
        User inviter = testUser();
        Group group = testGroup(inviter);
        when(userRepository.findByEmail("inviter@example.com")).thenReturn(Optional.of(inviter));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L)).thenReturn(Optional.of(adminMembership(inviter, group)));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InviteRequest req = new InviteRequest();
        req.setEmail("invited@example.com");

        InviteResponse response = invitationService.createInvitation("inviter@example.com", 10L, req);

        Instant expectedExpiry = Instant.now().plus(48, ChronoUnit.HOURS);
        assertThat(response.getExpiresAt()).isBetween(
                expectedExpiry.minus(5, ChronoUnit.SECONDS),
                expectedExpiry.plus(5, ChronoUnit.SECONDS));
    }

    @Test
    void createInvitation_notMember_throws() {
        User inviter = testUser();
        Group group = testGroup(inviter);
        when(userRepository.findByEmail("inviter@example.com")).thenReturn(Optional.of(inviter));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L)).thenReturn(Optional.empty());

        InviteRequest req = new InviteRequest();
        req.setEmail("invited@example.com");

        assertThatThrownBy(() -> invitationService.createInvitation("inviter@example.com", 10L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("You are not a member of this group");

        verify(invitationRepository, never()).save(any());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void createInvitation_asMember_throws() {
        User inviter = testUser();
        Group group = testGroup(inviter);
        when(userRepository.findByEmail("inviter@example.com")).thenReturn(Optional.of(inviter));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(membershipRepository.findByUserIdAndGroupId(1L, 10L)).thenReturn(Optional.of(memberMembership(inviter, group)));

        InviteRequest req = new InviteRequest();
        req.setEmail("invited@example.com");

        assertThatThrownBy(() -> invitationService.createInvitation("inviter@example.com", 10L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only admins can invite members");

        verify(invitationRepository, never()).save(any());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void createInvitation_userNotFound_throws() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        InviteRequest req = new InviteRequest();
        req.setEmail("invited@example.com");

        assertThatThrownBy(() -> invitationService.createInvitation("missing@example.com", 10L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    void createInvitation_groupNotFound_throws() {
        User inviter = testUser();
        when(userRepository.findByEmail("inviter@example.com")).thenReturn(Optional.of(inviter));
        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        InviteRequest req = new InviteRequest();
        req.setEmail("invited@example.com");

        assertThatThrownBy(() -> invitationService.createInvitation("inviter@example.com", 999L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Group not found");
    }

    // --- acceptInvitation ---

    @Test
    void acceptInvitation_success_createsMembership() {
        User user = User.builder().id(2L).email("invited@example.com").build();
        Group group = testGroup(testUser());
        InvitationToken token = InvitationToken.builder()
                .id(1L)
                .token("valid-token")
                .group(group)
                .invitedEmail("invited@example.com")
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .used(false)
                .build();

        when(invitationRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(userRepository.findByEmail("invited@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.existsByUserIdAndGroupId(2L, 10L)).thenReturn(false);
        when(membershipRepository.save(any(GroupMembership.class))).thenAnswer(inv -> inv.getArgument(0));
        when(invitationRepository.save(any(InvitationToken.class))).thenAnswer(inv -> inv.getArgument(0));

        invitationService.acceptInvitation("valid-token");

        ArgumentCaptor<GroupMembership> captor = ArgumentCaptor.forClass(GroupMembership.class);
        verify(membershipRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(user);
        assertThat(captor.getValue().getGroup()).isEqualTo(group);
        assertThat(captor.getValue().getStatus()).isEqualTo(GroupMembership.MembershipStatus.ACTIVE);
        assertThat(captor.getValue().getRole()).isEqualTo(GroupMembership.GroupRole.MEMBER);

        verify(rsvpService).createOpenRsvpsForUserInGroup(user, group);
        assertThat(token.isUsed()).isTrue();
        verify(invitationRepository).save(token);
    }

    @Test
    void acceptInvitation_alreadyMember_skipsCreationButMarksUsed() {
        User user = User.builder().id(2L).email("invited@example.com").build();
        Group group = testGroup(testUser());
        InvitationToken token = InvitationToken.builder()
                .id(1L)
                .token("valid-token")
                .group(group)
                .invitedEmail("invited@example.com")
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .used(false)
                .build();

        when(invitationRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(userRepository.findByEmail("invited@example.com")).thenReturn(Optional.of(user));
        when(membershipRepository.existsByUserIdAndGroupId(2L, 10L)).thenReturn(true);

        invitationService.acceptInvitation("valid-token");

        verify(membershipRepository, never()).save(any());
        verify(rsvpService).createOpenRsvpsForUserInGroup(user, group);
        assertThat(token.isUsed()).isTrue();
        verify(invitationRepository).save(token);
    }

    @Test
    void acceptInvitation_alreadyUsed_throws() {
        InvitationToken token = InvitationToken.builder()
                .id(1L)
                .token("used-token")
                .group(testGroup(testUser()))
                .invitedEmail("invited@example.com")
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .used(true)
                .build();

        when(invitationRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> invitationService.acceptInvitation("used-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invitation has already been used");
    }

    @Test
    void acceptInvitation_expired_throws() {
        InvitationToken token = InvitationToken.builder()
                .id(1L)
                .token("expired-token")
                .group(testGroup(testUser()))
                .invitedEmail("invited@example.com")
                .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .used(false)
                .build();

        when(invitationRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> invitationService.acceptInvitation("expired-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invitation has expired");
    }

    @Test
    void acceptInvitation_userNotRegistered_throws() {
        InvitationToken token = InvitationToken.builder()
                .id(1L)
                .token("valid-token")
                .group(testGroup(testUser()))
                .invitedEmail("unregistered@example.com")
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .used(false)
                .build();

        when(invitationRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(userRepository.findByEmail("unregistered@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invitationService.acceptInvitation("valid-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Please register with the email unregistered@example.com first");
    }

    @Test
    void acceptInvitation_tokenNotFound_throws() {
        when(invitationRepository.findByToken("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invitationService.acceptInvitation("nonexistent"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Invitation not found");
    }
}
