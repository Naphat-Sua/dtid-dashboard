#!/usr/bin/env python3
"""Process Thailand province GeoJSON: simplify coordinates, add Thai names."""
import json
import sys
import os

INPUT_FILE = '/tmp/thailand_raw.json'
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           'public', 'geojson', 'polygon', 'thailand-provinces.json')

# Province name mapping: English -> Thai name
THAI_NAMES = {
    'Amnat Charoen': '\u0e2d\u0e33\u0e19\u0e32\u0e08\u0e40\u0e08\u0e23\u0e34\u0e0d',
    'Ang Thong': '\u0e2d\u0e48\u0e32\u0e07\u0e17\u0e2d\u0e07',
    'Bangkok': '\u0e01\u0e23\u0e38\u0e07\u0e40\u0e17\u0e1e\u0e21\u0e2b\u0e32\u0e19\u0e04\u0e23',
    'Bueng Kan': '\u0e1a\u0e36\u0e07\u0e01\u0e32\u0e2c',
    'Buri Ram': '\u0e1a\u0e38\u0e23\u0e35\u0e23\u0e31\u0e21\u0e22\u0e4c',
    'Chachoengsao': '\u0e09\u0e30\u0e40\u0e0a\u0e34\u0e07\u0e40\u0e17\u0e23\u0e32',
    'Chai Nat': '\u0e0a\u0e31\u0e22\u0e19\u0e32\u0e17',
    'Chaiyaphum': '\u0e0a\u0e31\u0e22\u0e20\u0e39\u0e21\u0e34',
    'Chanthaburi': '\u0e08\u0e31\u0e19\u0e17\u0e1a\u0e38\u0e23\u0e35',
    'Chiang Mai': '\u0e40\u0e0a\u0e35\u0e22\u0e07\u0e43\u0e2b\u0e21\u0e48',
    'Chiang Rai': '\u0e40\u0e0a\u0e35\u0e22\u0e07\u0e23\u0e32\u0e22',
    'Chon Buri': '\u0e0a\u0e25\u0e1a\u0e38\u0e23\u0e35',
    'Chumphon': '\u0e0a\u0e38\u0e21\u0e1e\u0e23',
    'Kalasin': '\u0e01\u0e32\u0e2c\u0e2a\u0e34\u0e19\u0e18\u0e38\u0e4c',
    'Kamphaeng Phet': '\u0e01\u0e33\u0e41\u0e1e\u0e07\u0e40\u0e1e\u0e0a\u0e23',
    'Kanchanaburi': '\u0e01\u0e32\u0e0d\u0e08\u0e19\u0e1a\u0e38\u0e23\u0e35',
    'Khon Kaen': '\u0e02\u0e2d\u0e19\u0e41\u0e01\u0e48\u0e19',
    'Krabi': '\u0e01\u0e23\u0e30\u0e1a\u0e35\u0e48',
    'Lampang': '\u0e25\u0e33\u0e1b\u0e32\u0e07',
    'Lamphun': '\u0e25\u0e33\u0e1e\u0e39\u0e19',
    'Loei': '\u0e40\u0e25\u0e22',
    'Lop Buri': '\u0e25\u0e1e\u0e1a\u0e38\u0e23\u0e35',
    'Mae Hong Son': '\u0e41\u0e21\u0e48\u0e2e\u0e48\u0e2d\u0e07\u0e2a\u0e2d\u0e19',
    'Maha Sarakham': '\u0e21\u0e2b\u0e32\u0e2a\u0e32\u0e23\u0e04\u0e32\u0e21',
    'Mukdahan': '\u0e21\u0e38\u0e01\u0e14\u0e32\u0e2b\u0e32\u0e23',
    'Nakhon Nayok': '\u0e19\u0e04\u0e23\u0e19\u0e32\u0e22\u0e01',
    'Nakhon Pathom': '\u0e19\u0e04\u0e23\u0e1b\u0e10\u0e21',
    'Nakhon Phanom': '\u0e19\u0e04\u0e23\u0e1e\u0e19\u0e21',
    'Nakhon Ratchasima': '\u0e19\u0e04\u0e23\u0e23\u0e32\u0e0a\u0e2a\u0e35\u0e21\u0e32',
    'Nakhon Sawan': '\u0e19\u0e04\u0e23\u0e2a\u0e27\u0e23\u0e23\u0e04\u0e4c',
    'Nakhon Si Thammarat': '\u0e19\u0e04\u0e23\u0e28\u0e23\u0e35\u0e18\u0e23\u0e23\u0e21\u0e23\u0e32\u0e0a',
    'Nan': '\u0e19\u0e48\u0e32\u0e19',
    'Narathiwat': '\u0e19\u0e23\u0e32\u0e18\u0e34\u0e27\u0e32\u0e2a',
    'Nong Bua Lam Phu': '\u0e2b\u0e19\u0e2d\u0e07\u0e1a\u0e31\u0e27\u0e25\u0e33\u0e20\u0e39',
    'Nong Khai': '\u0e2b\u0e19\u0e2d\u0e07\u0e04\u0e32\u0e22',
    'Nonthaburi': '\u0e19\u0e19\u0e17\u0e1a\u0e38\u0e23\u0e35',
    'Pathum Thani': '\u0e1b\u0e17\u0e38\u0e21\u0e18\u0e32\u0e19\u0e35',
    'Pattani': '\u0e1b\u0e31\u0e15\u0e15\u0e32\u0e19\u0e35',
    'Phangnga': '\u0e1e\u0e31\u0e07\u0e07\u0e32',
    'Phatthalung': '\u0e1e\u0e31\u0e17\u0e25\u0e38\u0e07',
    'Phayao': '\u0e1e\u0e30\u0e40\u0e22\u0e32',
    'Phetchabun': '\u0e40\u0e1e\u0e0a\u0e23\u0e1a\u0e39\u0e23\u0e13\u0e4c',
    'Phetchaburi': '\u0e40\u0e1e\u0e0a\u0e23\u0e1a\u0e38\u0e23\u0e35',
    'Phichit': '\u0e1e\u0e34\u0e08\u0e34\u0e15\u0e23',
    'Phitsanulok': '\u0e1e\u0e34\u0e29\u0e13\u0e38\u0e42\u0e25\u0e01',
    'Phra Nakhon Si Ayutthaya': '\u0e1e\u0e23\u0e30\u0e19\u0e04\u0e23\u0e28\u0e23\u0e35\u0e2d\u0e22\u0e38\u0e18\u0e22\u0e32',
    'Phrae': '\u0e41\u0e1e\u0e23\u0e48',
    'Phuket': '\u0e20\u0e39\u0e40\u0e01\u0e47\u0e15',
    'Prachin Buri': '\u0e1b\u0e23\u0e32\u0e08\u0e35\u0e19\u0e1a\u0e38\u0e23\u0e35',
    'Prachuap Khiri Khan': '\u0e1b\u0e23\u0e30\u0e08\u0e27\u0e1a\u0e04\u0e35\u0e23\u0e35\u0e02\u0e31\u0e19\u0e18\u0e4c',
    'Ranong': '\u0e23\u0e30\u0e19\u0e2d\u0e07',
    'Ratchaburi': '\u0e23\u0e32\u0e0a\u0e1a\u0e38\u0e23\u0e35',
    'Rayong': '\u0e23\u0e30\u0e22\u0e2d\u0e07',
    'Roi Et': '\u0e23\u0e49\u0e2d\u0e22\u0e40\u0e2d\u0e47\u0e14',
    'Sa Kaeo': '\u0e2a\u0e23\u0e30\u0e41\u0e01\u0e49\u0e27',
    'Sakon Nakhon': '\u0e2a\u0e01\u0e25\u0e19\u0e04\u0e23',
    'Samut Prakan': '\u0e2a\u0e21\u0e38\u0e17\u0e23\u0e1b\u0e23\u0e32\u0e01\u0e32\u0e23',
    'Samut Sakhon': '\u0e2a\u0e21\u0e38\u0e17\u0e23\u0e2a\u0e32\u0e04\u0e23',
    'Samut Songkhram': '\u0e2a\u0e21\u0e38\u0e17\u0e23\u0e2a\u0e07\u0e04\u0e23\u0e32\u0e21',
    'Saraburi': '\u0e2a\u0e23\u0e30\u0e1a\u0e38\u0e23\u0e35',
    'Satun': '\u0e2a\u0e15\u0e39\u0e25',
    'Sing Buri': '\u0e2a\u0e34\u0e07\u0e2b\u0e4c\u0e1a\u0e38\u0e23\u0e35',
    'Si Sa Ket': '\u0e28\u0e23\u0e35\u0e2a\u0e30\u0e40\u0e01\u0e29',
    'Songkhla': '\u0e2a\u0e07\u0e02\u0e25\u0e32',
    'Sukhothai': '\u0e2a\u0e38\u0e42\u0e02\u0e17\u0e31\u0e22',
    'Suphan Buri': '\u0e2a\u0e38\u0e1e\u0e23\u0e23\u0e13\u0e1a\u0e38\u0e23\u0e35',
    'Surat Thani': '\u0e2a\u0e38\u0e23\u0e32\u0e29\u0e0e\u0e23\u0e4c\u0e18\u0e32\u0e19\u0e35',
    'Surin': '\u0e2a\u0e38\u0e23\u0e34\u0e19\u0e17\u0e23\u0e4c',
    'Tak': '\u0e15\u0e32\u0e01',
    'Trang': '\u0e15\u0e23\u0e31\u0e07',
    'Trat': '\u0e15\u0e23\u0e32\u0e14',
    'Ubon Ratchathani': '\u0e2d\u0e38\u0e1a\u0e25\u0e23\u0e32\u0e0a\u0e18\u0e32\u0e19\u0e35',
    'Udon Thani': '\u0e2d\u0e38\u0e14\u0e23\u0e18\u0e32\u0e19\u0e35',
    'Uthai Thani': '\u0e2d\u0e38\u0e17\u0e31\u0e22\u0e18\u0e32\u0e19\u0e35',
    'Uttaradit': '\u0e2d\u0e38\u0e15\u0e23\u0e14\u0e34\u0e15\u0e16\u0e4c',
    'Yala': '\u0e22\u0e30\u0e25\u0e32',
    'Yasothon': '\u0e22\u0e42\u0e2a\u0e18\u0e23',
}


def simplify_coords(coords):
    """Reduce decimal precision to 4 places (~11m accuracy)."""
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], 4), round(coords[1], 4)]
    return [simplify_coords(c) for c in coords]


def thin_ring(ring, max_points=300):
    """Reduce point density for very dense polygon rings."""
    if len(ring) <= max_points:
        return ring
    step = max(1, len(ring) // max_points)
    thinned = ring[::step]
    if thinned[0] != thinned[-1]:
        thinned.append(thinned[0])
    return thinned


def thin_coords(coords, geo_type):
    if geo_type == 'Polygon':
        return [thin_ring(ring) for ring in coords]
    elif geo_type == 'MultiPolygon':
        return [[thin_ring(ring) for ring in polygon] for polygon in coords]
    return coords


def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Input features: {len(data['features'])}")

    for feature in data['features']:
        name = feature['properties'].get('name', '')
        geo_type = feature['geometry']['type']

        # Thin dense polygons
        feature['geometry']['coordinates'] = thin_coords(
            feature['geometry']['coordinates'], geo_type
        )
        # Simplify precision
        feature['geometry']['coordinates'] = simplify_coords(
            feature['geometry']['coordinates']
        )

        # Enrich properties
        feature['properties'] = {
            'ADM1_EN': name,
            'ADM1_TH': THAI_NAMES.get(name, name),
            'PROV_NAM_E': name,
        }

    output = json.dumps(data, ensure_ascii=False, separators=(',', ':'))

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(output)

    print(f"Output file: {OUTPUT_FILE}")
    print(f"Output size: {len(output):,} bytes ({len(output)/1024:.0f} KB)")
    print(f"Features: {len(data['features'])}")
    print("\nAll provinces:")
    for feat in data['features']:
        p = feat['properties']
        print(f"  {p['ADM1_EN']} ({p['ADM1_TH']})")


if __name__ == '__main__':
    main()
