package com.wealthwise.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "investment_transactions")
public class InvestmentTransaction {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id",           nullable = false) private UUID userId;
    @Column(name = "plan_id")           private UUID planId;
    @Column(name = "scheme_code")       private String schemeCode;
    @Column(name = "fund_name")         private String fundName;
    @Column(name = "folio_number")      private String folioNumber;
    @Column(name = "transaction_type",  nullable = false) private String transactionType;

    @Column(name = "amount",     precision = 14, scale = 4) private BigDecimal amount;
    @Column(name = "nav",        precision = 12, scale = 6) private BigDecimal nav;
    @Column(name = "units",      precision = 14, scale = 6) private BigDecimal units;
    @Column(name = "stamp_duty", precision = 10, scale = 4) private BigDecimal stampDuty = BigDecimal.ZERO;
    @Column(name = "exit_load",  precision = 10, scale = 4) private BigDecimal exitLoad  = BigDecimal.ZERO;

    @Column(name = "transaction_date",  nullable = false) private LocalDate transactionDate;
    @Column(name = "status")            private String status = "Completed";

    @Column(name = "stcg_units", precision = 14, scale = 6) private BigDecimal stcgUnits = BigDecimal.ZERO;
    @Column(name = "ltcg_units", precision = 14, scale = 6) private BigDecimal ltcgUnits = BigDecimal.ZERO;
    @Column(name = "stcg_gain",  precision = 14, scale = 4) private BigDecimal stcgGain  = BigDecimal.ZERO;
    @Column(name = "ltcg_gain",  precision = 14, scale = 4) private BigDecimal ltcgGain  = BigDecimal.ZERO;

    @Column(name = "note")   private String note;
    @Column(name = "source") private String source = "Manual";
    @Column(name = "created_at") private OffsetDateTime createdAt;

    public UUID getId()              { return id; }
    public UUID getUserId()          { return userId; }
    public void setUserId(UUID v)    { userId = v; }
    public UUID getPlanId()          { return planId; }
    public void setPlanId(UUID v)    { planId = v; }
    public String getSchemeCode()    { return schemeCode; }
    public void setSchemeCode(String v) { schemeCode = v; }
    public String getFundName()      { return fundName; }
    public void setFundName(String v){ fundName = v; }
    public String getFolioNumber()   { return folioNumber; }
    public void setFolioNumber(String v){ folioNumber = v; }
    public String getTransactionType()   { return transactionType; }
    public void setTransactionType(String v){ transactionType = v; }
    public BigDecimal getAmount()    { return amount; }
    public void setAmount(BigDecimal v){ amount = v; }
    public BigDecimal getNav()       { return nav; }
    public void setNav(BigDecimal v) { nav = v; }
    public BigDecimal getUnits()     { return units; }
    public void setUnits(BigDecimal v){ units = v; }
    public BigDecimal getStampDuty() { return stampDuty; }
    public void setStampDuty(BigDecimal v) { stampDuty = v; }
    public BigDecimal getExitLoad()  { return exitLoad; }
    public void setExitLoad(BigDecimal v) { exitLoad = v; }
    public LocalDate getTransactionDate()   { return transactionDate; }
    public void setTransactionDate(LocalDate v){ transactionDate = v; }
    public String getStatus()        { return status; }
    public void setStatus(String v)  { status = v; }
    public BigDecimal getStcgUnits() { return stcgUnits; }
    public void setStcgUnits(BigDecimal v){ stcgUnits = v; }
    public BigDecimal getLtcgUnits() { return ltcgUnits; }
    public void setLtcgUnits(BigDecimal v){ ltcgUnits = v; }
    public BigDecimal getStcgGain()  { return stcgGain; }
    public void setStcgGain(BigDecimal v){ stcgGain = v; }
    public BigDecimal getLtcgGain()  { return ltcgGain; }
    public void setLtcgGain(BigDecimal v){ ltcgGain = v; }
    public String getNote()          { return note; }
    public void setNote(String v)    { note = v; }
    public String getSource()        { return source; }
    public void setSource(String v)  { source = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v){ createdAt = v; }
}
