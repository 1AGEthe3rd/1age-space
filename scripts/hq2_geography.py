#!/usr/bin/env python3
"""Build a compact HQ2 scene from local DC GeoJSON and an OSM XML extract.

Usage: python scripts/hq2_geography.py INPUT_DIRECTORY hq2/geography
Requires Shapely 2. Inputs and licenses are documented in hq2/geography/README.md.
"""
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET

from shapely import make_valid, orient_polygons, transform
from shapely.geometry import LineString, Point, Polygon, box, shape

ORIGIN = (-76.98865, 38.86735)
METERS = (86_810, -111_000)
TILE = 320
# Bounds include the Metro entrances, local bridge, and both riverbanks.
BOUNDS = (-712, -910, 448, 670)
ROADS = {
    'motorway': 13, 'trunk': 13, 'primary': 12, 'secondary': 10.8,
    'tertiary': 9, 'residential': 7.1, 'unclassified': 6.6, 'living_street': 6,
    'service': 4.6, 'pedestrian': 4.3, 'cycleway': 3.1, 'footway': 1.9,
    'path': 1.75, 'steps': 1.6,
}
PROPS = {'traffic_signals', 'bus_stop', 'street_lamp'}


def project(lon, lat):
    return (lon - ORIGIN[0]) * METERS[0], (lat - ORIGIN[1]) * METERS[1]


def parts(geometry, kind):
    if geometry.is_empty:
        return
    if geometry.geom_type == kind:
        yield geometry
    elif hasattr(geometry, 'geoms'):
        for item in geometry.geoms:
            yield from parts(item, kind)


def ring(coords):
    return [[round(x, 2), round(z, 2)] for x, z in coords]


def polygon_geometry(polygon):
    polygon = orient_polygons(polygon, exterior_cw=True)
    return [ring(polygon.exterior.coords), *[ring(hole.coords) for hole in polygon.interiors]]


def dump(file, data):
    file.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')


def source_tags(element):
    return {tag.get('k'): tag.get('v') for tag in element.findall('tag')}


def build(inputs, output):
    output.mkdir(parents=True, exist_ok=True)
    region = box(*BOUNDS)
    subdivisions = {}
    for ix in range(BOUNDS[0] // TILE, BOUNDS[2] // TILE + 1):
        for iz in range(BOUNDS[1] // TILE, BOUNDS[3] // TILE + 1):
            key = f'{ix}_{iz}'
            cell = box(ix * TILE, iz * TILE, (ix + 1) * TILE, (iz + 1) * TILE)
            subdivisions[key] = (cell.intersection(region), {'buildings': [], 'surfaces': []}, {'roads': [], 'props': [], 'parks': []})

    for file, key in [('footprints.geojson', 'buildings'), ('sidewalks.geojson', 'surfaces'), ('water.geojson', 'surfaces')]:
        for feature in json.loads((inputs / file).read_text())['features']:
            properties = feature['properties']
            role = ('water' if file == 'water.geojson' else
                    'crosswalk' if properties.get('DESCRIPTION') == 'Crosswalk' else
                    'sidewalk')
            if file == 'sidewalks.geojson' and properties.get('DESCRIPTION') not in {'Crosswalk', 'Sidewalk', 'Stairs'}:
                continue
            if not feature['geometry']:
                continue
            geometry = make_valid(transform(shape(feature["geometry"]), project, interleaved=False))
            if key == 'buildings':
                stable = properties['GLOBALID'].strip('{}').lower()
                for index, polygon in enumerate(parts(geometry, 'Polygon')):
                    point = polygon.representative_point()
                    if not region.covers(point) or polygon.area < 13:
                        continue
                    cell_key = f'{int(point.x // TILE)}_{int(point.y // TILE)}'
                    subdivisions[cell_key][1][key].append([
                        stable if index == 0 else f'{stable}-{index}', polygon_geometry(polygon.simplify(.14)),
                    ])
                continue
            for cell, dc, _ in subdivisions.values():
                for polygon in parts(geometry.intersection(cell), 'Polygon'):
                    if polygon.area >= 1:
                        dc[key].append([role, polygon_geometry(polygon.simplify(.13))])

    osm_document = ET.parse(inputs / 'streets.osm').getroot()
    nodes = {}
    for node in osm_document.findall('node'):
        point = project(float(node.get('lon')), float(node.get('lat')))
        nodes[node.get('id')] = point
        key = f'{int(point[0] // TILE)}_{int(point[1] // TILE)}'
        tags = source_tags(node)
        prop = 'tree' if tags.get('natural') == 'tree' else tags.get('highway')
        if key in subdivisions and region.covers(Point(point)) and prop in PROPS | {'tree'}:
            subdivisions[key][2]['props'].append([prop, *ring([point])[0]])

    for way in osm_document.findall('way'):
        tags = source_tags(way)
        highway = tags.get('highway', '').removesuffix('_link')
        points = [nodes[n.get('ref')] for n in way.findall('nd')]
        if highway in ROADS and len(points) > 1 and tags.get('tunnel', 'no') == 'no':
            line = LineString(points)
            for cell, _, osm in subdivisions.values():
                for segment in parts(line.intersection(cell), 'LineString'):
                    if segment.length < .3:
                        continue
                    osm['roads'].append([highway, ROADS[highway], tags.get('bridge', 'no') != 'no',
                                         ring(segment.simplify(.17).coords)])
        if len(points) >= 4 and points[0] == points[-1] and (tags.get('leisure') == 'park' or tags.get('landuse') == 'grass'):
            for cell, _, osm in subdivisions.values():
                for polygon in parts(make_valid(Polygon(points)).intersection(cell), 'Polygon'):
                    if polygon.area >= 15:
                        osm['parks'].append(polygon_geometry(polygon.simplify(.3)))

    counts = {}
    for key, (_, dc, osm) in subdivisions.items():
        dump(output / f'{key}.json', {'dc': dc, 'osm': osm})
        for group in (dc, osm):
            for layer, rows in group.items():
                counts[layer] = counts.get(layer, 0) + len(rows)
    dump(output / 'index.json', {
        'origin': ORIGIN, 'meters': METERS, 'bounds': BOUNDS, 'tileSize': TILE,
        'tiles': list(subdivisions), 'counts': counts,
    })


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('inputs', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    build(args.inputs, args.output)
