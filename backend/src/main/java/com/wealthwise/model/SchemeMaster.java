package com.wealthwise.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "scheme_master")
public class SchemeMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "amfi_code", unique = true, nullable = false)
    private String amfiCode;

    @Column(name = "isin_growth") private String isinGrowth;
    @Column(name = "isin_idcw")   private String isinIdcw;

    @Column(name = "scheme_name", nullable = false, length = 512)
    private String schemeName;

    @Column(name = "amc_name")    private String amcName;
    @Column(name = "category")    private String category;
    @Column(name = "sub_category")private String subCategory;
    @Column(name = "scheme_type") private String schemeType;
    @Column(name = "plan_type")   private String planType;   // DIRECT / REGULAR
    @Column(name = "option_type") private String optionType; // GROWTH / IDCW_PAYOUT / IDCW_REINVESTMENT
    @Column(name = "fund_type")   private String fundType;   // OPEN_ENDED etc.
    @Column(name = "risk_level")  private Integer riskLevel; // 1-6 SEBI riskometer

    @Column(name = "min_lumpsum", precision = 12, scale = 2) private BigDecimal minLumpsum;
    @Column(name = "min_sip",     precision = 12, scale = 2) private BigDecimal minSip;

    @Column(name = "last_nav",      precision = 14, scale = 6) private BigDecimal lastNav;
    @Column(name = "last_nav_date") private LocalDate lastNavDate;

    @Column(name = "is_active")  private Boolean isActive = true;
    @Column(name = "created_at") private OffsetDateTime createdAt;
    @Column(name = "updated_at") private OffsetDateTime updatedAt;

    // ── Getters & Setters ──────────────────────
    public Long getId() { return id; }
    public String getAmfiCode() { return amfiCode; }
    public void setAmfiCode(String v) { amfiCode = v; }
    public String getIsinGrowth() { return isinGrowth; }
    public void setIsinGrowth(String v) { isinGrowth = v; }
    public String getIsinIdcw() { return isinIdcw; }
    public void setIsinIdcw(String v) { isinIdcw = v; }
    public String getSchemeName() { return schemeName; }
    public void setSchemeName(String v) { schemeName = v; }
    public String getAmcName() { return amcName; }
    public void setAmcName(String v) { amcName = v; }
    public String getCategory() { return category; }
    public void setCategory(String v) { category = v; }
    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String v) { subCategory = v; }
    public String getSchemeType() { return schemeType; }
    public void setSchemeType(String v) { schemeType = v; }
    public String getPlanType() { return planType; }
    public void setPlanType(String v) { planType = v; }
    public String getOptionType() { return optionType; }
    public void setOptionType(String v) { optionType = v; }
    public String getFundType() { return fundType; }
    public void setFundType(String v) { fundType = v; }
    public Integer getRiskLevel() { return riskLevel; }
    public void setRiskLevel(Integer v) { riskLevel = v; }
    public BigDecimal getMinLumpsum() { return minLumpsum; }
    public void setMinLumpsum(BigDecimal v) { minLumpsum = v; }
    public BigDecimal getMinSip() { return minSip; }
    public void setMinSip(BigDecimal v) { minSip = v; }
    public BigDecimal getLastNav() { return lastNav; }
    public void setLastNav(BigDecimal v) { lastNav = v; }
    public LocalDate getLastNavDate() { return lastNavDate; }
    public void setLastNavDate(LocalDate v) { lastNavDate = v; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean v) { isActive = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime v) { updatedAt = v; }
}
