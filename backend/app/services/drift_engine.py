import numpy as np
import pandas as pd
from scipy import stats
from typing import Any, Dict, List, Tuple, Optional

class DriftEngine:
    """
    Statistical engine for detecting data drift between baseline training data
    and live production prediction requests.
    Supports:
    - Kolmogorov-Smirnov (KS) test for numerical continuous features
    - Population Stability Index (PSI) / Mean-Std shift comparison
    """

    @staticmethod
    def calculate_psi(baseline: np.ndarray, current: np.ndarray, num_bins: int = 10) -> float:
        """
        Calculate Population Stability Index (PSI) for a single numerical feature.
        PSI < 0.1: No significant drift
        PSI 0.1 - 0.2: Moderate drift
        PSI > 0.2: Significant data drift detected
        """
        if len(baseline) == 0 or len(current) == 0:
            return 0.0

        try:
            # Determine bin boundaries based on baseline percentiles
            percentiles = np.linspace(0, 100, num_bins + 1)
            bins = np.percentile(baseline, percentiles)
            bins = np.unique(bins) # remove duplicate edges
            if len(bins) < 2:
                bins = np.array([baseline.min() - 1, baseline.max() + 1])

            baseline_counts, _ = np.histogram(baseline, bins=bins)
            current_counts, _ = np.histogram(current, bins=bins)

            baseline_pct = baseline_counts / len(baseline)
            current_pct = current_counts / len(current)

            # Smooth zero percentages to avoid div by 0 or log(0)
            baseline_pct = np.where(baseline_pct == 0, 0.0001, baseline_pct)
            current_pct = np.where(current_pct == 0, 0.0001, current_pct)

            psi_val = np.sum((current_pct - baseline_pct) * np.log(current_pct / baseline_pct))
            return float(psi_val)
        except Exception:
            return 0.0

    @classmethod
    def detect_feature_drift(
        cls,
        feature_name: str,
        baseline_values: List[Any],
        production_values: List[Any],
        alpha: float = 0.05
    ) -> Dict[str, Any]:
        """
        Perform statistical drift test on a feature.
        """
        if not baseline_values or not production_values:
            return {
                "feature_name": feature_name,
                "drift_detected": False,
                "drift_score": 0.0,
                "p_value": 1.0,
                "reason": "Insufficient samples for comparison."
            }

        try:
            base_arr = np.array(baseline_values, dtype=float)
            prod_arr = np.array(production_values, dtype=float)

            # Perform Kolmogorov-Smirnov 2-sample test
            ks_stat, p_val = stats.ks_2samp(base_arr, prod_arr)
            psi_score = cls.calculate_psi(base_arr, prod_arr)

            base_mean, base_std = float(np.mean(base_arr)), float(np.std(base_arr))
            prod_mean, prod_std = float(np.mean(prod_arr)), float(np.std(prod_arr))

            # Drift is flagged if p_value < alpha (statistically significant shift) or PSI > 0.2
            is_drifted = bool(p_val < alpha or psi_score > 0.2)

            return {
                "feature_name": feature_name,
                "drift_detected": is_drifted,
                "drift_score": float(ks_stat),
                "psi_score": float(psi_score),
                "p_value": float(p_val),
                "details": {
                    "baseline_mean": round(base_mean, 4),
                    "baseline_std": round(base_std, 4),
                    "production_mean": round(prod_mean, 4),
                    "production_std": round(prod_std, 4),
                    "mean_diff": round(abs(prod_mean - base_mean), 4)
                }
            }
        except Exception as e:
            # Fallback for non-numeric/categorical features
            base_series = pd.Series(baseline_values).astype(str)
            prod_series = pd.Series(production_values).astype(str)

            base_dist = base_series.value_counts(normalize=True).to_dict()
            prod_dist = prod_series.value_counts(normalize=True).to_dict()

            # Calculate total variation distance
            all_keys = set(base_dist.keys()).union(set(prod_dist.keys()))
            tvd = 0.5 * sum(abs(base_dist.get(k, 0) - prod_dist.get(k, 0)) for k in all_keys)

            is_drifted = tvd > 0.25

            return {
                "feature_name": feature_name,
                "drift_detected": is_drifted,
                "drift_score": float(tvd),
                "p_value": None,
                "details": {
                    "baseline_distribution": base_dist,
                    "production_distribution": prod_dist,
                    "tvd": round(float(tvd), 4)
                }
            }
