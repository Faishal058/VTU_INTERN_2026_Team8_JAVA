package com.wealthwise.repository;

import com.wealthwise.model.SchemeMaster;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface SchemeMasterRepository extends JpaRepository<SchemeMaster, Long> {
    Optional<SchemeMaster> findByAmfiCode(String amfiCode);
    long countByIsActiveTrue();

    @Query("SELECT s FROM SchemeMaster s WHERE s.isActive = true AND " +
           "(LOWER(s.schemeName) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           " LOWER(s.amcName)    LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           " s.amfiCode = :q) ORDER BY s.schemeName")
    List<SchemeMaster> searchSchemes(@Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT s.amcName FROM SchemeMaster s WHERE s.isActive = true ORDER BY s.amcName")
    List<String> findAllAmcNames();
}
