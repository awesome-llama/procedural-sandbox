%include common/common.gs

costumes "costumes/stage/darkchecker.png" as "darkchecker";


# The "canvas" is the 3D voxel environment that can be drawn to with color and opacity. Stored linear using Rec 709 primaries.
list voxel canvas;

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

list texture_metadata depositor_texture_metadata; # pointers into the texture list
list voxel depositor_texture_voxels; 

on "initalise" {
    dev = round((username() == "awesome-llama")); # developer mode
    
    cam_x = 0;
    cam_y = 0;
    cam_scale = 1;

    render_resolution = 1;

    require_composite = true;
    require_screen_refresh = true;

    compositor_mode = CompositorMode.COLOR;

    # the "depositor" (chose an obscure but relevant name) is a description of what voxel will be placed by the procedural tools. It may be a single voxel or it may be a 3D texture.
    depositor_mode = DepositorMode.DRAW;
    depositor_replace = true; # bool [false=keep existing intact | true=replace (incl. with new air)]
    voxel depositor_voxel = voxel { opacity:1, r:1, g:1, b:1, emission:0 };
    depositor_texture_index = 0;
    XYZ depositor_texture_origin = XYZ {x:0, y:0, z:0}; # origin of the texture in canvas space
}


on "hard reset" {
    delete canvas;

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

    delete depositor_texture_metadata;
    delete depositor_texture_voxels;

}

onflag {
    broadcast "initalise"; # all receivers must complete within the frame, no loops allowed to start. Think of it as a soft reset.
    broadcast "start main loop";
}

onclick {
    hide copy_this; # hide the list to copy from
    broadcast "stage clicked";
}



