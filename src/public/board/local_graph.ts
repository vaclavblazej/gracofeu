// TODO virer l'utilisation de local_board

import { Area, AREA_CORNER, AREA_SIDE } from "./area";
import { INDEX_TYPE } from "./camera";
import { CanvasCoord, ServerCoord } from "./coord";
import { DOWN_TYPE } from "../interactors/interactor";
import { Stroke } from "./stroke";
import { local_board } from "../setup";



export class LocalVertex {
    // server attributes:
    pos: ServerCoord;
    color: string;

    // local attributes:
    is_selected: boolean;
    old_pos: ServerCoord;
    index_string: string;
    canvas_pos: CanvasCoord;

    constructor(pos: ServerCoord) {
        this.pos = new ServerCoord(pos.x, pos.y); // this.pos = pos; does not copy the methods of Coord ...
        this.old_pos = new ServerCoord(pos.x, pos.y);
        this.is_selected = false;
        this.index_string = "";
        this.color = "black";
        this.canvas_pos = local_board.view.canvasCoord(pos);
    }

    save_pos() {
        this.old_pos.x = this.pos.x;
        this.old_pos.y = this.pos.y;
    }


    is_nearby(pos: CanvasCoord, r: number) {
        return this.canvas_pos.dist2(pos) <= r;
    }

    is_in_rect(c1: CanvasCoord, c2: CanvasCoord) {
        const canvas_pos = this.canvas_pos;
        if (c1.x <= c2.x && c1.y <= c2.y) {
            return (c1.x <= canvas_pos.x && canvas_pos.x <= c2.x && c1.y <= canvas_pos.y && canvas_pos.y <= c2.y)
        } else if (c1.x <= c2.x && c2.y <= c1.y) {
            return (c1.x <= canvas_pos.x && canvas_pos.x <= c2.x && c2.y <= canvas_pos.y && canvas_pos.y <= c1.y)
        } else if (c2.x <= c1.x && c2.y <= c1.y) {
            return (c2.x <= canvas_pos.x && canvas_pos.x <= c1.x && c2.y <= canvas_pos.y && canvas_pos.y <= c1.y)
        } else if (c2.x <= c1.x && c1.y <= c2.y) {
            return (c2.x <= canvas_pos.x && canvas_pos.x <= c1.x && c1.y <= canvas_pos.y && canvas_pos.y <= c2.y)
        }
    }

    get_tikz_coordinate(index: number) {
        return `v${index}`;
    }
    tikzify_coordinate(index: number) {
        return `\\coordinate (${this.get_tikz_coordinate(index)}) at (${Math.round(this.pos.x)/100}, ${Math.round(this.pos.y)/100});`;
    }

    tikzify_node(index: number) {
        // const c = "c" + COLORS.indexOf(this.color);
        // if (this.color == DEFAULT_COLOR) {
        //   c = "white";
        // }

        return `\\node[scale = \\scaleV, nodes={white}{}{}{}] at  (${this.get_tikz_coordinate(index)})  {};`;
    }

    tikzify_label() {
        // TODO
        let labelCode = "";
        // https://tex.stackexchange.com/questions/58878/tikz-set-node-label-position-more-precisely
        // shift={(1,0.3)} COMMENT 2

        // labelCode = "\\node[shift={(" + round(this.label.getExactLabelOffsetX() * 10) / 1000 + "," + -round(this.label.getExactLabelOffsetY() * 10) / 1000 + ")}, scale=\\scaleV] at  (v" + Vertices.indexOf(this) + ") {" + this.label.text + "};";

        return labelCode;
    }

}





export enum ORIENTATION {
    UNDIRECTED,
    DIRECTED,
    DIGON
}


export class Link {
    // Server properties
    start_vertex: number;
    end_vertex: number;
    cp: ServerCoord;
    orientation: ORIENTATION;
    color: string;

    // local attributes
    old_cp: ServerCoord;
    is_selected: boolean;
    canvas_cp: CanvasCoord;


    constructor(i: number, j: number, cp: ServerCoord, orientation: ORIENTATION, color: string) {
        this.start_vertex = i;
        this.end_vertex = j;
        this.color = color;
        this.is_selected = false;
        this.cp = new ServerCoord(cp.x, cp.y);
        this.old_cp = new ServerCoord(cp.x, cp.y);
        this.orientation = orientation;
        this.canvas_cp = local_board.view.canvasCoord(this.cp)
    }

    is_in_rect(c1: CanvasCoord, c2: CanvasCoord) {
        //V1: is in rect if one of its extremities is in the rectangle
        //TODO: be more clever and select also when there is an intersection between the edge and the rectangle

        return local_board.graph.vertices.get(this.start_vertex).is_in_rect(c1, c2) || local_board.graph.vertices.get(this.end_vertex).is_in_rect(c1, c2);
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
        this.canvas_cp = local_board.view.canvasCoord(this.cp);
    }

    save_pos() {
        this.old_cp.x = this.cp.x;
        this.old_cp.y = this.cp.y;
    }

    tikzify_link(start: LocalVertex, start_index: number, end: LocalVertex, end_index: number) {
        // TODO: ORIENTED CASE
        let labelCode = "";
        // if (showLabels)
        // labelCode = "node[midway, shift={(" + this.label.getExactLabelOffsetX() / 100 + "," + -this.label.getExactLabelOffsetY() / 100 + ")}, scale = \\scaleE] {" + this.label.text + "}";

        return `\\draw[line width = \\scaleE, color = black] (${start.get_tikz_coordinate(start_index)}) .. controls (${Math.round(this.cp.x)/100}, ${Math.round(this.cp.y)/100}) .. (${end.get_tikz_coordinate(end_index)}) ${labelCode};`;

    }


}

export class Graph {
    vertices: Map<number, LocalVertex>;
    links: Map<number, Link>;
    strokes: Map<number, Stroke>;
    areas: Map<number, Area>;

    constructor() {
        this.vertices = new Map();
        this.links = new Map();
        this.strokes = new Map();
        this.areas = new Map();
    }


    get_neighbors_list(i: number) {
        let neighbors = new Array<number>();
        for (let e of this.links.values()) {
            if (e.orientation == ORIENTATION.UNDIRECTED) {
                if (e.start_vertex == i) {
                    neighbors.push(e.end_vertex);
                } else if (e.end_vertex == i) {
                    neighbors.push(e.start_vertex);
                }
            }
        }
        return neighbors;
    }


    deselect_all_vertices() {
        this.vertices.forEach(vertex => {
            vertex.is_selected = false;
        });
    }

    deselect_all_links() {
        this.links.forEach(link => {
            link.is_selected = false;
        });
    } 
    
    deselect_all_strokes() {
        this.strokes.forEach(s => {
            s.is_selected = false;
        });
    }

    clear_all_selections() {
        this.deselect_all_vertices();
        this.deselect_all_links();
        this.deselect_all_strokes();
    }

    get_element_nearby(pos: CanvasCoord, interactable_element_type: Set<DOWN_TYPE>) {
        if (interactable_element_type.has(DOWN_TYPE.VERTEX)) {
            for (const [index, v] of this.vertices.entries()) {
                if (v.is_nearby(pos, 150)) {
                    return { type: DOWN_TYPE.VERTEX, index: index };
                }
            }
        }
       
        for (const [index, link] of this.links.entries()) {
            if (interactable_element_type.has(DOWN_TYPE.CONTROL_POINT) && link.canvas_cp.is_nearby(pos, 150)) {
                return { type: DOWN_TYPE.CONTROL_POINT, index: index };
            }
            if (interactable_element_type.has(DOWN_TYPE.LINK) && this.is_click_over_link(index, pos)) {
                return { type: DOWN_TYPE.LINK, index: index };
            }
        }

        for(const [index,a] of this.areas.entries()){
            if(interactable_element_type.has(DOWN_TYPE.AREA) && a.is_nearby(pos, 200)){
                return{ type: DOWN_TYPE.AREA, index: index };
            }
            const corner_index = a.is_nearby_corner(pos);
            console.log("CORNER INDEX", corner_index, corner_index!=0);
            if(interactable_element_type.has(DOWN_TYPE.AREA_CORNER) && corner_index != AREA_CORNER.NONE){
                return{ type: DOWN_TYPE.AREA_CORNER, index: index, corner: corner_index };
            }

            const side_index = a.is_nearby_side(pos, 5);
            if(interactable_element_type.has(DOWN_TYPE.AREA_SIDE) && side_index != AREA_SIDE.NONE){
                 return{ type: DOWN_TYPE.AREA_SIDE, index: index, side: side_index };
             }
        }

        if (interactable_element_type.has(DOWN_TYPE.STROKE)) {
            for(const [index,s] of this.strokes.entries()){
                if(s.is_nearby(pos, 150)){     
                    return { type: DOWN_TYPE.STROKE, index: index };
                }
            }
        }

        return { type: DOWN_TYPE.EMPTY, index: null };
    }

    get_vertex_index_nearby(pos: CanvasCoord) {
        for (let index of this.vertices.keys()) {
            let v = this.vertices.get(index);
            if (v.is_nearby(pos, 150)) {
                return index;
            }
        }
        return null;
    }


    select_vertices_in_rect(corner1: CanvasCoord, corner2: CanvasCoord) {
        for (const vertex of this.vertices.values()) {
            if (vertex.is_in_rect(corner1, corner2)) {
                vertex.is_selected = true;
            }
        }
    }

    select_links_in_rect(corner1: CanvasCoord, corner2: CanvasCoord) {
        for (const index of this.links.keys()) {
            const link = this.links.get(index);
            if (link.is_in_rect(corner1, corner2)) {
                link.is_selected = true;
            }
        }
    }

    is_click_over_link(link_index: number, e: CanvasCoord) {

        let xA = e.x - 5
        let yA = e.y - 5
        let xB = e.x + 5
        let yB = e.y + 5

        let minX = xA
        let minY = yA
        let maxX = xB
        let maxY = yB

        const link = this.links.get(link_index);
        const v = this.vertices.get(link.start_vertex)
        const w = this.vertices.get(link.end_vertex)
        const linkcp_canvas = local_board.view.canvasCoord(link.cp);
        const v_canvas_pos = v.canvas_pos;
        const w_canvas_pos = w.canvas_pos

        let x0 = v_canvas_pos.x;
        let y0 = v_canvas_pos.y;
        let x1 = linkcp_canvas.x;
        let y1 = linkcp_canvas.y;
        let x2 = w_canvas_pos.x;
        let y2 = w_canvas_pos.y;


        // case where one of the endvertices is already on the box
        if (v.is_in_rect(new CanvasCoord(xA, yA), new CanvasCoord(xB, yB)) || w.is_in_rect(new CanvasCoord(xA, yA), new CanvasCoord(xB, yB))) {
            return true
        } else {
            // we get the quadratic equation of the intersection of the bended edge and the sides of the box
            let aX = (x2 + x0 - 2 * x1);
            let bX = 2 * (x1 - x0);
            let cXmin = x0 - minX;
            let cXmax = x0 - maxX;

            let aY = (y2 + y0 - 2 * y1);
            let bY = 2 * (y1 - y0);
            let cYmin = y0 - minY;
            let cYmax = y0 - maxY;

            // the candidates for the intersections
            let tXmin = solutionQuadratic(aX, bX, cXmin);
            let tXmax = solutionQuadratic(aX, bX, cXmax);
            let tYmin = solutionQuadratic(aY, bY, cYmin);
            let tYmax = solutionQuadratic(aY, bY, cYmax);


            for (let t of tXmax.concat(tXmin)) { // we look for the candidates that are touching vertical sides
                if (t >= 0 && t <= 1) {
                    let y = bezierValue(t, y0, y1, y2);
                    if ((minY <= y && y <= maxY)) { // the candidate touches the box
                        return true;
                    }
                }
            }

            for (let t of tYmax.concat(tYmin)) {
                if (t >= 0 && t <= 1) {
                    let x = bezierValue(t, x0, x1, x2);
                    if ((minX <= x && x <= maxX)) {
                        return true;
                    }
                }
            }

        }
        return false;
    }

    compute_vertices_index_string() {
        const letters = "abcdefghijklmnopqrstuvwxyz";
        this.vertices.forEach((vertex, index) => {
            if (local_board.view.index_type == INDEX_TYPE.NONE) {
                vertex.index_string = "";
            } else if (local_board.view.index_type == INDEX_TYPE.NUMBER_STABLE) {
                vertex.index_string = "v" + String(index)
            } else if (local_board.view.index_type == INDEX_TYPE.ALPHA_STABLE) {
                vertex.index_string = letters.charAt(index % letters.length);
            }
            else if (local_board.view.index_type == INDEX_TYPE.NUMBER_UNSTABLE) {
                let counter = 0;
                for (const key of this.vertices.keys()) {
                    if (key < index) {
                        counter++;
                    }
                }
                vertex.index_string = "v" + String(counter)
            }
            else if (local_board.view.index_type == INDEX_TYPE.ALPHA_UNSTABLE) {
                let counter = 0;
                for (const key of this.vertices.keys()) {
                    if (key < index) {
                        counter++;
                    }
                }
                vertex.index_string = letters.charAt(counter % letters.length);
            }
        })
    }

    // align_position
    // return a CanvasCoord near mouse_canvas_coord which aligned on other vertices or on the grid
    align_position(pos_to_align: CanvasCoord, excluded_indices: Set<number>, canvas: HTMLCanvasElement) {
        const aligned_pos = new CanvasCoord(pos_to_align.x, pos_to_align.y);
        if (local_board.view.is_aligning) {
            local_board.view.alignement_horizontal = false;
            local_board.view.alignement_vertical = false;
            this.vertices.forEach((vertex, index) => {
                if (excluded_indices.has(index) == false) {
                    if (Math.abs(vertex.canvas_pos.y - pos_to_align.y) <= 15) {
                        aligned_pos.y = vertex.canvas_pos.y;
                        local_board.view.alignement_horizontal = true;
                        local_board.view.alignement_horizontal_y = local_board.view.canvasCoordY(vertex.pos.y);
                        return;
                    }
                    if (Math.abs(vertex.canvas_pos.x - pos_to_align.x) <= 15) {
                        aligned_pos.x = vertex.canvas_pos.x;
                        local_board.view.alignement_vertical = true;
                        local_board.view.alignement_vertical_x = local_board.view.canvasCoordX(vertex.pos.x);
                        return;
                    }
                }
            })
        }
        if (local_board.view.grid_show) {
            const grid_size = local_board.view.grid_size;
            for (let x = local_board.view.camera.x % grid_size; x < canvas.width; x += grid_size) {
                if (Math.abs(x - pos_to_align.x) <= 15) {
                    aligned_pos.x = x;
                    break;
                }
            }
            for (let y = local_board.view.camera.y % grid_size; y < canvas.height; y += grid_size) {
                if (Math.abs(y - pos_to_align.y) <= 15) {
                    aligned_pos.y = y;
                    break;
                }
            }
        }
        return aligned_pos;
    }

    get_selected_vertices(): Set<number> {
        const set = new Set<number>();
        this.vertices.forEach((v, index) => {
            if (v.is_selected) {
                set.add(index);
            }
        })
        return set;
    }

    update_canvas_pos() {
        for (const v of this.vertices.values()) {
            v.canvas_pos = local_board.view.canvasCoord(v.pos);
        }
        for (const link of this.links.values()) {
            link.canvas_cp = local_board.view.canvasCoord(link.cp)
        }
        // TODO when area and stroke will have canvas_pos
        /*
        for (const area of this.areas.values()){
            area.update_canvas_pos();
        }
        for( const stroke of this.strokes.values()){
            stroke.update_canvas_pos();
        }
        */
    }

    get_subgraph_from_area(area_index: number){
        const area = this.areas.get(area_index);
        const subgraph = new Graph();
        const c1canvas = local_board.view.canvasCoord(area.corner_top_left);
        const c2canvas = local_board.view.canvasCoord(area.corner_bottom_right);   

         for (const [index, v] of this.vertices.entries()) {
            if(v.is_in_rect(c1canvas, c2canvas)){
                subgraph.vertices.set(index, v);
            }
        }

        for (const [index, e] of this.links.entries()){
            const u = this.vertices.get(e.start_vertex);
            const v = this.vertices.get(e.end_vertex);

            if((u.is_in_rect(c1canvas, c2canvas)) && (v.is_in_rect(c1canvas, c2canvas))){
                subgraph.links.set(index, e);
            }
        }
        return subgraph;
    }

}




function solutionQuadratic(a: number, b: number, c: number) {
    if (b == 0 && a == 0) {
        return [];
    }

    if (a == 0) {
        return [-c / b];
    }

    let delta = b * b - 4 * a * c;
    if (delta > 0) {
        return [(-b + Math.sqrt(delta)) / (2 * a), (-b - Math.sqrt(delta)) / (2 * a)];
    }
    if (delta == 0) {
        return [-b / (2 * a)];
    }
    return [];
}



function bezierValue(t: number, p0: number, p1: number, p2: number) {
    return (1.0 - t) * (1.0 - t) * p0 + 2.0 * (1.0 - t) * t * p1 + t * t * p2;
    // return bezierPoint(p0, p1, p1, p2, t);
}



