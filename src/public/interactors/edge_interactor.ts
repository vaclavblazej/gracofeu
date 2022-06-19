
import { Interactor, DOWN_TYPE } from './interactor'
import { draw, draw_line, draw_circle, draw_vertex } from '../draw';
import { socket } from '../socket';
import { view } from '../camera';
import { Coord, local_graph } from '../local_graph';


// INTERACTOR EDGE

var index_last_created_vertex = null; // est ce qu'on peut pas intégrer ça dans interactor_edge directement ?


export var interactor_edge = new Interactor("edge", "e", "edition.svg");

interactor_edge.mousedown = ((d, k, canvas, ctx, g, e) => {
    if (d == DOWN_TYPE.EMPTY) {
        view.is_link_creating = true;

        const mouse_server_coord = view.serverCoord(e);
        const pos = mouse_server_coord;
        g.align_position(pos, mouse_server_coord, new Set());

        view.link_creating_start = view.canvasCoord(pos);
        view.link_creating_end = view.canvasCoord(pos);
        socket.emit("add_vertex", pos.x, pos.y, (response) => { index_last_created_vertex = response });
    }
    if (d === DOWN_TYPE.VERTEX) {
        let vertex = g.vertices.get(interactor_edge.last_down_index);
        view.is_link_creating = true;
        view.link_creating_start = view.canvasCoord(vertex.pos);
        view.link_creating_end = new Coord(e.pageX, e.pageY);
    }
})

interactor_edge.mousemove = ((canvas, ctx, g, e) => {
    if (interactor_edge.last_down == DOWN_TYPE.EMPTY) {
        const mouse_server_coord = view.serverCoord(e);
        g.align_position(mouse_server_coord, mouse_server_coord, new Set());
        view.link_creating_end = view.canvasCoord(mouse_server_coord);
        draw(canvas, ctx, local_graph);
        return false;
    } else if (interactor_edge.last_down == DOWN_TYPE.VERTEX) {
        const mouse_server_coord = view.serverCoord(e);
        g.align_position(mouse_server_coord, mouse_server_coord, new Set());
        view.link_creating_end = view.canvasCoord(mouse_server_coord);
        draw(canvas, ctx, local_graph);
        return false;
    }
    return false;
})

interactor_edge.mouseup = ((canvas, ctx, g, e) => {
    view.is_link_creating = false;
    if (interactor_edge.last_down == DOWN_TYPE.VERTEX) {
        let index = g.get_vertex_index_nearby(view.serverCoord(e));
        if (index !== null && interactor_edge.last_down_index != index) { // there is a vertex nearby and it is not the previous one
            socket.emit("add_link", interactor_edge.last_down_index, index, "undirected");
        } else {

            if (interactor_edge.last_down_index !== index) { // We check if we are not creating a vertex on another one
                let save_last_down_index = interactor_edge.last_down_index; // see not below
                const mouse_server_coord = view.serverCoord(e);
                g.align_position(mouse_server_coord, mouse_server_coord, new Set());
                socket.emit("add_vertex", mouse_server_coord.x, mouse_server_coord.y, (response) => {
                    socket.emit("add_link", save_last_down_index, response, "undirected");
                    // we cant do socket.emit("add_edge", interactor_edge.last_down_index, response);
                    // because before the callback, interactor_edge.last_down_index will changed (and set to null)
                });
            }
        }
    } else if (interactor_edge.last_down === DOWN_TYPE.EMPTY) {
        let index = g.get_vertex_index_nearby(view.serverCoord(e));
        if (index !== null && index != index_last_created_vertex) {
            socket.emit("add_link", index_last_created_vertex, index, "undirected");
        } else {
            if (index_last_created_vertex !== index) { // We check if we are not creating another vertex where we created the one with the mousedown 
                const mouse_server_coord = view.serverCoord(e);
                g.align_position(mouse_server_coord, mouse_server_coord, new Set());
                socket.emit("add_vertex", mouse_server_coord.x, mouse_server_coord.y, (response) => {
                    socket.emit("add_link", index_last_created_vertex, response, "undirected");
                });

            }
        }
    }

})