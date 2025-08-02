%include lib/common

costumes "costumes/stage/darkchecker.png" as "darkchecker";


################################
#             Misc             #
################################

# delta time, the elapsed time since the last frame.
var dt;

# goboscript hack to reset the project on first load (the variable defaults to false)
var goboscript_init_done = false;

# is it the user's first time clicking the green flag?
var user_first_time;

# 2-digit hexadecimal lookup table
list hex_lookup "data/hex_lookup.txt";

# on-screen console messages displayed with text engine
list project_messages;

# the list to copy data from (e.g. save codes)
list copy_this;

# generator programming language text log
list output;

# commands
var cmd_string;


################################
#            Canvas            #
################################
# The "canvas" is the 3D voxel environment that can be drawn to with color and opacity. Stored as sRGB. Other comments may reference "air" which is any voxel with 0 opacity.
list voxel canvas;
var canvas_size_x;
var canvas_size_y;
var canvas_size_z;


################################
#            Camera            #
################################
var cam_x; # position along x axis in voxels
var cam_y; # position along y axis in voxels
var cam_scale; # scale (relationship between canvas voxels and screen-space pixels)
var cam_azi; # 3D orbit view azimuth, CCW around origin. 0 means face +Y (like top-down)
var cam_elev; # 3D orbit view elevation angle. 0 is vertical (looking down), 90 is horizontal


################################
#          Rendering           #
################################
var requested_render_resolution; # the current resolution for compositing and rendering
var render_resolution;
var require_composite;
var require_iterative_compositor;
var require_viewport_refresh;
var viewport_mode;
var compositor_mode;
var counted_samples;

list render_buffer_final_col; # 2D array, final color to render on screen, 24-bit sRGB (8 bits per channel) as a combined number.


################################
#        User interface        #
################################

var UI_hovered_group; # panel
var UI_hovered_element; # element of panel
var UI_last_hovered_group;
var UI_last_hovered_element;

var iterative_compositor_paused;

var UI_sidebar_width; # set to 0 to hide

var render_size_x;
var render_size_y;

var showing_lists; # boolean for whether any list monitor is showing

var UI_current_panel;

var UI_clipboard_source;

list UI_data "UI/UI_data.txt";
list UI_data_panels "UI/UI_data_panels.txt";
list UI_data_element_id "UI/UI_data_element_id.txt";
list UI_data_element_index "UI/UI_data_element_index.txt";

list UI_return; # for user-triggered operations that need additional data retrieved from the UI.

list UI_popup; # color picker, section viewer, dropdown menu, etc. Temporary and in front of everything. They only store temporary data.


################################
#          Stage size          #
################################
# (see sprite stage_size)
var stage_max_x;
var stage_max_y;
var stage_size_x;
var stage_size_y;
var stage_min_x;
var stage_min_y;


################################
#       Project settings       #
################################
# (see project_settings sprite)
var PS_slider_sensitivity;
var PS_emission_intensity;
var PS_sky_intensity;
var PS_sun_intensity;
var PS_sun_bearing;
var PS_sun_elevation;
var PS_filter_size_fac_2D_PT;
var PS_filter_size_fac_3D_PT;
var PS_use_tone_map;
var PS_max_samples;
var PS_max_iteration_time;
var PS_render_resolution_default_orbit;
var PS_reset_render_on_flag;
var PS_normal_map_intensity;
var PS_normal_map_kernel_size;




################################

on "initalise" {
    dt = 0;
    
    if (PS_reset_render_on_flag) {
        cam_x = 0;
        cam_y = 0;
        cam_scale = 1;
        cam_azi = -30;
        cam_elev = 45;

        requested_render_resolution = 1;
        render_resolution = requested_render_resolution;

        require_composite = true;
        require_iterative_compositor = false;

        viewport_mode = ViewportMode.ALIGNED;
        compositor_mode = CompositorMode.COLOR;

        counted_samples = 1;
    }

    require_viewport_refresh = true;

    UI_hovered_group = "";
    UI_hovered_element = "";
    UI_last_hovered_group = "";
    UI_last_hovered_element = "";
    
    iterative_compositor_paused = false;
    
    delete project_messages;
}


on "sys.hard_reset" {
    dt = 0;
    
    user_first_time = true;

    delete canvas;
    canvas_size_x = 0;
    canvas_size_y = 0;
    canvas_size_z = 0;

    render_size_x = 0;
    render_size_y = 0;
}


onflag {
    if (goboscript_init_done == false) {
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


proc set_resolution target {
    if (PS_render_resolution_default_orbit != $target) {
        PS_render_resolution_default_orbit = $target;
        cmd_string = "element settings.resolution 3 " & $target;
        broadcast "sys.run_command";
    }
}


onclick {
    broadcast "sys.stage_clicked"; # each receiver checks if the hovered group is for it. This prevents the script from running in multiple places at the same time. Use the last hover variable because it stores the state where all of the UI is guaranteed to have been checked. 
}

