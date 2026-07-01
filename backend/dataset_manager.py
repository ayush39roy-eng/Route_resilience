"""
dataset_manager.py — Discover, load, and cache all datasets from data/.

Flexible file discovery:
  nodes:       *node*.json
  edges:       *edge*.json
  satellite:   *sat*.jpg  or  *sat*.png  (excludes graph_on_*)
  mask:        *mask*.png                 (excludes graph_on_*)
  skeleton:    *skeleton*.png
  graph thumb: graph_on_satellite*.png  or  graph_on_mask*.png
"""

import json
import re
from pathlib import Path
from typing import Optional

import networkx as nx

from graph_loader import build_graph
from analysis import (
    compute_betweenness,
    compute_global_efficiency,
    get_top_gatekeepers,
    get_components_info,
)

DATA_DIR     = Path(__file__).parent.parent / "data"
TESTDATA_DIR = Path(__file__).parent.parent / "TESTDATA"


def _find(folder: Path, keyword: str, ext: Optional[str] = None, exclude: str = "") -> Optional[Path]:
    """Return first file in folder whose stem contains keyword (case-insensitive)."""
    for f in sorted(folder.iterdir()):
        if f.is_dir() or f.name.startswith("."):
            continue
        stem = f.stem.lower()
        if keyword in stem and (not exclude or exclude not in stem):
            if ext is None or f.suffix.lower() == ext:
                return f
    return None


def _find_image(folder: Path, keyword: str, exclude: str = "graph_on") -> Optional[Path]:
    """Find an image file (PNG or JPG) by keyword."""
    for ext in (".png", ".jpg", ".jpeg"):
        f = _find(folder, keyword, ext, exclude=exclude)
        if f:
            return f
    return None


def _get_image_size(path: Optional[Path]) -> dict:
    if not path or not path.exists():
        return {"w": 512, "h": 512}
    try:
        from PIL import Image
        with Image.open(path) as img:
            return {"w": img.width, "h": img.height}
    except Exception:
        return {"w": 512, "h": 512}


def _safe_id(name: str) -> str:
    return re.sub(r"[^a-z0-9_]", "_", name.lower())


class DatasetManager:
    def __init__(self):
        self._meta: dict[str, dict] = {}
        self._graphs: dict[str, nx.Graph] = {}
        self._centrality: dict[str, dict] = {}
        self._base_eff: dict[str, float] = {}
        self._raw: dict[str, tuple] = {}  # (nodes_list, edges_list)
        self._scan()

    # ── Discovery ─────────────────────────────────────────────────────────────

    def _scan(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)

        # Recursively find all folders containing nodes + edges JSON
        candidates = []
        for folder in sorted(DATA_DIR.rglob(".")):
            folder = folder.parent
            if not folder.is_dir() or folder == DATA_DIR:
                continue
            nf = _find(folder, "node", ".json")
            ef = _find(folder, "edge", ".json")
            if nf and ef:
                candidates.append((folder, nf, ef))

        # Also check DATA_DIR itself
        nf = _find(DATA_DIR, "node", ".json")
        ef = _find(DATA_DIR, "edge", ".json")
        if nf and ef:
            candidates.append((DATA_DIR, nf, ef))

        loaded = []
        seen_folders = set()
        for folder, nodes_file, edges_file in candidates:
            if folder in seen_folders:
                continue
            seen_folders.add(folder)
            ds_id = _safe_id(folder.name if folder != DATA_DIR else "dataset_root")
            try:
                self._load_dataset(ds_id, folder, nodes_file, edges_file)
                loaded.append(ds_id)
            except Exception as e:
                print(f"[datasets] Error loading {folder.name}: {e}")

        if not loaded:
            print("[datasets] No valid datasets found — generating synthetic data")
            from synthetic import generate_synthetic_dataset
            for i, seed in [(1, 42), (2, 99)]:
                name = f"synthetic_{i}"
                folder = DATA_DIR / name
                nodes, edges = generate_synthetic_dataset(folder, seed=seed)
                ds_id = name
                self._load_dataset(ds_id, folder,
                                   folder / "nodes.json", folder / "edges.json")
                loaded.append(ds_id)

        print(f"[datasets] Ready: {loaded}")

        # Also scan TESTDATA (independent of DATA_DIR results)
        if TESTDATA_DIR.exists():
            for folder in sorted(TESTDATA_DIR.iterdir()):
                if not folder.is_dir() or folder.name.startswith('.'):
                    continue
                nf = _find(folder, "node", ".json")
                ef = _find(folder, "edge", ".json")
                if nf and ef:
                    ds_id = "test_" + _safe_id(folder.name)
                    try:
                        self._load_dataset(ds_id, folder, nf, ef, is_test=True)
                    except Exception as e:
                        print(f"[datasets] Error loading testdata {folder.name}: {e}")

    def _load_dataset(self, ds_id: str, folder: Path,
                      nodes_file: Path, edges_file: Path, is_test: bool = False):
        with open(nodes_file) as f:
            nodes = json.load(f)
        with open(edges_file) as f:
            edges = json.load(f)

        G = build_graph(nodes, edges)
        centrality = compute_betweenness(G)
        base_eff = compute_global_efficiency(G)
        comps = get_components_info(G)
        healed = sum(1 for _, _, d in G.edges(data=True) if d.get("healed"))

        # Discover images
        sat      = _find_image(folder, "sat",      exclude="graph_on")
        mask     = _find_image(folder, "mask",     exclude="graph_on")
        skel     = (_find_image(folder, "skeleton-2", exclude="graph_on") or
                    _find_image(folder, "skeleton",   exclude="graph_on"))
        # For graph overlays: specifically look for "graph_on_" prefix — no exclusion
        gon_sat  = (_find(folder, "graph_on_sat",      ".png") or
                    _find(folder, "graph_on_satellite", ".png"))
        gon_mask = _find(folder, "graph_on_mask", ".png")

        pngs = {}
        for key, fp in [("satellite", sat), ("mask", mask),
                        ("skeleton", skel), ("graph_on_satellite", gon_sat),
                        ("graph_on_mask", gon_mask)]:
            if fp:
                pngs[key] = fp.name

        # Thumbnail: prefer graph_on_satellite → satellite → first available
        thumbnail = (gon_sat or sat or
                     next((v for v in [mask, skel] if v), None))
        thumbnail_name = thumbnail.name if thumbnail else None

        # Image size (satellite drives alignment)
        img_size = _get_image_size(sat or gon_sat)

        # Try graph_summary.json for pre-computed stats
        summary_path = folder / "graph_summary.json"
        summary = {}
        if summary_path.exists():
            try:
                with open(summary_path) as f:
                    summary = json.load(f)
            except Exception:
                pass

        meta = {
            "id":                ds_id,
            "name":              folder.name,
            "folder":            folder.name,
            "folder_path":       str(folder),
            "is_test":           is_test,
            "node_count":        G.number_of_nodes(),
            "edge_count":        G.number_of_edges(),
            "healed_edge_count": healed,
            "component_count":   len(comps),
            "base_efficiency":   round(base_eff, 6),
            "pngs":              pngs,
            "thumbnail":         thumbnail_name,
            "image_size":        img_size,
            "summary":           summary,
        }

        self._meta[ds_id]       = meta
        self._graphs[ds_id]     = G
        self._centrality[ds_id] = centrality
        self._base_eff[ds_id]   = base_eff
        self._raw[ds_id]        = (nodes, edges)

        print(f"[datasets] '{folder.name}' → {G.number_of_nodes()} nodes, "
              f"{G.number_of_edges()} edges, eff={base_eff:.5f}")

    # ── Accessors ─────────────────────────────────────────────────────────────

    def list_datasets(self) -> list:
        return list(self._meta.values())

    def get_meta(self, ds_id: str) -> Optional[dict]:
        return self._meta.get(ds_id)

    def get_graph(self, ds_id: str) -> Optional[nx.Graph]:
        return self._graphs.get(ds_id)

    def get_raw(self, ds_id: str) -> Optional[tuple]:
        return self._raw.get(ds_id)

    def get_centrality(self, ds_id: str) -> Optional[dict]:
        return self._centrality.get(ds_id)

    def get_base_efficiency(self, ds_id: str) -> float:
        return self._base_eff.get(ds_id, 0.0)
