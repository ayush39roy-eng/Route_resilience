"""
graph_loader.py — Build a NetworkX graph from node/edge lists.

Handles: non-contiguous node IDs, disconnected components, missing geometry
(falls back to a straight line between node positions).
"""

import math
import networkx as nx


def build_graph(nodes: list, edges: list) -> nx.Graph:
    G = nx.Graph()

    for n in nodes:
        G.add_node(
            n["id"],
            row=n["row"],
            col=n["col"],
            pos=(n["col"], n["row"]),   # (x, y) = (col, row)
            node_type=n.get("type", "junction"),
            degree=n.get("degree", 0),
        )

    # Build a quick id→node lookup for geometry fallback
    node_map = {n["id"]: n for n in nodes}

    for e in edges:
        geom = e.get("geometry")
        if not geom:
            u_node = node_map.get(e["u"])
            v_node = node_map.get(e["v"])
            if u_node and v_node:
                geom = [[u_node["row"], u_node["col"]],
                        [v_node["row"], v_node["col"]]]

        G.add_edge(
            e["u"], e["v"],
            key=e.get("key", 0),
            length=float(e.get("length", 1.0)),
            weight=float(e.get("length", 1.0)),
            healed=bool(e.get("healed", False)),
            geometry=geom or [],
        )

    return G
