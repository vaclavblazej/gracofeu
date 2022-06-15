import { DOWN_TYPE } from "./interactors/interactor";

export class Coord {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    sub(c: Coord) {
        return new Coord(this.x - c.x, this.y - c.y);
    }

    add(c: Coord) {
        return new Coord(this.x + c.x, this.y + c.y);
    }

    dist2(pos: Coord) {
        return (this.x - pos.x) ** 2 + (this.y - pos.y) ** 2;
    }

    is_nearby(pos: Coord, r: number) {
        return this.dist2(pos) <= r;
    }

    getTheta(v: Coord) {
        let angle1 = Math.atan2(this.x, this.y);
        let angle2 = Math.atan2(v.x, v.y);
        return angle2 - angle1;
    }

    norm2() {
        return this.x ** 2 + this.y ** 2;
    }

    getRho(v: Coord) {
        let d1 = this.norm2();
        let d2 = v.norm2();
        return Math.sqrt(d2 / d1);
    }
}



export class LocalVertex {
    pos: Coord;
    old_pos: Coord;
    is_selected: boolean;

    constructor(pos: Coord) {
        this.pos = new Coord(pos.x, pos.y); // this.pos = pos; does not copy the methods of Coord ...
        this.old_pos = new Coord(pos.x, pos.y);
        this.is_selected = false;
    }

    save_pos(){
        this.old_pos.x = this.pos.x;
        this.old_pos.y = this.pos.y;
    }


    dist2(x: number, y: number) {
        return (this.pos.x - x) ** 2 + (this.pos.y - y) ** 2
    }


    is_nearby(pos: Coord, r: number) {
        return this.pos.dist2(pos) <= r;
    }

    is_in_rect(c1: Coord, c2: Coord) {
        if (c1.x <= c2.x && c1.y <= c2.y) {
            return (c1.x <= this.pos.x && this.pos.x <= c2.x && c1.y <= this.pos.y && this.pos.y <= c2.y)
        } else if (c1.x <= c2.x && c2.y <= c1.y) {
            return (c1.x <= this.pos.x && this.pos.x <= c2.x && c2.y <= this.pos.y && this.pos.y <= c1.y)
        } else if (c2.x <= c1.x && c2.y <= c1.y) {
            return (c2.x <= this.pos.x && this.pos.x <= c1.x && c2.y <= this.pos.y && this.pos.y <= c1.y)
        } else if (c2.x <= c1.x && c1.y <= c2.y) {
            return (c2.x <= this.pos.x && this.pos.x <= c1.x && c1.y <= this.pos.y && this.pos.y <= c2.y)
        }
    }
}








export class Edge {
    start_vertex: number;
    end_vertex: number;
    cp: Coord;
    old_cp: Coord;
    is_selected: boolean;

    constructor(i: number, j: number, cp: Coord) {
        this.start_vertex = i;
        this.end_vertex = j;
        this.is_selected = false;
        this.cp = new Coord(cp.x, cp.y);
        this.old_cp = new Coord(cp.x, cp.y);
    }

    is_in_rect(c1: Coord, c2: Coord) {
        //V1: is in rect if one of its extremities is in the rectangle
        //TODO: be more clever and select also when there is an intersection between the edge and the rectangle

        return local_graph.vertices.get(this.start_vertex).is_in_rect(c1, c2) || local_graph.vertices.get(this.end_vertex).is_in_rect(c1, c2);
    }

    is_nearby(x: number, y: number, r: number) {
        // TODO: bend edges
        const start = local_graph.vertices.get(this.start_vertex);
        const end = local_graph.vertices.get(this.end_vertex);
        const x1 = start.pos.x;
        const y1 = start.pos.y;
        const x2 = end.pos.x;
        const y2 = end.pos.y;

        const den = start.dist2(x2, y2);
        if (den == 0) {
            return true;
        }
        const num = Math.abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1))

        return (num / den) < r;
    }

    transform_control_point(moved_vertex: LocalVertex, fixed_vertex: LocalVertex) {
        var v = moved_vertex
        var w = fixed_vertex.pos
        let u = v.old_pos.sub(w);
        let nv = v.pos.sub(w);
        var theta = nv.getTheta(u)
        var rho = u.getRho(nv)
        this.cp.x = w.x + rho * (Math.cos(theta) * (this.old_cp.x - w.x) - Math.sin(theta) * (this.old_cp.y - w.y))
        this.cp.y = w.y + rho * (Math.sin(theta) * (this.old_cp.x - w.x) + Math.cos(theta) * (this.old_cp.y - w.y))
    }

    save_pos(){
        this.old_cp.x = this.cp.x;
        this.old_cp.y = this.cp.y;
    }
}

export class Graph {
    vertices: Map<number, LocalVertex>;
    edges: Map<number, Edge>;

    constructor() {
        this.vertices = new Map();
        this.edges = new Map();
    }


    deselect_all_vertices() {
        this.vertices.forEach(vertex => {
            vertex.is_selected = false;
        });
    }

    deselect_all_edges() {
        this.edges.forEach(edge => {
            edge.is_selected = false;
        });
    }

    clear_all_selections() {
        this.deselect_all_vertices();
        this.deselect_all_edges();
    }

    get_element_nearby(pos: Coord) {
        for (const [index, v] of this.vertices.entries()) {
            if (v.pos.is_nearby(pos, 150)) {
                return { type: DOWN_TYPE.VERTEX, index: index };
            }
        }

        for (const [index, edge] of this.edges.entries()) {
            if (edge.cp.is_nearby(pos, 150)) {
                return { type: DOWN_TYPE.CONTROL_POINT, index: index };
            }
            if (edge.is_nearby(pos.x, pos.y, 0.2)) {
                return { type: DOWN_TYPE.EDGE, index: index };
            }
        }

        return { type: DOWN_TYPE.EMPTY, index: null };
    }

    get_vertex_index_nearby(x: number, y: number) {
        for (let index of this.vertices.keys()) {
            let v = this.vertices.get(index);
            if (v.is_nearby(new Coord(x, y), 150)) {
                return index;
            }
        }
        return null;
    }

    get_edge_index_nearby(x: number, y: number) {
        for (let index of this.edges.keys()) {
            let e = this.edges.get(index);
            if (e.is_nearby(x, y, 0.015)) {
                return index;
            }
        }
        return null;
    }

    select_vertices_in_rect(corner1: Coord, corner2: Coord, cam: Coord) {
        for (const vertex of this.vertices.values()) {
            if (vertex.is_in_rect(corner1.sub(cam), corner2.sub(cam))) {
                vertex.is_selected = true;
            }
        }
    }

    select_edges_in_rect(corner1: Coord, corner2: Coord, cam: Coord) {
        for (const index of this.edges.keys()) {
            const edge = this.edges.get(index);
            if (edge.is_in_rect(corner1.sub(cam), corner2.sub(cam))) {
                edge.is_selected = true;
            }
        }
    }

}


export const local_graph = new Graph();