#!/usr/bin/env python3
"""
computeVoronoi.py
=================
Reads police station points and the Thailand province boundary, then
computes Voronoi polygons (jurisdictions) for each station, clipped
strictly within the Thai border so they don't bleed into the ocean
or neighboring countries.

Uses scipy.spatial.Voronoi + shapely for geometry operations — no
PostGIS required.  (PostGIS SQL provided in comments for reference.)

Usage:
    python3 scripts/computeVoronoi.py

Inputs:
    public/geojson/point/police-stations.json     (from fetchPoliceStations.py)
    public/geojson/polygon/thailand-provinces.json (77-province boundaries)

Output:
    public/geojson/polygon/police-jurisdictions.json

──────────────────────────────────────────────────────────────────────
PostGIS equivalent (for reference):
──────────────────────────────────────────────────────────────────────

  -- 1. Union all provinces into a single Thailand boundary
  CREATE MATERIALIZED VIEW thailand_boundary AS
  SELECT ST_Union(geom) AS geom
  FROM provinces;

  -- 2. Generate Voronoi, clip to Thailand
  WITH voronoi AS (
    SELECT (ST_Dump(
      ST_VoronoiPolygons(
        ST_Collect(geom),
        0.0,
        (SELECT geom FROM thailand_boundary)
      )
    )).geom AS geom
    FROM police_stations
  )
  SELECT
    ps.id,
    ps.name,
    ps.name_th,
    ST_Intersection(v.geom, tb.geom) AS jurisdiction
  FROM voronoi v
  JOIN police_stations ps
    ON ST_Contains(v.geom, ps.geom)
  CROSS JOIN thailand_boundary tb;

──────────────────────────────────────────────────────────────────────
"""

import json
import os
import sys
import numpy as np
from scipy.spatial import Voronoi
from shapely.geometry import (
    MultiPolygon, Polygon, Point, shape, mapping,
)
from shapely.ops import unary_union


# ── Paths ──────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIONS_FILE = os.path.join(ROOT, "public", "geojson", "point", "police-stations.json")
PROVINCES_FILE = os.path.join(ROOT, "public", "geojson", "polygon", "thailand-provinces.json")
OUTPUT_FILE = os.path.join(ROOT, "public", "geojson", "polygon", "police-jurisdictions.json")


def load_geojson(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_thailand_boundary(provinces_geojson: dict) -> MultiPolygon | Polygon:
    """Union all 77 province polygons into one Thailand outline."""
    print("[2/5] Building Thailand boundary from 77 provinces ...")
    polygons = []
    for feat in provinces_geojson["features"]:
        try:
            geom = shape(feat["geometry"])
            if geom.is_valid:
                polygons.append(geom)
            else:
                polygons.append(geom.buffer(0))  # auto-fix invalid
        except Exception as e:
            print(f"       ⚠ Skipping invalid province: {e}")
    boundary = unary_union(polygons)
    print(f"       Boundary area: {boundary.area:.2f} sq deg")
    return boundary


def voronoi_finite_polygons(vor, radius=None):
    """
    Reconstruct finite Voronoi regions from scipy.spatial.Voronoi.
    Returns a list of (region_polygon, point_index) tuples.

    Based on: https://gist.github.com/pv/8036995
    """
    if vor.points.shape[1] != 2:
        raise ValueError("Requires 2D input")

    new_regions = []
    new_vertices = vor.vertices.tolist()

    center = vor.points.mean(axis=0)
    if radius is None:
        radius = vor.points.ptp(axis=0).max() * 2

    # Map ridge-points to vertices
    all_ridges = {}
    for (p1, p2), (v1, v2) in zip(vor.ridge_points, vor.ridge_vertices):
        all_ridges.setdefault(p1, []).append((p2, v1, v2))
        all_ridges.setdefault(p2, []).append((p1, v1, v2))

    for p1, region_idx in enumerate(vor.point_region):
        vertices = vor.regions[region_idx]
        if all(v >= 0 for v in vertices):
            # Finite region
            new_regions.append(vertices)
            continue

        # Reconstruct infinite region
        ridges = all_ridges.get(p1, [])
        new_region = [v for v in vertices if v >= 0]

        for p2, v1, v2 in ridges:
            if v2 < 0:
                v1, v2 = v2, v1
            if v1 >= 0:
                continue

            # Compute far-away point
            t = vor.points[p2] - vor.points[p1]
            t /= np.linalg.norm(t)
            n = np.array([-t[1], t[0]])  # normal

            midpoint = vor.points[[p1, p2]].mean(axis=0)
            direction = np.sign(np.dot(midpoint - center, n)) * n
            far_point = vor.vertices[v2] + direction * radius

            new_region.append(len(new_vertices))
            new_vertices.append(far_point.tolist())

        # Sort vertices by angle
        vs = np.asarray([new_vertices[v] for v in new_region])
        c = vs.mean(axis=0)
        angles = np.arctan2(vs[:, 1] - c[1], vs[:, 0] - c[0])
        new_region = [new_region[i] for i in np.argsort(angles)]
        new_regions.append(new_region)

    return new_regions, np.asarray(new_vertices)


def compute_jurisdictions(
    stations_geojson: dict,
    boundary: MultiPolygon | Polygon,
) -> dict:
    """Compute Voronoi polygons for each station, clipped to Thailand."""
    features = stations_geojson["features"]
    n = len(features)
    print(f"[3/5] Computing Voronoi diagram for {n} stations ...")

    # Extract coordinates
    points = np.array([
        f["geometry"]["coordinates"] for f in features
    ])  # shape (n, 2) — [lon, lat]

    # Compute Voronoi
    vor = Voronoi(points)
    regions, vertices = voronoi_finite_polygons(vor, radius=50.0)

    print(f"[4/5] Clipping {len(regions)} Voronoi cells to Thailand boundary ...")
    output_features = []
    clipped_count = 0

    for i, region in enumerate(regions):
        if i >= n:
            break  # Safety: only process original points
        polygon_coords = [vertices[v] for v in region]
        try:
            poly = Polygon(polygon_coords)
            if not poly.is_valid:
                poly = poly.buffer(0)

            # Clip to Thailand boundary
            clipped = poly.intersection(boundary)

            if clipped.is_empty:
                continue

            clipped_count += 1
            station_props = features[i]["properties"]
            station_coords = features[i]["geometry"]["coordinates"]

            output_features.append({
                "type": "Feature",
                "geometry": simplify_geometry(mapping(clipped)),
                "properties": {
                    "station_id": station_props.get("id"),
                    "name": station_props.get("name", ""),
                    "name_th": station_props.get("name_th", ""),
                    "station_type": station_props.get("station_type", ""),
                    "station_lon": station_coords[0],
                    "station_lat": station_coords[1],
                },
            })
        except Exception as e:
            print(f"       ⚠ Cell {i} failed: {e}")

    print(f"       {clipped_count}/{n} cells clipped successfully")

    return {
        "type": "FeatureCollection",
        "features": output_features,
    }


def simplify_geometry(geom_dict: dict) -> dict:
    """Reduce coordinate precision to 4 decimals to shrink file size."""
    def round_coords(coords):
        if isinstance(coords[0], (int, float)):
            return [round(coords[0], 4), round(coords[1], 4)]
        return [round_coords(c) for c in coords]

    geom_dict["coordinates"] = round_coords(geom_dict["coordinates"])
    return geom_dict


def write_output(geojson: dict) -> None:
    """Write the jurisdictions GeoJSON."""
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"[5/5] Wrote {OUTPUT_FILE}")
    print(f"       {len(geojson['features'])} jurisdictions, {size_kb:.0f} KB")


def main():
    print("=" * 60)
    print("  DTID — Police Jurisdiction Voronoi Computation")
    print("=" * 60)

    # 1. Load stations
    if not os.path.exists(STATIONS_FILE):
        print(f"✗ Station file not found: {STATIONS_FILE}")
        print("  Run: python3 scripts/fetchPoliceStations.py first")
        sys.exit(1)

    print(f"[1/5] Loading police stations from {os.path.basename(STATIONS_FILE)} ...")
    stations = load_geojson(STATIONS_FILE)
    print(f"       {len(stations['features'])} stations loaded")

    if len(stations["features"]) < 3:
        print("✗ Need at least 3 stations for Voronoi")
        sys.exit(1)

    # 2. Load and union provinces
    if not os.path.exists(PROVINCES_FILE):
        print(f"✗ Province file not found: {PROVINCES_FILE}")
        sys.exit(1)

    provinces = load_geojson(PROVINCES_FILE)
    boundary = build_thailand_boundary(provinces)

    # 3. Compute Voronoi + clip
    jurisdictions = compute_jurisdictions(stations, boundary)

    # 4. Write
    write_output(jurisdictions)

    print(f"\n\u2713 Done — {len(jurisdictions['features'])} jurisdiction polygons generated")


if __name__ == "__main__":
    main()
