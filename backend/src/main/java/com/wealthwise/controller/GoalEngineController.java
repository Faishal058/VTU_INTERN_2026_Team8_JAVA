package com.wealthwise.controller;

import com.wealthwise.service.GoalEngineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learn")
public class GoalEngineController {

    private static final Logger log = LoggerFactory.getLogger(GoalEngineController.class);

    private final GoalEngineService goalEngineService;

    public GoalEngineController(GoalEngineService goalEngineService) {
        this.goalEngineService = goalEngineService;
    }

    /**
     * POST /api/learn/analyse
     * Runs Monte Carlo, deterministic projection, and required SIP calculator
     * in a single request. All monetary outputs are in today's real money terms.
     */
    @PostMapping("/analyse")
    public ResponseEntity<AnalyseResponse> analyse(@RequestBody AnalyseRequest req) {
        long t0 = System.currentTimeMillis();
        log.info("[API] POST /api/learn/analyse  ▶ initialPortfolio={} months={} target={} monthlySIP={}",
            req.initialPortfolio(), req.months(), req.targetAmount(), req.monthlyContribution());

        // Validate
        if (req.initialPortfolio() <= 0) req = new AnalyseRequest(
                0.01, req.monthlyContribution(), req.monthlyMean(),
                req.monthlyStdDev(), req.months(), req.targetAmount(), req.annualInflationRate());

        GoalEngineService.MonteCarloResult mc = goalEngineService.runMonteCarlo(
                req.initialPortfolio(), req.monthlyContribution(), req.monthlyMean(),
                req.monthlyStdDev(), req.months(), req.targetAmount(), req.annualInflationRate());

        GoalEngineService.DeterministicResult det = goalEngineService.runDeterministicProjection(
                req.initialPortfolio(), req.monthlyContribution(), req.monthlyMean(),
                req.months(), req.targetAmount(), req.annualInflationRate());

        GoalEngineService.RequiredSipResult sip = goalEngineService.runRequiredSipCalculator(
                req.initialPortfolio(), req.monthlyContribution(), req.monthlyMean(),
                req.months(), req.targetAmount(), req.annualInflationRate());

        log.info("[API] POST /api/learn/analyse  ✔ {}ms  MC-probability={}%  onTrack={}",
            System.currentTimeMillis() - t0, mc.probability(), det.onTrack());
        return ResponseEntity.ok(new AnalyseResponse(mc, det, sip));
    }

    public record AnalyseRequest(
            double initialPortfolio,
            double monthlyContribution,
            double monthlyMean,
            double monthlyStdDev,
            int months,
            double targetAmount,
            double annualInflationRate
    ) {}

    public record AnalyseResponse(
            GoalEngineService.MonteCarloResult monteCarlo,
            GoalEngineService.DeterministicResult deterministic,
            GoalEngineService.RequiredSipResult requiredSip
    ) {}
}
