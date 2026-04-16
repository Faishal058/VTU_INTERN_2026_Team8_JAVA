package com.wealthwise.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "financial_goals")
public class FinancialGoal {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(nullable = false) private String name;

    @Column(name = "goal_type")   private String goalType = "Custom";
    private String category = "General";
    private String priority = "Medium";

    @Column(name = "target_amount",       nullable = false) private BigDecimal targetAmount;
    @Column(name = "invested_amount")     private BigDecimal investedAmount  = BigDecimal.ZERO;
    @Column(name = "current_corpus")      private BigDecimal currentCorpus   = BigDecimal.ZERO;
    @Column(name = "monthly_need")        private BigDecimal monthlyNeed     = BigDecimal.ZERO;
    @Column(name = "required_sip")        private BigDecimal requiredSip     = BigDecimal.ZERO;
    @Column(name = "projected_value")     private BigDecimal projectedValue  = BigDecimal.ZERO;
    @Column(name = "monthly_sip_allocation") private BigDecimal monthlySipAllocation = BigDecimal.ZERO;

    @Column(name = "target_date")        private LocalDate targetDate;
    @Column(name = "inflation_rate")     private BigDecimal inflationRate  = BigDecimal.valueOf(6);
    @Column(name = "expected_return")    private BigDecimal expectedReturn = BigDecimal.valueOf(12);

    private String status = "Active";

    @Column(name = "created_at") private OffsetDateTime createdAt = OffsetDateTime.now();
    @Column(name = "updated_at") private OffsetDateTime updatedAt = OffsetDateTime.now();

    public FinancialGoal() {}

    public UUID getId()             { return id; }
    public void setId(UUID v)       { id = v; }
    public UUID getUserId()         { return userId; }
    public void setUserId(UUID v)   { userId = v; }
    public String getName()         { return name; }
    public void setName(String v)   { name = v; }
    public String getGoalType()     { return goalType; }
    public void setGoalType(String v){ goalType = v; }
    public String getCategory()     { return category; }
    public void setCategory(String v){ category = v; }
    public String getPriority()     { return priority; }
    public void setPriority(String v){ priority = v; }
    public BigDecimal getTargetAmount()     { return targetAmount; }
    public void setTargetAmount(BigDecimal v){ targetAmount = v; }
    public BigDecimal getInvestedAmount()   { return investedAmount; }
    public void setInvestedAmount(BigDecimal v){ investedAmount = v; }
    public BigDecimal getCurrentCorpus()    { return currentCorpus; }
    public void setCurrentCorpus(BigDecimal v){ currentCorpus = v; }
    public BigDecimal getMonthlyNeed()      { return monthlyNeed; }
    public void setMonthlyNeed(BigDecimal v){ monthlyNeed = v; }
    public BigDecimal getRequiredSip()      { return requiredSip; }
    public void setRequiredSip(BigDecimal v){ requiredSip = v; }
    public BigDecimal getProjectedValue()   { return projectedValue; }
    public void setProjectedValue(BigDecimal v){ projectedValue = v; }
    public BigDecimal getMonthlySipAllocation()   { return monthlySipAllocation; }
    public void setMonthlySipAllocation(BigDecimal v){ monthlySipAllocation = v; }
    public LocalDate getTargetDate()        { return targetDate; }
    public void setTargetDate(LocalDate v)  { targetDate = v; }
    public BigDecimal getInflationRate()    { return inflationRate; }
    public void setInflationRate(BigDecimal v){ inflationRate = v; }
    public BigDecimal getExpectedReturn()   { return expectedReturn; }
    public void setExpectedReturn(BigDecimal v){ expectedReturn = v; }
    public String getStatus()               { return status; }
    public void setStatus(String v)         { status = v; }
    public OffsetDateTime getCreatedAt()    { return createdAt; }
    public void setCreatedAt(OffsetDateTime v){ createdAt = v; }
    public OffsetDateTime getUpdatedAt()    { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime v){ updatedAt = v; }
}
