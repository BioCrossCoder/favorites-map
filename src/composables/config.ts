import * as vNG from "v-network-graph";
import * as d3Force from 'd3-force';
import { ForceLayout, ForceEdgeDatum, ForceNodeDatum } from "v-network-graph/lib/force-layout";

enum ForceType {
    Edge = 'edge',
    Collide = 'collide',
    Center = 'center'
}

function createSimulation(d3: typeof d3Force, nodes: ForceNodeDatum[], edges: ForceEdgeDatum[], center: string): d3Force.Simulation<ForceNodeDatum, undefined> {
    // [FixCenter]
    if (center) {
        for (const node of nodes) {
            if (node.id === center) {
                node.fx = 0;
                node.fy = 0;
                break;
            }
        }
    } // [/]
    // [BuildLayout]
    const forceLink = d3.forceLink<ForceNodeDatum, ForceEdgeDatum>(edges).id((d: ForceNodeDatum) => d.id);
    const largeForce = 30;
    const smallForce = 0.2;
    const simulation = d3
        .forceSimulation(nodes)
        .force(ForceType.Edge, forceLink.distance(largeForce).strength(smallForce))
        .force(ForceType.Collide, d3.forceCollide(largeForce).strength(smallForce))
        .force(ForceType.Center, d3.forceCenter(largeForce, largeForce))
        .alphaMin(0.001); // [/]
    // [FixLayout]
    const ticker = setInterval(() => {
        if (simulation.alpha() < simulation.alphaMin()) {
            simulation.force(ForceType.Edge, null).force(ForceType.Collide, null);
            clearInterval(ticker);
        }
    }, 50); // [/]
    return simulation
}

export function createGraphConfig(center: string) {
    return vNG.defineConfigs({
        node: {
            selectable: true,
            draggable: false,
            label: {
                directionAutoAdjustment: true,
                text: (n: vNG.Node) => n.name!.slice(0, 5)
            },
            normal: {
                radius: 10
            },
            hover: {
                color: '#F56C6C',
                radius: 12
            }
        },
        edge: {
            normal: {
                color: '#909399',
            },
            hover: {
                width: 2,
                color: '#909399'
            }
        },
        view: {
            layoutHandler: new ForceLayout({
                createSimulation: (d3, nodes, edges) => createSimulation(d3, nodes, edges, center),
            })
        }
    });
}
