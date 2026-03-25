package com.drumdibum.activity;

import com.drumdibum.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rsvps", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "activity_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rsvp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RsvpStatus status = RsvpStatus.OPEN;

    public enum RsvpStatus {
        ACCEPTED, DECLINED, OPEN
    }
}
