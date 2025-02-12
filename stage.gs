
costumes "costumes/stage/darkchecker.png" as "darkchecker";

# (red, green, blue) colour
struct col_RGB {
    r,
    g,
    b
}

# The "canvas" is the 3D voxel environment that can be drawn to with colour and opacity. 
list col_RGB canvas_col;
list canvas_alpha;

# The render cache is a 2D projection of the canvas for displaying on screen.
list col_RGB render_cache;


list _1_r;
list _2_g;
list _3_b;
list _4_a;

list render_cache_col;

list TI__1_r = [];
list TI__2_g = [];
list TI__3_b = [];
list TI__4_a = [];

# list render_cache_is_not_trans = []; # not in use, iirc it was a mask to optimise rendering transparency

list copy_this; # list for copying outputted text

list TI__header = [];
list palette = [];
list ao;
list topmost;

list project_messages; # console messages

# This broadcast has two functions: 
# 1. Define the variables in use
# 2. Provide a way to completely reset the project state.
on "reset globals" {
    cam_x = 0;
    cam_y = 0;

    render_resolution = 1;
    cam_scale = 1;
    canvas_size_y = 256;
    canvas_size_x = 256;
    canvas_size_z = 12;

    _mouse_x = -151;
    _mouse_y = -111;

    info = 0;
    __dev = 1;
    TI__image_size_x = 256;
    TI__image_size_y = 256;
    TextImage = "";
    copy_TI_px_buffer_to_canvas = 0;
    refresh_screen_ = 1;
    compositor_mode = "shaded";
}


onclick {
    hide copy_this;
    broadcast "stage clicked";
}
