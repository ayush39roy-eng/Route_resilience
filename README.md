# Route Resilience — Road Network Criticality Dashboard

Interactive dashboard for urban planners: visualize road network bottlenecks, simulate infrastructure failures, and quantify network resilience.

## Quick Start

### 1. Backend (Python + FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API starts at **http://localhost:8000**.

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Adding Your Data

Place your graph files in the `data/` folder:

```
data/
  nodes.json
  edges.json
```

If these files are absent, a synthetic 8×8 grid network is generated automatically so the app runs immediately.

### File formats

**`nodes.json`** — list of node objects:
```json
[
  {"id": 0, "row": 116.0, "col": 198.75, "type": "junction", "degree": 3},
  {"id": 18, "row": 0.0, "col": 321.0, "type": "endpoint", "degree": 1}
]
```

**`edges.json`** — list of edge objects:
```json
[
  {
    "u": 0, "v": 23, "key": 0, "length": 209.68, "healed": false,
    "geometry": [[115.0, 199.0], [114.0, 199.0], ...]
  }
]
```

Notes:
- Node IDs need not be contiguous — always matched by `id` field.
- `row`/`col` are pixel coordinates: `row` = y-axis (0 at top), `col` = x-axis.
- `geometry` is an ordered list of `[row, col]` points tracing the real road curve. Missing geometry falls back to a straight line.
- Disconnected graphs are handled gracefully; betweenness is computed on the largest connected component.

---

## Features

| Feature | Description |
|---|---|
| **Criticality heatmap** | Nodes colored by betweenness centrality (green → red) |
| **Click to disable** | Click any node to remove it; resilience index updates live |
| **Healed edge toggle** | Show/hide gap-healed edges (dashed cyan) |
| **Route planner** | Pick start + end → shortest path highlighted in orange |
| **Auto-reroute** | Disable a node on the path → rerouted path shown in red-orange |
| **Top Gatekeepers** | Sidebar ranks top 10 critical nodes; click to highlight |
| **Stats panel** | Live: efficiency, resilience index, % drop, component count |
| **Zoom + pan** | Scroll to zoom; alt+drag or middle-mouse to pan |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/graph` | All nodes + edges with centrality scores |
| GET | `/api/criticality` | Centrality scores + top gatekeepers |
| POST | `/api/ablate` | Body: `{"disabled_node_ids": [1,2,3]}` → resilience metrics |
| GET | `/api/route?start=X&end=Y&disabled=1,2` | Shortest path (respects disabled nodes) |
| GET | `/api/health` | Health check |

---

## Architecture

```
backend/
  main.py          # FastAPI app, CORS, endpoints
  graph_loader.py  # JSON → NetworkX graph builder (+ synthetic data generator)
  analysis.py      # Betweenness, efficiency, ablation, shortest-path functions
  requirements.txt

frontend/
  index.html
  src/
    main.jsx       # React entry
    App.jsx        # Root layout + header
    NetworkMap.jsx # SVG road map renderer (pan/zoom, edge geometry, node heatmap)
    Sidebar.jsx    # Stats, gatekeepers, route planner, toggles
    useGraphState.js # Central state: data fetching, interactions, ablation
    api.js         # Fetch wrappers for all backend endpoints
    colors.js      # Centrality color gradient + theme constants
  vite.config.js   # Dev proxy → backend:8000
  package.json
```
