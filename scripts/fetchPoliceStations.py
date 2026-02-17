#!/usr/bin/env python3
"""
fetchPoliceStations.py
======================
Queries the Overpass API (OpenStreetMap) to download every location in
Thailand tagged with amenity=police, then writes a clean GeoJSON file.

Usage:
    python3 scripts/fetchPoliceStations.py

Output:
    public/geojson/point/police-stations.json
"""

import json
import os
import sys
import subprocess
import time

# ── Configuration ──────────────────────────────────────────────────────────
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public", "geojson", "point",
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "police-stations.json")

# Overpass QL query: all amenity=police within Thailand (ISO 3166-1 area)
OVERPASS_QUERY = """
[out:json][timeout:120];
area["ISO3166-1"="TH"][admin_level=2]->.thailand;
(
  node["amenity"="police"](area.thailand);
  way["amenity"="police"](area.thailand);
  relation["amenity"="police"](area.thailand);
);
out center;
"""


def fetch_overpass(query: str) -> dict:
    """Send query to Overpass API using curl (avoids Python SSL issues)."""
    print("[1/3] Querying Overpass API (this may take 30-60 s) ...")
    result = subprocess.run(
        [
            "curl", "-sS", "-X", "POST",
            "--max-time", "180",
            "-H", "User-Agent: DTID-Dashboard/1.0",
            "-d", f"data={query}",
            OVERPASS_URL,
        ],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"curl failed: {result.stderr}")
    data = json.loads(result.stdout)
    print(f"       Received {len(data.get('elements', []))} raw elements")
    return data


def parse_to_geojson(overpass_data: dict) -> dict:
    """Convert Overpass JSON elements into a GeoJSON FeatureCollection."""
    print("[2/3] Parsing into GeoJSON ...")
    features = []
    seen_coords = set()

    for el in overpass_data.get("elements", []):
        # Nodes have lat/lon directly; ways/relations use the 'center' field
        if el["type"] == "node":
            lat, lon = el.get("lat"), el.get("lon")
        else:
            center = el.get("center", {})
            lat, lon = center.get("lat"), center.get("lon")

        if lat is None or lon is None:
            continue

        # Round to 5 decimals (~1 m accuracy) and skip exact duplicates
        lat = round(lat, 5)
        lon = round(lon, 5)
        coord_key = (lat, lon)
        if coord_key in seen_coords:
            continue
        seen_coords.add(coord_key)

        tags = el.get("tags", {})

        # Build a clean name — prefer name:en, then name, then fallback
        name_en = (
            tags.get("name:en")
            or tags.get("name")
            or tags.get("official_name")
            or "Police Station"
        )
        name_th = tags.get("name:th") or tags.get("name") or ""

        # Determine station type from tags
        station_type = "police"
        if "police" in tags:
            station_type = tags["police"]  # e.g. "checkpoint", "station", "office"

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat],
            },
            "properties": {
                "id": el.get("id"),
                "name": name_en,
                "name_th": name_th,
                "station_type": station_type,
                "operator": tags.get("operator", ""),
                "addr_province": tags.get("addr:province", ""),
                "addr_district": tags.get("addr:district", ""),
                "phone": tags.get("phone", tags.get("contact:phone", "")),
                "osm_type": el["type"],
            },
        }
        features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }

    print(f"       {len(features)} unique police stations parsed")
    return geojson


def write_output(geojson: dict) -> None:
    """Write GeoJSON to the output file."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"[3/3] Wrote {OUTPUT_FILE}")
    print(f"       {len(geojson['features'])} stations, {size_kb:.0f} KB")


def main():
    print("=" * 60)
    print("  DTID — Police Station Data Extraction (Overpass API)")
    print("=" * 60)

    overpass_data = fetch_overpass(OVERPASS_QUERY)
    geojson = parse_to_geojson(overpass_data)

    if not geojson["features"]:
        print("\n⚠  No stations found. Check network / Overpass status.")
        sys.exit(1)

    write_output(geojson)

    # Print sample
    print("\nSample stations:")
    for f in geojson["features"][:10]:
        p = f["properties"]
        c = f["geometry"]["coordinates"]
        print(f"  {p['name'][:45]:<45} [{c[1]:.4f}, {c[0]:.4f}]  {p['station_type']}")

    print(f"\n✓ Done — {len(geojson['features'])} stations ready")
    print(f"  Next: python3 scripts/computeVoronoi.py")


if __name__ == "__main__":
    main()
