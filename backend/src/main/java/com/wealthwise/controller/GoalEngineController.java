package com.wealthwise.controller;

import com.wealthwise.service.GoalEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learn")
public class GoalEngineController {

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
