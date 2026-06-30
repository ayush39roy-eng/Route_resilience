"""
synthetic.py — Generate synthetic road-network datasets (JSON + placeholder images).
Used when data/ contains no real dataset folders.
"""

import json
import math
import random
import struct
import zlib
from pathlib import Path


def _make_graph_data(seed: int = 42, grid_size: int = 9, spacing: int = 65) -> tuple:
    """Build a grid road network with some diagonal healed shortcuts."""
    random.seed(seed)
    nodes, edges = [], []
    edge_id, node_id = 0, 0
    grid = {}
    margin = 55

    for r in range(grid_size):
        for c in range(grid_size):
            row = margin + r * spacing + random.uniform(-10, 10)
            col = margin + c * spacing + random.uniform(-10, 10)
            ntype = "junction" if (0 < r < grid_size - 1 and 0 < c < grid_size - 1) else "endpoint"
            grid[(r, c)] = node_id
            nodes.append({"id": node_id, "row": round(row, 2), "col": round(col, 2),
                           "type": ntype, "degree": 0})
            node_id += 1

    def add_edge(u, v, healed=False):
        nonlocal edge_id
        nu = next(n for n in nodes if n["id"] == u)
        nv = next(n for n in nodes if n["id"] == v)
        geom = []
        for i in range(13):
            t = i / 12
            row = nu["row"] * (1 - t) + nv["row"] * t
            col = nu["col"] * (1 - t) + nv["col"] * t
            pr = -(nv["col"] - nu["col"])
            pc = nv["row"] - nu["row"]
            mag = math.hypot(pr, pc) or 1
            curve = math.sin(math.pi * t) * 9
            geom.append([round(row + curve * pr / mag, 2), round(col + curve * pc / mag, 2)])
        length = sum(math.hypot(geom[i+1][0]-geom[i][0], geom[i+1][1]-geom[i][1]) for i in range(len(geom)-1))
        edges.append({"u": u, "v": v, "key": edge_id,
                       "length": round(length, 2), "healed": healed, "geometry": geom})
        nodes[u]["degree"] += 1
        nodes[v]["degree"] += 1
        edge_id += 1

    for r in range(grid_size):
        for c in range(grid_size):
            if c + 1 < grid_size: add_edge(grid[(r, c)], grid[(r, c+1)])
            if r + 1 < grid_size: add_edge(grid[(r, c)], grid[(r+1, c)])

    for _ in range(7):
        r1, c1 = random.randint(0, grid_size-2), random.randint(0, grid_size-2)
        r2, c2 = r1 + random.randint(1, 2), c1 + random.randint(1, 2)
        if r2 < grid_size and c2 < grid_size:
            add_edge(grid[(r1, c1)], grid[(r2, c2)], healed=True)

    return nodes, edges


def _write_pngs_pil(folder: Path, nodes: list, edges: list, w: int, h: int):
    from PIL import Image, ImageDraw
    rng = random.Random(1337)

    def draw_roads(draw, color, width):
        for e in edges:
            pts = [(int(p[1]), int(p[0])) for p in e.get("geometry", [])]
            for i in range(len(pts) - 1):
                draw.line([pts[i], pts[i+1]], fill=color, width=width)

    # satellite.png — earth tones with subtle road surface
    sat = Image.new("RGB", (w, h), (32, 42, 26))
    px = sat.load()
    for y in range(h):
        for x in range(w):
            v = rng.randint(-12, 12)
            px[x, y] = (max(0,min(255,32+v)), max(0,min(255,42+v)), max(0,min(255,26+v)))
    d = ImageDraw.Draw(sat)
    draw_roads(d, (130, 120, 110), 7)
    draw_roads(d, (180, 170, 158), 4)
    sat.save(folder / "satellite.png")

    # cleaned_mask.png — binary road mask
    mask = Image.new("L", (w, h), 0)
    draw_roads(ImageDraw.Draw(mask), 255, 8)
    mask.save(folder / "cleaned_mask.png")

    # skeleton-2.png — thinned skeleton
    skel = Image.new("L", (w, h), 0)
    draw_roads(ImageDraw.Draw(skel), 200, 2)
    skel.save(folder / "skeleton-2.png")

    # graph_on_satellite.png — graph overlay on satellite (used as thumbnail)
    thumb = sat.copy().convert("RGB")
    d = ImageDraw.Draw(thumb)
    draw_roads(d, (255, 160, 20), 3)
    for n in nodes:
        x, y = int(n["col"]), int(n["row"])
        r = 4 if n["type"] == "junction" else 3
        d.ellipse([x-r, y-r, x+r, y+r], fill=(80, 200, 120))
    thumb.save(folder / "graph_on_satellite.png")


def _write_pngs_minimal(folder: Path, w: int, h: int):
    """Solid-color PNG fallback when Pillow isn't available."""
    def solid_png(path, r, g, b):
        tw, th = 8, 8
        def chunk(name, data):
            c = name + data
            return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        rows = b"".join(b"\x00" + bytes([r, g, b]) * tw for _ in range(th))
        path.write_bytes(
            b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", tw, th, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(rows, 9))
            + chunk(b"IEND", b"")
        )
    solid_png(folder / "satellite.png", 35, 45, 28)
    solid_png(folder / "cleaned_mask.png", 20, 20, 20)
    solid_png(folder / "skeleton-2.png", 15, 15, 15)
    solid_png(folder / "graph_on_satellite.png", 40, 50, 35)


def generate_synthetic_dataset(folder: Path, seed: int = 42) -> tuple:
    """Generate a complete synthetic dataset directory and return (nodes, edges)."""
    folder.mkdir(parents=True, exist_ok=True)
    nodes, edges = _make_graph_data(seed=seed)

    max_col = max(n["col"] for n in nodes)
    max_row = max(n["row"] for n in nodes)
    img_w, img_h = int(max_col) + 80, int(max_row) + 80

    with open(folder / "nodes.json", "w") as f:
        json.dump(nodes, f)
    with open(folder / "edges.json", "w") as f:
        json.dump(edges, f)

    try:
        _write_pngs_pil(folder, nodes, edges, img_w, img_h)
    except ImportError:
        _write_pngs_minimal(folder, img_w, img_h)

    healed = sum(1 for e in edges if e.get("healed"))
    summary = {
        "nodes": len(nodes), "edges": len(edges),
        "healed_edges": healed, "connected_components": 1,
        "image_size": {"w": img_w, "h": img_h},
    }
    with open(folder / "graph_summary.json", "w") as f:
        json.dump(summary, f)

    print(f"[synthetic] Generated '{folder.name}' — {len(nodes)} nodes, {len(edges)} edges, {img_w}×{img_h}px")
    return nodes, edges
