package com.drumdibum.invitation;

import com.drumdibum.invitation.dto.InviteRequest;
import com.drumdibum.invitation.dto.InviteResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping("/groups/{groupId}/invite")
    public ResponseEntity<InviteResponse> createInvitation(@AuthenticationPrincipal UserDetails userDetails,
                                                            @PathVariable Long groupId,
                                                            @Valid @RequestBody InviteRequest request) {
        return ResponseEntity.ok(invitationService.createInvitation(userDetails.getUsername(), groupId, request));
    }

    @PostMapping("/invitations/{token}/accept")
    public ResponseEntity<Void> acceptInvitation(@PathVariable String token) {
        invitationService.acceptInvitation(token);
        return ResponseEntity.ok().build();
    }
}
