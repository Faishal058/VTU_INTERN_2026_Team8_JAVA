package com.wealthwise.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "investment_lots")
public class InvestmentLot {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id",       nullable = false) private UUID userId;
    @Column(name = "transaction_id",nullable = false) private UUID transactionId;
    @Column(name = "scheme_code",   nullable = false) private String schemeCode;
    @Column(name = "fund_name")  private String fundName;
    @Column(name = "folio_number") private String folioNumber;
    @Column(name = "purchase_date", nullable = false) private LocalDate purchaseDate;

    @Column(name = "units_purchased", nullable = false, precision = 14, scale = 6) private BigDecimal unitsPurchased;
    @Column(name = "cost_nav",        nullable = false, precision = 14, scale = 6) private BigDecimal costNav;
    @Column(name = "cost_per_unit",   nullable = false, precision = 14, scale = 6) private BigDecimal costPerUnit;
    @Column(name = "units_remaining", nullable = false, precision = 14, scale = 6) private BigDecimal unitsRemaining;

    @Column(name = "is_fully_redeemed") private Boolean isFullyRedeemed = false;
    @Column(name = "lock_in_until")     private LocalDate lockInUntil;
    @Column(name = "created_at")        private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID v) { userId = v; }
    public UUID getTransactionId() { return transactionId; }
    public void setTransactionId(UUID v) { transactionId = v; }
    public String getSchemeCode() { return schemeCode; }
    public void setSchemeCode(String v) { schemeCode = v; }
    public String getFundName() { return fundName; }
    public void setFundName(String v) { fundName = v; }
    public String getFolioNumber() { return folioNumber; }
    public void setFolioNumber(String v) { folioNumber = v; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate v) { purchaseDate = v; }
    public BigDecimal getUnitsPurchased() { return unitsPurchased; }
    public void setUnitsPurchased(BigDecimal v) { unitsPurchased = v; }
    public BigDecimal getCostNav() { return costNav; }
    public void setCostNav(BigDecimal v) { costNav = v; }
    public BigDecimal getCostPerUnit() { return costPerUnit; }
    public void setCostPerUnit(BigDecimal v) { costPerUnit = v; }
    public BigDecimal getUnitsRemaining() { return unitsRemaining; }
    public void setUnitsRemaining(BigDecimal v) { unitsRemaining = v; }
    public Boolean getIsFullyRedeemed() { return isFullyRedeemed; }
    public void setIsFullyRedeemed(Boolean v) { isFullyRedeemed = v; }
    public LocalDate getLockInUntil() { return lockInUntil; }
    public void setLockInUntil(LocalDate v) { lockInUntil = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
}
