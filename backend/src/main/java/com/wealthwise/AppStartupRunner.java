package com.wealthwise;

import com.wealthwise.service.AmfiSeedService;
import com.wealthwise.repository.SchemeMasterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * M02/M03 — On startup, seed AMFI scheme master if the table is empty.
 * This runs once on first boot, then daily via the scheduler.
 */
@Component
public class AppStartupRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AppStartupRunner.class);

    private final SchemeMasterRepository schemeRepo;
    private final AmfiSeedService seedService;

    public AppStartupRunner(SchemeMasterRepository schemeRepo, AmfiSeedService seedService) {
        this.schemeRepo = schemeRepo;
        this.seedService = seedService;
    }

    @Override
    public void run(ApplicationArguments args) {
        long count = schemeRepo.count();
        if (count == 0) {
            log.info("Scheme master is empty — seeding from AMFI...");
            var result = seedService.seedFromAmfi();
            log.info("AMFI seed done: {} schemes, {} NAVs, status={}", result.schemesSaved(), result.navsInserted(), result.status());
        } else {
            log.info("Scheme master has {} records. Skipping seed (use /api/schemes/seed to refresh).", count);
        }
    }
}
