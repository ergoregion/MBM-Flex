import numpy as np
import networkx as nx
import random
import matplotlib.pyplot as plt
from matplotlib import animation

seed = 13648  # Seed random number generators for reproducibility
G = nx.house_graph()
# explicitly set positions
pos = {0: (0, 0), 1: (1, 0), 2: (0, 1), 3: (1, 1), 4: (1,0.5)}

# find node near center (0.5,0.5)
dmin = 1
ncenter = 0
for n in pos:
    x, y = pos[n]
    d = (x - 0.5) ** 2 + (y - 0.5) ** 2
    if d < dmin:
        ncenter = n
        dmin = d

# color by path length from node near center
p = dict(nx.single_source_shortest_path_length(G, ncenter))
for item in p:
    p[item]=random.uniform(2, 10)


def _frame_update(index):
    ax.clear()
    for item in p:
        p[item]=p[item] + random.uniform(-2, 2.2)*0.3

    nx.draw_networkx_edges(G, pos, alpha=0.4, ax=ax)
    nx.draw_networkx_nodes(
        G,
        pos,
        nodelist=list(p.keys()),
        node_size=2000,
        node_color=list(p.values()),
        cmap=plt.cm.jet,
        vmin=0, 
        vmax=40,
        ax=ax
    )
    
    label_options = {"ec": "k", "fc": "white", "alpha": 0.4}
    nx.draw_networkx_labels(G, pos, font_size=14, bbox=label_options)
    return




fig = plt.figure()
plt.tight_layout()
ax = fig.add_subplot(111)
nx.draw_networkx_edges(G, pos, alpha=0.4, ax=ax)
paths=nx.draw_networkx_nodes(
    G,
    pos,
    nodelist=list(p.keys()),
    node_size=2000,
    node_color=list(p.values()),
    cmap=plt.cm.jet,
    vmin=0, 
    vmax=40,
    ax=ax
)


cbar = plt.colorbar(paths, ax=ax)
cbar.set_label('O3 concentration', loc='top')
ax.grid(False)
ax.set_axis_off()

ani = animation.FuncAnimation(
    fig,
    _frame_update,
    interval=5,
    cache_frame_data=False,
    frames=1000,
)
plt.show()
