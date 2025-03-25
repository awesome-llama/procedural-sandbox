%include common/common.gs

costumes "costumes/stage/darkchecker.png" as "darkchecker";


# The "canvas" is the 3D voxel environment that can be drawn to with color and opacity. Stored linear using Rec 709 primaries. Other comments may reference "air" which is any voxel with 0 opacity.
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

list template_metadata depositor_template_metadata; # pointers into the template list
list voxel depositor_template_voxels;

# UI
list UI_data = file ```UI/UI_data.txt```;
list UI_data_panels = file ```UI/UI_data_panels.txt```;
list UI_data_element_id = file ```UI/UI_data_element_id.txt```;
list UI_data_element_index = file ```UI/UI_data_element_index.txt```;

list UI_return; # for user-triggered operations that need additional data retrieved from the UI.

# col_picker list stores all data for the colour picker. Empty if not visible. Items are ordered:
# - showing (always true if there are list items)
# - x
# - y
# - index of element
# - mode?
list col_picker; 

on "initalise" {
    dev = round((username() == "awesome-llama")); # developer mode
    
    cam_x = 0;
    cam_y = 0;
    cam_scale = 1;

    render_resolution = 1;

    require_composite = true;
    require_screen_refresh = true;

    viewport_mode = ViewportMode.COMPOSITOR;
    compositor_mode = CompositorMode.COLOR;

    # the "depositor" (chose an obscure but relevant name) is a description of what voxel will be placed by the procedural tools. It may be a single voxel or it may be a 3D template.
    depositor_mode = DepositorMode.DRAW;
    depositor_replace = true; # bool [false=keep existing (non-air voxel) intact | true=replace (incl. with new air)]
    voxel depositor_voxel = VOXEL_SOLID_GREY(1);
    depositor_template_index = 0; # which template to use, 1-indexed
    XYZ depositor_template_origin = XYZ {x:0, y:0, z:0}; # origin of the template in canvas space

    UI_hovered_group = "";
    UI_hovered_element = "";
    UI_last_hovered_group = "";
    UI_last_hovered_element = "";

    UI_current_panel = "menu.io";
    UI_sidebar_width = 160; # set to 0 to hide
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

    delete depositor_template_metadata;
    delete depositor_template_voxels;

    delete UI_return;
    delete col_picker;
}

onflag {
    broadcast "initalise"; # all receivers must complete within the frame, no loops allowed to start. Think of it as a soft reset.
    broadcast "start main loop";
}

onclick {
    hide copy_this; # hide the list to copy from
    broadcast "stage clicked"; # each receiver checks if the hovered group is for it. This prevents the script from running in multiple places at the same time. Use the last hover variable because it stores the state where all of the UI is guaranteed to have been checked. 
}


# comment block generator https://blocks.jkniest.dev/
