"""
main.py — FastAPI backend for the Route Resilience multi-dataset dashboard.

Run with:  uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from dataset_manager import DatasetManager, DATA_DIR
from analysis import (
    ablate_nodes,
    shortest_path,
    get_top_gatekeepers,
    get_components_info,
)

app = FastAPI(title="Route Resilience API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://routeresilience.onrender.com",
        "http://localhost:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load all datasets at startup ──────────────────────────────────────────────
mgr = DatasetManager()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require(ds_id: str):
    meta = mgr.get_meta(ds_id)
    G    = mgr.get_graph(ds_id)
    if not meta or G is None:
        raise HTTPException(status_code=404, detail=f"Dataset '{ds_id}' not found")
    return meta, G


def _norm_centrality(centrality: dict) -> dict:
    vals = list(centrality.values())
    mx = max(vals) if vals else 1.0
    if mx == 0:
        return {k: 0.0 for k in centrality}
    return {k: v / mx for k, v in centrality.items()}


# ── Request models ────────────────────────────────────────────────────────────

class AblateRequest(BaseModel):
    disabled_node_ids: list[int]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/datasets")
def list_datasets():
    """List all available datasets with metadata + thumbnail paths."""
    datasets = mgr.list_datasets()
    # Add thumbnail URL for each dataset
    result = []
    for ds in datasets:
        d = dict(ds)
        if ds.get("thumbnail"):
            d["thumbnail_url"] = f"/static/{ds['folder']}/{ds['thumbnail']}"
        result.append(d)
    return result


@app.get("/api/datasets/{ds_id}/graph")
def get_graph(ds_id: str):
    meta, G = _require(ds_id)
    centrality = mgr.get_centrality(ds_id)
    norm_c = _norm_centrality(centrality)

    nodes_out = []
    for n, data in G.nodes(data=True):
        nodes_out.append({
            "id": n,
            "row": data["row"],
            "col": data["col"],
            "type": data.get("node_type", "junction"),
            "degree": data.get("degree", 0),
            "centrality": round(centrality.get(n, 0.0), 6),
            "centrality_norm": round(norm_c.get(n, 0.0), 4),
        })

    edges_out = []
    for u, v, data in G.edges(data=True):
        edges_out.append({
            "u": u, "v": v,
            "length": data.get("length", 0),
            "healed": data.get("healed", False),
            "geometry": data.get("geometry", []),
        })

    comps = get_components_info(G)
    healed_count = sum(1 for _, _, d in G.edges(data=True) if d.get("healed"))

    return {
        "nodes": nodes_out,
        "edges": edges_out,
        "stats": {
            "node_count":        G.number_of_nodes(),
            "edge_count":        G.number_of_edges(),
            "healed_edge_count": healed_count,
            "component_count":   len(comps),
            "components":        comps,
            "base_efficiency":   round(mgr.get_base_efficiency(ds_id), 6),
        },
        "image_size": meta.get("image_size", {"w": 512, "h": 512}),
        "pngs": meta.get("pngs", {}),
        "folder": meta.get("folder", ds_id),
    }


@app.get("/api/datasets/{ds_id}/criticality")
def get_criticality(ds_id: str):
    meta, G = _require(ds_id)
    centrality = mgr.get_centrality(ds_id)
    norm_c = _norm_centrality(centrality)
    top = get_top_gatekeepers(centrality, n=10)
    return {
        "centrality":      {str(k): round(v, 6) for k, v in centrality.items()},
        "centrality_norm": {str(k): round(v, 4) for k, v in norm_c.items()},
        "top_gatekeepers": top,
        "base_efficiency": round(mgr.get_base_efficiency(ds_id), 6),
    }


@app.post("/api/datasets/{ds_id}/ablate")
def ablate(ds_id: str, req: AblateRequest):
    _, G = _require(ds_id)
    return ablate_nodes(G, req.disabled_node_ids)


@app.get("/api/datasets/{ds_id}/route")
def get_route(
    ds_id: str,
    start: int = Query(...),
    end: int = Query(...),
    disabled: str = Query(""),
):
    _, G = _require(ds_id)
    disabled_ids = []
    if disabled:
        try:
            disabled_ids = [int(x) for x in disabled.split(",") if x.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid disabled node ids")
    result = shortest_path(G, start, end, disabled_ids)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/api/health")
def health():
    return {"status": "ok", "datasets": len(mgr.list_datasets())}


# ── Static files — serve dataset images ─────────────────────────────────────
# Must be AFTER all /api routes to avoid shadowing them.
if DATA_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(DATA_DIR)), name="static")
