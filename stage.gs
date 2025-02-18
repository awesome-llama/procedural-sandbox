%include common/common.gs

costumes "costumes/stage/darkchecker.png" as "darkchecker";


# The "canvas" is the 3D voxel environment that can be drawn to with color and opacity. Stored linear using Rec 709 primaries.
list voxel canvas; # TODO use this <<<<<<<<<<

list canvas_1_r; # remove these
list canvas_2_g;
list canvas_3_b;
list canvas_4_a;

# The render cache is a 2D projection of the canvas for displaying on screen.
list render_cache_ao; # ambient occlusion
list render_cache_topmost; # elevation index of topmost voxel (really just a heightmap)
list render_cache_1_r; # 2D color maps, linear 0-1
list render_cache_2_g;
list render_cache_3_b;
list render_cache_final_col; # final color to render on screen, 24-bit nonlinear.


# TextImage shared lists:
list TI_1_r;
list TI_2_g;
list TI_3_b;
list TI_4_a;
list TI_header;

####

list copy_this; # output list for copying text
list project_messages; # console messages


on "initalise" {
    dev = round((username() == "awesome-llama")); # developer mode
    
    cam_x = 0;
    cam_y = 0;
    cam_scale = 1;

    render_resolution = 1;
    refresh_screen_required = 1;

    compositor_mode = CompositorMode.SHADED;
}


on "hard reset" {
    delete canvas;
    delete canvas_1_r;
    delete canvas_2_g;
    delete canvas_3_b;
    delete canvas_4_a;

    canvas_size_x = 0;
    canvas_size_y = 0;
    canvas_size_z = 0;

    # TextImage shared variables:
    TextImage_file = "";
    TI_image_size_x = 0;
    TI_image_size_y = 0;

    delete TI_1_r;
    delete TI_2_g;
    delete TI_3_b;
    delete TI_4_a;
    delete TI_header;

}

onflag {
    broadcast "initalise";
    broadcast "start main loop";
}

onclick {
    hide copy_this;
    broadcast "stage clicked";
}



