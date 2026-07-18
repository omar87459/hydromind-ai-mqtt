"""
Energy historical analytics.

Generates a plausible synthetic time series for a requested date range, in
the same spirit as sensor_simulator.py — there's no persisted consumption
database yet, so each day's value is deterministic given its date (seeded
by the date) rather than pure random noise, so repeated requests for the
same range return a stable-looking series instead of jumping around.
Baseline consumption is derived from the real device wattages/duty cycles
in energy_registry.DEVICES, not an arbitrary number.
"""

import random
from collections import OrderedDict
from datetime import datetime, timedelta

from . import energy_registry
from .energy_optimizer import COST_PER_KWH

CO2_KG_PER_KWH = 0.4  # illustrative grid-average factor


def _parse_date(value: str):
    return datetime.strptime(value, "%Y-%m-%d").date()


def _day_value(date_obj) -> dict:
    rng = random.Random(int(date_obj.strftime("%Y%m%d")))
    baseline = energy_registry.typical_daily_kwh()
    weekday_factor = 0.85 if date_obj.weekday() >= 5 else 1.0
    total_kwh = round(baseline * weekday_factor * rng.uniform(0.9, 1.1), 2)
    return {
        "date": date_obj.strftime("%Y-%m-%d"),
        "total_kwh": total_kwh,
        "cost": round(total_kwh * COST_PER_KWH, 2),
    }


def _bucket(days: list, size: int) -> list:
    buckets = []
    for i in range(0, len(days), size):
        chunk = days[i : i + size]
        buckets.append(
            {
                "period": f"{chunk[0]['date']} to {chunk[-1]['date']}",
                "total_kwh": round(sum(c["total_kwh"] for c in chunk), 2),
                "cost": round(sum(c["cost"] for c in chunk), 2),
            }
        )
    return buckets


def _bucket_by_month(days: list) -> list:
    months = OrderedDict()
    for d in days:
        months.setdefault(d["date"][:7], []).append(d)
    return [
        {
            "period": key,
            "total_kwh": round(sum(c["total_kwh"] for c in chunk), 2),
            "cost": round(sum(c["cost"] for c in chunk), 2),
        }
        for key, chunk in months.items()
    ]


def get_series(granularity: str, start: str, end: str) -> list:
    start_date, end_date = _parse_date(start), _parse_date(end)
    if end_date < start_date:
        start_date, end_date = end_date, start_date
    if (end_date - start_date).days > 366:
        raise ValueError("Date range too large (max 366 days)")

    days = []
    d = start_date
    while d <= end_date:
        days.append(_day_value(d))
        d += timedelta(days=1)

    if granularity == "weekly":
        return _bucket(days, 7)
    if granularity == "monthly":
        return _bucket_by_month(days)
    return days


def get_device_comparison(start: str, end: str) -> list:
    start_date, end_date = _parse_date(start), _parse_date(end)
    num_days = max(1, (end_date - start_date).days + 1)
    rng = random.Random(int(start_date.strftime("%Y%m%d")) + num_days)

    result = []
    for key, spec in energy_registry.DEVICES.items():
        avg_daily_kwh = (spec["rated_power_w"] * spec["duty_cycle"] * 24) / 1000
        total = avg_daily_kwh * num_days * rng.uniform(0.9, 1.1)
        result.append({"device_id": key, "total_kwh": round(total, 2)})
    result.sort(key=lambda r: -r["total_kwh"])
    return result


def get_peak_hours(date: str) -> list:
    date_obj = _parse_date(date)
    rng = random.Random(int(date_obj.strftime("%Y%m%d")))
    baseline_hourly = energy_registry.typical_daily_kwh() / 24

    hours = []
    for h in range(24):
        factor = 1.4 if 6 <= h <= 20 else 0.6  # daytime lighting/pumps draw more
        hours.append({"hour": h, "avg_kwh": round(baseline_hourly * factor * rng.uniform(0.85, 1.15), 3)})
    return hours


def get_summary() -> dict:
    today = datetime.now().date()
    baseline = energy_registry.typical_daily_kwh()
    savings_rate = 0.08  # illustrative: 8% below an unoptimized baseline

    today_saved = round(baseline * savings_rate, 2)
    month_saved = round(baseline * savings_rate * today.day, 1)
    year_saved = round(baseline * savings_rate * today.timetuple().tm_yday, 1)

    return {
        "today_energy_saved_kwh": today_saved,
        "monthly_energy_saved_kwh": month_saved,
        "annual_energy_saved_kwh": year_saved,
        "estimated_cost_saved": round(year_saved * COST_PER_KWH, 2),
        "estimated_co2_reduced_kg": round(year_saved * CO2_KG_PER_KWH, 1),
        "efficiency_score_pct": 87,
    }
