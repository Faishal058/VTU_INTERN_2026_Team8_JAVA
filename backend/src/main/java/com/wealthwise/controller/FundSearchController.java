package com.wealthwise.controller;

import com.wealthwise.service.FundSearchService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/funds")
public class FundSearchController {

    private final FundSearchService fundSearchService;

    public FundSearchController(FundSearchService fundSearchService) {
        this.fundSearchService = fundSearchService;
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam String q) {
        return Map.of("results", fundSearchService.searchFunds(q));
    }
}
