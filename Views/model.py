class SimpleNode:
    def __init__(self, name, x=0, y=0, width=150, height=30):
        self.name = name
        self.x = x
        self.y = y
        self.width = width
        self.height = height

class SimpleEdge:
    def __init__(self, source: 'SimpleNode', target: 'SimpleNode', name=None):
        self.source = source
        self.target = target
        self.name = name

class SimpleGraph:
    def __init__(self):
        self.nodes = []
        self.edges = []

    def to_dict(self):
        return {
            "nodes": [
                {
                    "name": n.name,
                    "x": n.x,
                    "y": n.y,
                    "width": n.width,
                    "height": n.height
                } for n in self.nodes
            ],
            "edges": [
                {
                    "source": self.nodes.index(e.source),
                    "target": self.nodes.index(e.target),
                    "name": e.name
                } for e in self.edges
            ]
        }

    @classmethod
    def from_dict(cls, data):
        graph = cls()
        for node_data in data["nodes"]:
            node = SimpleNode(
                name=node_data["name"],
                x=node_data["x"],
                y=node_data["y"],
                width=node_data["width"],
                height=node_data["height"]
            )
            graph.nodes.append(node)
        for edge_data in data["edges"]:
            source = graph.nodes[edge_data["source"]]
            target = graph.nodes[edge_data["target"]]
            edge = SimpleEdge(source, target, name=edge_data["name"])
            graph.edges.append(edge)
        return graph