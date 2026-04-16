package com.wealthwise.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class FundSearchService {

    private final RestTemplate rest = new RestTemplate();

    @Cacheable("fundSearch")
    public List<Map<String, String>> searchFunds(String query) {
        try {
            String raw = rest.getForObject("https://www.amfiindia.com/spages/NAVAll.txt", String.class);
            if (raw == null) return Collections.emptyList();

            String lower = query.toLowerCase();
            return Arrays.stream(raw.split("\n"))
                    .filter(line -> line.contains(";") && line.toLowerCase().contains(lower))
                    .limit(20)
                    .map(line -> {
                        String[] parts = line.split(";");
                        Map<String, String> entry = new LinkedHashMap<>();
                        entry.put("schemeCode", parts.length > 0 ? parts[0].trim() : "");
                        entry.put("schemeName", parts.length > 3 ? parts[3].trim() : "");
                        entry.put("nav", parts.length > 4 ? parts[4].trim() : "");
                        entry.put("date", parts.length > 5 ? parts[5].trim() : "");
                        return entry;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
