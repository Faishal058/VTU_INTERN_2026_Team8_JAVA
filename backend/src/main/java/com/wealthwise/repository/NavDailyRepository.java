package com.wealthwise.repository;

import com.wealthwise.model.NavDaily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface NavDailyRepository extends JpaRepository<NavDaily, Long> {
    Optional<NavDaily> findBySchemeCodeAndNavDate(String schemeCode, LocalDate navDate);

    @Query("SELECT n FROM NavDaily n WHERE n.schemeCode = :code ORDER BY n.navDate DESC")
    List<NavDaily> findLatestBySchemeCode(@Param("code") String code, org.springframework.data.domain.Pageable p);

    @Query("SELECT n FROM NavDaily n WHERE n.schemeCode = :code AND n.navDate <= :date ORDER BY n.navDate DESC")
    List<NavDaily> findNavOnOrBefore(@Param("code") String code, @Param("date") LocalDate date, org.springframework.data.domain.Pageable p);

    boolean existsBySchemeCodeAndNavDate(String schemeCode, LocalDate navDate);
}
