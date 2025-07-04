%include lib/common

costumes "costumes/stage/darkchecker.png" as "darkchecker";


# The "canvas" is the 3D voxel environment that can be drawn to with color and opacity. Stored as sRGB. Other comments may reference "air" which is any voxel with 0 opacity.
list voxel canvas;

# The render buffer is a 2D projection of the canvas for displaying on screen.
# final color to render on screen, 24-bit sRGB (8 bits per channel).
list render_buffer_final_col;

# TextImage shared lists (good to keep global):
list TI_1_r;
list TI_2_g;
list TI_3_b;
list TI_4_a;
list TI_header;

####

list output; # output text log
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

# color picker, section viewer, dropdown menu, etc. Temporary and in front of everything. They only store temporary data.
list UI_popup; 

# 2-digit hexadecimal lookup table
list hex_lookup = file ```data/hex_lookup.txt```;


# hard_reset will run before this when required
on "initalise" {
    dt = 0; # delta time
    
    if (PS_reset_render_on_flag) {
        cam_x = 0;
        cam_y = 0;
        cam_scale = 1; # shared by both?

        # for orbit rotation in 3D only.
        cam_azi = -30; # CCW around origin. 0 means face +Y (like top-down)
        cam_elev = 45; # 0 is vertical (looking down), 90 is horizontal

        requested_render_resolution = 1; # the current resolution for compositing and rendering
        render_resolution = requested_render_resolution;

        require_composite = true;
        require_iterative_compositor = false;
    }
    
    require_viewport_refresh = true;
    
    if (PS_reset_render_on_flag) { 
        viewport_mode = ViewportMode.ALIGNED;
        compositor_mode = CompositorMode.COLOR;

        counted_samples = 1;
    }

    # the "depositor" (chose an obscure but relevant name) is a description of what voxel will be placed by the procedural tools. It may be a single voxel or it may be a 3D template.
    depositor_mode = DepositorMode.DRAW;
    depositor_replace = true; # bool [false=keep existing (non-air voxel) intact | true=replace (incl. with new air)]
    voxel depositor_voxel = VOXEL_SOLID_GREY(1);
    depositor_template_index = 0; # which template to use, 1-indexed
    XYZ depositor_template_origin = XYZ {x:0, y:0, z:0}; # origin of the template in canvas space

    UI_hovered_group = ""; # panel
    UI_hovered_element = ""; # element of panel
    #UI_hovered_subelement = ""; # component of element (not used but is an option if needed)

    UI_last_hovered_group = "";
    UI_last_hovered_element = "";
    #UI_last_hovered_subelement = "";

    iterative_compositor_paused = false;

    if (PS_reset_render_on_flag) { UI_sidebar_width = 160; }; # set to 0 to hide
    
    cmd_string = "";
    
    delete UI_popup;

    delete copy_this;
    delete output;
    broadcast "sys.hide_lists";

    delete project_messages;
}


on "sys.hard_reset" {
    user_first_time = true;

    delete canvas;

    canvas_size_x = 0;
    canvas_size_y = 0;
    canvas_size_z = 0;

    render_size_x = 0;
    render_size_y = 0;

    # TextImage shared variables:
    TextImage_file = "";
    TI_image_size_x = 0;
    TI_image_size_y = 0;

    delete TI_1_r;
    delete TI_2_g;
    delete TI_3_b;
    delete TI_4_a;
    delete TI_header;

    ###

    delete depositor_template_metadata;
    delete depositor_template_voxels;

    delete UI_return;
    delete UI_popup;
    
    UI_current_panel = "menu.gen";

    UI_clipboard_source = 0;
    
    cmd_string = "";

    stage_max_x = 240;
    stage_max_y = 180;
    stage_size_x = stage_max_x * 2;
    stage_size_y = stage_max_y * 2;
    stage_min_x = -stage_max_x;
    stage_min_y = -stage_max_y;
    
    showing_lists = false;
    
    # project settings
    PS_slider_sensitivity = 200;

    PS_emission_intensity = 1;

    PS_sky_intensity = 1;
    PS_sun_intensity = 1;
    PS_sun_bearing = 0;
    PS_sun_elevation = 45;

    PS_filter_size_fac_2D_PT = 0;
    PS_filter_size_fac_3D_PT = 1;

    PS_use_tone_map = false;

    PS_max_samples = 256;
    PS_max_iteration_time = 0.1;
    PS_render_resolution_default_orbit = 4;

    PS_reset_render_on_flag = true;

    PS_normal_map_intensity = 1;
    PS_normal_map_kernel_size = 2;

    broadcast "settings.apply"; # update the project settings from UI (which is always the source)
}

onflag {
    if (goboscript_init_done == false) {
        # goboscript hack to reset the project on first load (the variable defaults to false)
        goboscript_init_done = true;
        broadcast_and_wait "sys.reset"; # stop all is in the thumbnail
        stop_this_script;
    }
    if (user_first_time) {
        if ($tw_is_turbowarp) {
            set_resolution 4;
        } else {
            set_resolution 6;
        }
        user_first_time = false;
    }
    broadcast "sys.get_stage_size"; # this happens before init just in case anything needs stage size
    broadcast "initalise"; # all receivers must complete within the frame, no loops allowed to start. Think of it as a soft reset.
    broadcast "sys.start_main_loop"; # schedule main loop start after init
}

onclick {
    broadcast "sys.stage_clicked"; # each receiver checks if the hovered group is for it. This prevents the script from running in multiple places at the same time. Use the last hover variable because it stores the state where all of the UI is guaranteed to have been checked. 
}


proc set_resolution target {
    if (PS_render_resolution_default_orbit != $target) {
        PS_render_resolution_default_orbit = $target;
        cmd_string = "element settings.resolution 3 " & $target;
        broadcast "sys.run_command";
    }
}