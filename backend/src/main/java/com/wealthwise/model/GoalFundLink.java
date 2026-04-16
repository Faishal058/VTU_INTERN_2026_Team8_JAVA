package com.wealthwise.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "goal_fund_links", uniqueConstraints =
    @UniqueConstraint(columnNames = {"goal_id","scheme_code","folio_number"}))
public class GoalFundLink {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id",  nullable = false) private UUID userId;
    @Column(name = "goal_id",  nullable = false) private UUID goalId;
    @Column(name = "scheme_code", nullable = false) private String schemeCode;
    @Column(name = "fund_name")  private String fundName;
    @Column(name = "folio_number") private String folioNumber;
    @Column(name = "allocation_pct", precision = 5, scale = 2) private BigDecimal allocationPct = BigDecimal.valueOf(100);
    @Column(name = "created_at") private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID v) { userId = v; }
    public UUID getGoalId() { return goalId; }
    public void setGoalId(UUID v) { goalId = v; }
    public String getSchemeCode() { return schemeCode; }
    public void setSchemeCode(String v) { schemeCode = v; }
    public String getFundName() { return fundName; }
    public void setFundName(String v) { fundName = v; }
    public String getFolioNumber() { return folioNumber; }
    public void setFolioNumber(String v) { folioNumber = v; }
    public BigDecimal getAllocationPct() { return allocationPct; }
    public void setAllocationPct(BigDecimal v) { allocationPct = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
}
