import { Coord } from "./coord";

export enum ORIENTATION {
    UNDIRECTED = "UNDIRECTED",
    DIRECTED = "DIRECTED",
    DIGON = "DIGON"
}


export class Link {
    start_vertex: number;
    end_vertex: number;
    cp: Coord; // control point
    orientation: ORIENTATION;
    color: string;

    constructor(i: number, j: number, cp: Coord, orientation: ORIENTATION, color: string) {
        this.start_vertex = i;
        this.end_vertex = j;
        this.cp = cp;
        this.orientation = orientation;
        this.color = color;
    }


}

