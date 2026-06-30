"""
analysis.py — NetworkX-based graph analysis: centrality, efficiency, ablation, routing.
"""

import networkx as nx
from typing import Optional


def largest_component(G: nx.Graph) -> nx.Graph:
    comps = list(nx.connected_components(G))
    if not comps:
        return G
    biggest = max(comps, key=len)
    return G.subgraph(biggest).copy()


def compute_betweenness(G: nx.Graph) -> dict[int, float]:
    """
    Compute weighted betweenness centrality on the largest connected component.
    Nodes outside the LCC receive 0.
    """
    lcc = largest_component(G)
    if len(lcc) < 2:
        return {n: 0.0 for n in G.nodes()}

    bc = nx.betweenness_centrality(lcc, weight="weight", normalized=True)

    # Assign 0 to nodes not in the LCC
    result = {n: 0.0 for n in G.nodes()}
    result.update(bc)
    return result


def compute_global_efficiency(G: nx.Graph) -> float:
    """
    Global efficiency = mean of 1/d(u,v) over all reachable pairs.
    Handles disconnected graphs by skipping unreachable pairs.
    """
    n = G.number_of_nodes()
    if n < 2:
        return 0.0

    total = 0.0
    count = 0
    for source in G.nodes():
        lengths = nx.single_source_dijkstra_path_length(G, source, weight="weight")
        for target, d in lengths.items():
            if target != source and d > 0:
                total += 1.0 / d
                count += 1

    return total / (n * (n - 1)) if count > 0 else 0.0


def ablate_nodes(G: nx.Graph, disabled_ids: list[int]) -> dict:
    """
    Remove disabled nodes, recompute efficiency, return stats.
    """
    eff_before = compute_global_efficiency(G)

    G2 = G.copy()
    actually_removed = [nid for nid in disabled_ids if G2.has_node(nid)]
    G2.remove_nodes_from(actually_removed)

    eff_after = compute_global_efficiency(G2)
    resilience = (eff_after / eff_before) if eff_before > 0 else 1.0
    pct_drop = (1.0 - resilience) * 100.0

    # Which nodes are now disconnected from the LCC?
    disconnected = []
    if G2.number_of_nodes() > 0:
        comps = list(nx.connected_components(G2))
        if comps:
            biggest = max(comps, key=len)
            disconnected = [n for n in G2.nodes() if n not in biggest]

    return {
        "efficiency_before": round(eff_before, 6),
        "efficiency_after": round(eff_after, 6),
        "resilience_index": round(resilience, 6),
        "pct_drop": round(pct_drop, 2),
        "disconnected_nodes": disconnected,
        "removed_nodes": actually_removed,
    }


def shortest_path(
    G: nx.Graph,
    start: int,
    end: int,
    disabled_ids: Optional[list[int]] = None,
) -> dict:
    """
    Find shortest weighted path from start to end, avoiding disabled nodes.
    Returns node sequence, total length, and ordered edge keys.
    """
    disabled = set(disabled_ids or [])
    working = G.copy()
    working.remove_nodes_from([n for n in disabled if working.has_node(n)])

    if not working.has_node(start):
        return {"error": f"Start node {start} is disabled or missing"}
    if not working.has_node(end):
        return {"error": f"End node {end} is disabled or missing"}
    if not nx.has_path(working, start, end):
        return {"error": f"No path exists between {start} and {end} (network may be disconnected)"}

    path_nodes = nx.shortest_path(working, start, end, weight="weight")
    total_length = nx.shortest_path_length(working, start, end, weight="weight")

    # Collect edge info along path
    path_edges = []
    for i in range(len(path_nodes) - 1):
        u, v = path_nodes[i], path_nodes[i + 1]
        edata = working[u][v]
        path_edges.append({
            "u": u,
            "v": v,
            "length": edata.get("length", 0),
            "geometry": edata.get("geometry", []),
        })

    return {
        "nodes": path_nodes,
        "edges": path_edges,
        "total_length": round(total_length, 2),
    }


def get_top_gatekeepers(centrality: dict[int, float], n: int = 10) -> list[dict]:
    sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)
    return [{"id": nid, "centrality": round(score, 6)} for nid, score in sorted_nodes[:n]]


def get_components_info(G: nx.Graph) -> list[dict]:
    comps = list(nx.connected_components(G))
    result = []
    for i, comp in enumerate(sorted(comps, key=len, reverse=True)):
        result.append({"component_id": i, "size": len(comp), "nodes": list(comp)})
    return result
