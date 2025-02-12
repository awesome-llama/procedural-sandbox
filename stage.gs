
costumes "costumes/stage/darkchecker.png" as "darkchecker";

# (red, green, blue) color
struct col_RGB {
    r,
    g,
    b
}

enum CompositorMode {
    NONE = "",
    COLOR = "COLOR", # RGB & Alpha only
    SHADED = "SHADED", # fully processed colour
    HEIGHT = "HEIGHT", # heightmap, topmost voxel elevation
    AO = "AO", # ambient occlusion
    PENETRATION = "PENETRATION", # colour by how much light penetrates through, for visualising transparency
    THICKNESS = "PENETRATION" # number of voxels in the column
}

# The "canvas" is the 3D voxel environment that can be drawn to with color and opacity. 
list col_RGB canvas_col;
list canvas_alpha;

# originally the main canvas lists. TODO remove
list _1_r;
list _2_g;
list _3_b;
list _4_a;

# The render cache is a 2D projection of the canvas for displaying on screen.
list render_cache_col; # color
list render_cache_ao; # ambient occlusion
list render_cache_topmost; # elevation index of topmost voxel (really just a heightmap)

# TextImage shared lists
list TI__1_r = [];
list TI__2_g = [];
list TI__3_b = [];
list TI__4_a = [];

# list render_cache_is_not_trans = []; # not in use, iirc it was a mask to optimise rendering transparency

list copy_this; # list for copying outputted text



list TI__header = [];
list palette = [];

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

    __dev = 1; # developer mode
    
    TextImage = "";
    TI__image_size_x = 256;
    TI__image_size_y = 256;

    refresh_screen_required = 1;
    compositor_mode = CompositorMode.SHADED;
}


onclick {
    hide copy_this;
    broadcast "stage clicked";
}
