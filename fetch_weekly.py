#!/usr/bin/env python3
"""
fetch_cbr_weekly.py

Fetch weekly exchange rates (CBR) from 2021 and write JSON in the format requested:
{
  "<CBR_ID>": {
     "<js_timestamp_ms>": <rate>,
     ...
  },
  ...
}

Also writes an alternate file keyed by currency CharCode (USD, EUR, UAH, PLN).
"""

import requests
import xml.etree.ElementTree as ET
from datetime import date, timedelta, datetime, timezone
import json
import time

# --- Configuration ---
START_DATE = date(2021, 1, 4)   # first Monday of 2021 (change if you want other weekday)
END_DATE = date.today()         # inclusive end (will stop at the last Monday <= today)
WEEK_DELTA = timedelta(days=7)

CBR_DAILY_URL = "https://www.cbr.ru/scripts/XML_daily.asp?date_req={d}"  # d -> DD/MM/YYYY
# currencies we want (CharCode)
TARGET_CODES = {"USD", "EUR", "UAH", "PLN"}

# Output files
OUT_BY_ID = "cbr_weekly_rates_by_id.json"
OUT_BY_CODE = "cbr_weekly_rates_by_code.json"

# --- Helpers ---
def to_js_ts_ms(dt: date) -> int:
    """Return JavaScript timestamp (ms) for midnight UTC of given date."""
    dt_utc = datetime(dt.year, dt.month, dt.day, 0, 0, 0, tzinfo=timezone.utc)
    return int(dt_utc.timestamp() * 1000)

def parse_cbr_xml(xml_text):
    """
    Parse CBR XML text and return list of dicts for Valute entries with keys:
      - ID (attribute)
      - NumCode
      - CharCode
      - Nominal (int)
      - Value (float)  -- value as RUB for the given Nominal (converted to float)
    """
    root = ET.fromstring(xml_text)
    items = []
    for val in root.findall("Valute"):
        vid = val.attrib.get("ID")
        num = val.findtext("NumCode")
        code = val.findtext("CharCode")
        nom = val.findtext("Nominal")
        val_text = val.findtext("Value")
        # CBR uses comma as decimal separator
        if val_text is None or code is None:
            continue
        value_str = val_text.strip().replace(",", ".")
        try:
            value = float(value_str)
            nominal = int(nom) if nom is not None else 1
        except:
            continue
        items.append({
            "ID": vid,
            "NumCode": num,
            "CharCode": code,
            "Nominal": nominal,
            "Value": value
        })
    return items

# --- Main fetch loop ---
def fetch_weekly_rates(start_date=START_DATE, end_date=END_DATE):
    by_id = {}
    by_code = {}
    d = start_date
    # advance d forward until it's a Monday (if not already)
    # (script default start_date is Monday; this just ensures)
    # ISO weekday: Monday=1 .. Sunday=7
    if d.isoweekday() != 1:
        d += timedelta(days=(8 - d.isoweekday()))

    while d <= end_date:
        datestr = d.strftime("%d/%m/%Y")
        print(f"[INFO] Fetching for {datestr}.")
        url = CBR_DAILY_URL.format(d=datestr)
        try:
            resp = requests.get(url, timeout=15)
            resp.raise_for_status()
        except Exception as e:
            print(f"[WARN] Failed to fetch {datestr}: {e}. Skipping this date.")
            d += WEEK_DELTA
            continue

        try:
            entries = parse_cbr_xml(resp.text)
        except Exception as e:
            print(f"[WARN] Failed to parse XML for {datestr}: {e}.")
            d += WEEK_DELTA
            continue

        ts = to_js_ts_ms(d)

        # find target currencies by CharCode
        for cur in entries:
            code = cur["CharCode"]
            if code not in TARGET_CODES:
                continue
            per_unit = cur["Value"] / cur["Nominal"]  # convert to per 1 unit
            # top-level key by CBR ID
            cid = cur["ID"] or code
            # store in by_id
            if cid not in by_id:
                by_id[cid] = {}
            by_id[cid][str(ts)] = round(per_unit, 6)  # round reasonably

            # store in by_code
            if code not in by_code:
                by_code[code] = {}
            by_code[code][str(ts)] = round(per_unit, 6)

        # polite pause so you don't hammer the server
        time.sleep(0.2)
        d += WEEK_DELTA

    return by_id, by_code

if __name__ == "__main__":
    print("Fetching weekly rates from CBR...")
    by_id, by_code = fetch_weekly_rates()
    # Write JSON files
    with open(OUT_BY_ID, "w", encoding="utf-8") as f:
        json.dump(by_id, f, indent=2, ensure_ascii=False)
    with open(OUT_BY_CODE, "w", encoding="utf-8") as f:
        json.dump(by_code, f, indent=2, ensure_ascii=False)

    print(f"Wrote {OUT_BY_ID} and {OUT_BY_CODE}.")
    print("Sample keys (by code):", ", ".join(by_code.keys()))
