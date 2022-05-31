function setup() {
    let g = new Graph();
    g.add_vertex(100, 100);
    let canvas = document.getElementById('main');
    let ctx = canvas.getContext('2d');
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    document.addEventListener('contextmenu', event => event.preventDefault());
    setup_interactions(canvas, ctx, g);
    draw(canvas, ctx, g);
}
setup();
//# sourceMappingURL=setup.js.map