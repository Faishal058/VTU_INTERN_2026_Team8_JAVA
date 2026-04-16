package com.wealthwise.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "nav_daily", uniqueConstraints = @UniqueConstraint(columnNames = {"scheme_code","nav_date"}))
public class NavDaily {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_code", nullable = false) private String schemeCode;
    @Column(name = "nav_date",    nullable = false) private LocalDate navDate;
    @Column(name = "nav_value",   nullable = false, precision = 14, scale = 6) private BigDecimal navValue;
    @Column(name = "created_at") private OffsetDateTime createdAt;

    public Long getId() { return id; }
    public String getSchemeCode() { return schemeCode; }
    public void setSchemeCode(String v) { schemeCode = v; }
    public LocalDate getNavDate() { return navDate; }
    public void setNavDate(LocalDate v) { navDate = v; }
    public BigDecimal getNavValue() { return navValue; }
    public void setNavValue(BigDecimal v) { navValue = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
}
