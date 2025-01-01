import * as vNG from "v-network-graph";
import * as d3Force from 'd3-force';
import { ForceLayout, ForceEdgeDatum, ForceNodeDatum } from "v-network-graph/lib/force-layout";

enum ForceType {
    Edge = 'edge',
    Collide = 'collide'
}

function createSimulation(d3: typeof d3Force, nodes: ForceNodeDatum[], edges: ForceEdgeDatum[], keepActive: boolean) {
    const forceLink = d3.forceLink<ForceNodeDatum, ForceEdgeDatum>(edges).id((d: ForceNodeDatum) => d.id);
    const forceValue = 50;
    const simulation = d3
        .forceSimulation(nodes)
        .force(ForceType.Edge, forceLink.distance(forceValue))
        .force(ForceType.Collide, d3.forceCollide(forceValue).strength(0.2))
        .alphaMin(0.001);
    if (!keepActive) {
        const ticker = setInterval(() => {
            if (simulation.alpha() < simulation.alphaMin()) {
                simulation.force(ForceType.Edge, null).force(ForceType.Collide, null);
                clearInterval(ticker);
            }
        }, 50);
    }
    return simulation
}

export function createGraphConfig(keepActive: boolean) {
    return vNG.defineConfigs({
        node: {
            selectable: true,
            draggable: false,
            label: {
                directionAutoAdjustment: true,
                text: (n: vNG.Node) => n.name!.slice(0, 5)
            },
            hover: {
                color: '#F56C6C',
                radius: 20
            }
        },
        edge: {
            hover: {
                width: 2
            }
        },
        view: {
            layoutHandler: new ForceLayout({
                createSimulation: (d3, nodes, edges) => createSimulation(d3, nodes, edges, keepActive)
            })
        }
    });
}
