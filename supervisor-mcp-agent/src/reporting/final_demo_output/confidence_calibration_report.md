
# Confidence Calibration Report

**Generated:** 2025-08-18 17:34:29  
**Period:** 2025-08-18 16:34 to 2025-08-18 17:34

## Summary

- **Total Predictions:** 30
- **Mean Confidence:** 0.650 ± 0.174
- **Actual Accuracy:** 50.0%
- **Calibration Error:** 0.350
- **Brier Score:** 0.152

## Calibration Analysis

**Overconfidence Rate:** 25.0%  
**Underconfidence Rate:** 0.0%

### Calibration Bins

| Confidence Range | Predicted | Actual | Count | Difference |
|------------------|-----------|--------|-------|------------|
| 0.4-0.5 | 0.400 | 0.000 | 5 | +0.400 |
| 0.5-0.6 | 0.500 | 0.000 | 5 | +0.500 |
| 0.6-0.7 | 0.600 | 0.000 | 5 | +0.600 |
| 0.7-0.8 | 0.700 | 1.000 | 5 | -0.300 |
| 0.8-0.9 | 0.800 | 1.000 | 5 | -0.200 |
| 0.9-1.0 | 0.900 | 1.000 | 5 | -0.100 |


## Agent Performance

| Agent ID | Predictions | Confidence | Accuracy | Brier Score | Calibration |
|----------|-------------|------------|----------|-------------|-------------|
| agent_00 | 8 | 0.600 | 37.5% | 0.165 | Overconfident |
| agent_01 | 8 | 0.700 | 62.5% | 0.120 | Well-calibrated |
| agent_02 | 7 | 0.600 | 28.6% | 0.211 | Overconfident |
| agent_03 | 7 | 0.700 | 71.4% | 0.113 | Well-calibrated |


## Trend Analysis

- **Confidence Trend:** Improving
- **Accuracy Trend:** Improving

## Recommendations

1. High calibration error (0.350). Consider retraining confidence estimation or adjusting thresholds.
2. Agents with poor calibration: agent_02. Consider agent-specific confidence tuning.
