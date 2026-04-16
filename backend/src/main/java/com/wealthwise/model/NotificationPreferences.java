package com.wealthwise.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "sip_due_in_app")
    private Boolean sipDueInApp = true;

    @Column(name = "sip_due_email")
    private Boolean sipDueEmail = true;

    @Column(name = "goal_milestones_in_app")
    private Boolean goalMilestonesInApp = true;

    @Column(name = "goal_milestones_email")
    private Boolean goalMilestonesEmail = true;

    @Column(name = "daily_digest_email")
    private Boolean dailyDigestEmail = false;

    @Column(name = "market_alerts_in_app")
    private Boolean marketAlertsInApp = true;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public NotificationPreferences() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public Boolean getSipDueInApp() { return sipDueInApp; }
    public void setSipDueInApp(Boolean sipDueInApp) { this.sipDueInApp = sipDueInApp; }
    public Boolean getSipDueEmail() { return sipDueEmail; }
    public void setSipDueEmail(Boolean sipDueEmail) { this.sipDueEmail = sipDueEmail; }
    public Boolean getGoalMilestonesInApp() { return goalMilestonesInApp; }
    public void setGoalMilestonesInApp(Boolean goalMilestonesInApp) { this.goalMilestonesInApp = goalMilestonesInApp; }
    public Boolean getGoalMilestonesEmail() { return goalMilestonesEmail; }
    public void setGoalMilestonesEmail(Boolean goalMilestonesEmail) { this.goalMilestonesEmail = goalMilestonesEmail; }
    public Boolean getDailyDigestEmail() { return dailyDigestEmail; }
    public void setDailyDigestEmail(Boolean dailyDigestEmail) { this.dailyDigestEmail = dailyDigestEmail; }
    public Boolean getMarketAlertsInApp() { return marketAlertsInApp; }
    public void setMarketAlertsInApp(Boolean marketAlertsInApp) { this.marketAlertsInApp = marketAlertsInApp; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
