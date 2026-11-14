from collections import defaultdict, deque
from app.schemas import TransactionRequest

# receiver_vpa -> deque of (timestamp, sender_vpa, amount, txn_id)
INBOUND_EDGES: dict[str, deque] = defaultdict(deque)
# sender_vpa -> deque of (timestamp, receiver_vpa, amount, txn_id)
OUTBOUND_EDGES: dict[str, deque] = defaultdict(deque)
# Last 150 edges for the UI graph
RECENT_GRAPH_EDGES: deque = deque(maxlen=150)

def reset_graph_state() -> None:
    INBOUND_EDGES.clear()
    OUTBOUND_EDGES.clear()
    RECENT_GRAPH_EDGES.clear()

def analyze_and_record_edge(txn: TransactionRequest) -> dict:
    now = txn.timestamp
    sender = txn.sender_vpa
    receiver = txn.receiver_vpa

    # 1. Evict inbound edges to `receiver` older than 5 minutes (300s) for Fan-In
    in_q = INBOUND_EDGES[receiver]
    while in_q and (now - in_q[0][0]).total_seconds() > 300:
        in_q.popleft()

    # 2. Evict inbound edges to `sender` older than 60 seconds for Rapid Hop (A -> B -> C)
    sender_in_q = INBOUND_EDGES[sender]
    while sender_in_q and (now - sender_in_q[0][0]).total_seconds() > 60:
        sender_in_q.popleft()

    # Record current edge
    in_q.append((now, sender, txn.amount, txn.txn_id))
    OUTBOUND_EDGES[sender].append((now, receiver, txn.amount, txn.txn_id))

    # Fan-In: 4+ distinct senders to `receiver` within 5 minutes
    distinct_senders = {s for _, s, _, _ in in_q}
    is_fan_in = len(distinct_senders) >= 4

    # Hop: `sender` received funds within the last 60s and is now forwarding them
    is_hop_chain = len(sender_in_q) > 0
    hop_origin = sender_in_q[-1][1] if is_hop_chain else None

    edge_record = {
        "txn_id": txn.txn_id,
        "source": sender,
        "target": receiver,
        "amount": txn.amount,
        "timestamp": now.isoformat(),
        "is_flagged": is_fan_in or is_hop_chain,
        "flag_type": "HOP_CHAIN" if is_hop_chain else ("FAN_IN" if is_fan_in else "NORMAL"),
        "hop_origin": hop_origin,
    }
    RECENT_GRAPH_EDGES.append(edge_record)

    return {
        "is_fan_in": is_fan_in,
        "fan_in_count": len(distinct_senders),
        "is_hop_chain": is_hop_chain,
        "hop_origin": hop_origin,
    }

def get_graph_snapshot() -> dict:
    nodes_map = {}
    edges = list(RECENT_GRAPH_EDGES)
    for e in edges:
        for vpa in (e["source"], e["target"]):
            if vpa not in nodes_map:
                nodes_map[vpa] = {"id": vpa, "is_flagged": False}
            if e["is_flagged"]:
                nodes_map[vpa]["is_flagged"] = True
    return {"nodes": list(nodes_map.values()), "edges": edges}