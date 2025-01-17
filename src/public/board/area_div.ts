import { Area } from "./area";
import { center_canvas_on_rectangle } from "./camera";
import { CanvasCoord } from "./coord";
import { COLOR_BACKGROUND, draw } from "../draw";
import { Parametor } from "../parametors/parametor";
import { params_available, params_loaded, remove_loaded_param, update_parametor } from "../parametors/parametor_manager";
import { socket } from "../socket";
import { Board } from "./board";
import { LocalVertex } from "./vertex";
import { local_board } from "../setup";
import { params_available_turn_on_div } from "../parametors/div_parametor";



export function make_list_areas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, board: Board){
    const g = board.graph;
    const view = board.view;
    const list_area_DOM = document.getElementById("area_list_container");
    if(list_area_DOM){
        list_area_DOM.innerHTML = "";
        for(const a of g.areas.values()){
            const span_area = get_title_span_for_area(a);
            span_area.addEventListener("click", (e)=>{
                center_canvas_on_rectangle(view, view.canvasCoord(a.corner_top_left), view.canvasCoord(a.corner_bottom_right), canvas, g); // .canvas_pos est pas encore implémenté
                requestAnimationFrame(function () { 
                    draw(canvas, ctx, g) 
                });
                socket.emit("my_view", view.camera.x, view.camera.y, view.zoom);
            })
            list_area_DOM.appendChild(span_area);
        }
    }
}


export function init_parametor_div(param:Parametor, a:Area, board: Board):HTMLElement{
    const g = board.graph;
    const html_id =  param.get_parametor_html_id(a);
    const area_id = (a==null?null:a.id);
    const param_to_load = {parametor:param, html_id:html_id, area_id : area_id};
    
    let div_parametor = document.getElementById("param_" + html_id);
        
    if( div_parametor === null)
    {
        let nb_hidden_buttons = 1;
        if(!param.is_live){
            nb_hidden_buttons++;
        }
        if(param.has_info){
            nb_hidden_buttons++;
        }

        // Div for the parametor
        div_parametor = document.createElement("div");
        div_parametor.classList.add("parametor_printed", "inactive_parametor");
        div_parametor.id = "param_" + html_id;

        //Div for label and result
        let div_label_and_result = document.createElement("div");
        div_label_and_result.classList.add("param_name_result_container", `hiding_buttons-${nb_hidden_buttons}`);
        div_parametor.appendChild(div_label_and_result);


        // Span for label
        let span_name = document.createElement('span');
        span_name.classList.add("parametor_name");
        span_name.title = param.title;
        // if(a!== null){
        //     let span_area_name = a.get_span_for_area();
        //     div_parametor.appendChild(span_area_name);
        // }
        span_name.textContent = param.short_name + (param.is_boolean?"":":");
        div_label_and_result.appendChild(span_name);



        // Span for the result
        let span_result = document.createElement("span");
        span_result.id = "span_result_" + html_id;
        if(!param.is_boolean){
            span_result.textContent = "?";
        }
        span_result.title="Not computed yet. Click on the refresh icon to launch the computation."
        span_result.classList.add("result_span");
        if(param.is_boolean){
            span_result.classList.add("boolean_result", "inactive_boolean_result");
        }
        div_label_and_result.appendChild(span_result);



        //Div for hidden_buttons
        let div_hidden_buttons = document.createElement("div");

        div_hidden_buttons.classList.add("hidden_buttons_container", `hided_buttons-${nb_hidden_buttons}`);
        div_parametor.appendChild(div_hidden_buttons);



        // Reload button
        if(!param.is_live){
            let div_button = document.createElement("div");
            div_button.classList.add("hidden_button_div", "hidden_reload");

            let svg_reload_parametor = document.createElement("img");
            div_button.appendChild(svg_reload_parametor);

            svg_reload_parametor.classList.add("white_svg", "hidden_button");
            svg_reload_parametor.id = "img_reload_" + html_id;
            svg_reload_parametor.title = "Recompute parameter";
            svg_reload_parametor.src = "img/parametor/reload.svg";
            svg_reload_parametor.addEventListener('click', ()=>{update_parametor(g,param_to_load)});
            svg_reload_parametor.classList.add("reload_img");
            div_hidden_buttons.appendChild(div_button);
        }
        else{
            let empty_reload_parametor = document.createElement("span");
            div_hidden_buttons.appendChild(empty_reload_parametor);
        }

       

        // Remove button
        let div_button = document.createElement("div");
        div_button.classList.add("hidden_button_div", "hidden_trash");

        let button = document.createElement('img');
        div_button.appendChild(button);
        button.src = "img/parametor/trash.svg";
        button.classList.add("remove_param_button", "white_svg", "hidden_button");
        button.title = "Remove parameter";
        button.addEventListener('click', () => { remove_loaded_param(param.id, area_id); });
        div_hidden_buttons.appendChild(div_button);


         // Info button
         if(param.has_info){
            let div_button = document.createElement("div");
            div_button.classList.add("hidden_button_div", "hidden_info");

            let svg_info_parametor = document.createElement("img");
            div_button.appendChild(svg_info_parametor);

            svg_info_parametor.classList.add("white_svg", "hidden_button");
            svg_info_parametor.id = "img_info_" + html_id;
            svg_info_parametor.title = "Information on this parameter";
            svg_info_parametor.src = "img/parametor/info.svg";
            svg_info_parametor.addEventListener('click', ()=>{
                console.log("INFO")


                var xhr= new XMLHttpRequest();
                xhr.open('GET', `parameters_info/${param.id}.html`, true);
                xhr.onreadystatechange= function() {
                    if (this.readyState!==4) return;
                    if (this.status!==200) return; // or whatever error handling you want
                    // document.getElementById('y').innerHTML= this.responseText;
                    document.getElementById('info_content').innerHTML = this.responseText;
                    document.getElementById('info_parametor_container').classList.toggle("show");
                    document.getElementById('info_closing_button').onclick = () => {
                        document.getElementById('info_content').innerHTML = "";
                        document.getElementById('info_parametor_container').classList.remove("show");
                    }
                };
                xhr.send();


            });
            // svg_info_parametor.classList.add("reload_img");
            div_hidden_buttons.appendChild(div_button);
        }
        // else{
        //     let empty_reload_parametor = document.createElement("span");
        //     div_hidden_buttons.appendChild(empty_reload_parametor);
        // }
     

        return div_parametor;
    }
    else{
        return null;
    }

    // Add parametor to document and list of loaded parametors
    // document.getElementById("params_loaded").appendChild(div_parametor);
    // params_loaded.push(param_to_load);
    // update_params_loaded(g, new Set(), true);
    // if(param.is_live){
    //     update_parametor(g, param_to_load);
    // }
    // requestAnimationFrame(function () { draw(canvas, ctx, g) })
}


export function get_title_span_for_area(a:Area):HTMLSpanElement{
    const span_area = document.createElement('span');
    span_area.classList.add("span_area_name_parametor");

    if(a!== null){
        span_area.textContent = a.label;
        span_area.style.background = a.multicolor.color;
        span_area.style.color = a.multicolor.contrast;
        // span_area.style.borderColor = a.multicolor.contrast;
    }
    else{
        span_area.textContent = "Everything";
        span_area.style.background = "#fff";
        span_area.style.color = COLOR_BACKGROUND;
        // span_area.style.borderColor = "#fff";
    }
    return span_area;
}

export function init_list_parametors_for_area(board: Board, a:Area, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D){
    const g = board.graph;
    const view = board.view;
    const a_id = (a==null?"null":a.id);
    let area_DOM = document.getElementById("area_"+ a_id);

    if(area_DOM === null)
    {   
        area_DOM = document.createElement("div");
        area_DOM.id = "area_"+ a_id;
        area_DOM.classList.add("subgraph_parametors");

        let title_area_container = document.getElementById("title_container_area_"+a_id);
        if(title_area_container === null){
            title_area_container = document.createElement("div");
            title_area_container.classList.add("title_area_container");
            title_area_container.id = "title_container_area_"+a_id;

            const load_new_parametors_button = document.createElement("img");
            load_new_parametors_button.classList.add("load_new_parametor_button");
            load_new_parametors_button.src = "img/parametor/plus.svg";
            load_new_parametors_button.title = "Load a new parameter";
            load_new_parametors_button.id = "load_parametor_area_"+a_id;
            load_new_parametors_button.onclick = ((e) => {
                params_available_turn_on_div();
                // todo choose parameter for this area
            });
            title_area_container.appendChild(load_new_parametors_button);
            
            let titleDOM = document.getElementById("title_area_"+ a_id);
            if(titleDOM === null){
                titleDOM = get_title_span_for_area(a);
                titleDOM.id = "title_area_"+ a_id;
                title_area_container.appendChild(titleDOM);
    
                if(a!== null){
                    // Center on the area on click
                    titleDOM.addEventListener("click",  (e)=>{
                        const area = local_board.graph.areas.get(a.id); // It seems we have to reget the area since the corners may have change
                        center_canvas_on_rectangle(view, view.canvasCoord(area.corner_top_left), view.canvasCoord(area.corner_bottom_right), canvas, g); // .canvas_pos est pas encore implémenté
                        requestAnimationFrame(function () { 
                            draw(canvas, ctx, g) 
                        });
                    });
                }
                else{
                    // Center on the graph on click
                    titleDOM.addEventListener("click",  (e)=>{
                        let top_left_corner = new CanvasCoord(-canvas.width/2, -canvas.height/2);
                        let bot_right_corner = new CanvasCoord(canvas.width/2, canvas.height/2);
    
                        if(g.vertices.size > 1){
                            const v : LocalVertex = g.vertices.values().next().value;
                            let xMin = v.pos.canvas_pos.x;
                            let yMin = v.pos.canvas_pos.y;
                            let xMax = v.pos.canvas_pos.x;
                            let yMax = v.pos.canvas_pos.y;
    
                            for(const u of g.vertices.values()){
                                xMin = Math.min(xMin, u.pos.canvas_pos.x);
                                yMin = Math.min(yMin, u.pos.canvas_pos.y);
                                xMax = Math.max(xMax, u.pos.canvas_pos.x);
                                yMax = Math.max(yMax, u.pos.canvas_pos.y);
                            }
    
                            top_left_corner = new CanvasCoord(xMin, yMin);
                            bot_right_corner = new CanvasCoord(xMax, yMax);
                        }
                        else if(g.vertices.size === 1){
                            const v = g.vertices.values().next().value;
                            let xMin = v.pos.canvas_pos.x - canvas.width/2;
                            let yMin = v.pos.canvas_pos.y - canvas.height/2;
                            let xMax = v.pos.canvas_pos.x + canvas.width/2;
                            let yMax = v.pos.canvas_pos.y + canvas.height/2;
                            top_left_corner = new CanvasCoord(xMin, yMin);
                            bot_right_corner = new CanvasCoord(xMax, yMax);
                        }
    
                        center_canvas_on_rectangle(view, top_left_corner, bot_right_corner, canvas, g);
                        requestAnimationFrame(function () { 
                            draw(canvas, ctx, g) 
                        });
                    });
                }
            }

            const expand_list_button = document.createElement("img");
            expand_list_button.classList.add("expand_button", "expanded", "hidden");
            expand_list_button.src = "img/parametor/list.svg";
            expand_list_button.title = "Expand/collapse the parameter list";
            expand_list_button.id = "expand_list_area_"+a_id;
            expand_list_button.addEventListener("click", ()=>{
                expand_list_button.classList.toggle("expanded");
                const param_container = document.getElementById("param_list_container_area_"+a_id);
                if(param_container){
                    // if(param_container.style.display == 'none'){
                    //     param_container.style.display = "flex";
                    // }
                    // else{
                    //     param_container.style.display = 'none'
                    // }
                   param_container.classList.toggle("hidden_list");
                }
            })

            title_area_container.appendChild(expand_list_button);

            area_DOM.appendChild(title_area_container);
        }
        
        
        const param_containerDOM = document.createElement("div");
        param_containerDOM.classList.add("param_list_container");
        param_containerDOM.id = "param_list_container_area_"+a_id;
        param_containerDOM.style.display="none";
        for(const param of params_available){
            const div_parametor = init_parametor_div(param, a, board);
            if(div_parametor !== null){
                param_containerDOM.appendChild(div_parametor);
            }
        }
        area_DOM.appendChild(param_containerDOM);

        const param_list = document.getElementById("subgraph_list");
        param_list.appendChild(area_DOM);
    }
}
