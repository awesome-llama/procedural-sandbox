# Isolates the project settings code from the rest of the project for organisation.
# This code is quite standalone.

%include lib/common

costumes "costumes/blank.svg" as "blank";


on "sys.hard_reset" {
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


%define APPLY_SETTING(VARIABLE, ID) get_setting_from_id_shared_variable((ID)); VARIABLE = return_value;


on "settings.apply" {
    # Interface
    APPLY_SETTING(PS_slider_sensitivity, "settings.slider_sensitivity");

    # Render (misc.)
    APPLY_SETTING(PS_render_resolution_default_orbit, "settings.resolution");
    APPLY_SETTING(PS_reset_render_on_flag, "settings.reset_render_on_flag");

    # Pathtracer
    APPLY_SETTING(PS_emission_intensity, "settings.emission_intensity");

    APPLY_SETTING(PS_sky_intensity, "settings.sky_intensity");

    APPLY_SETTING(PS_sun_intensity, "settings.sun_intensity");
    APPLY_SETTING(PS_sun_bearing, "settings.sun_bearing");
    APPLY_SETTING(PS_sun_elevation, "settings.sun_elevation");

    APPLY_SETTING(PS_use_tone_map, "settings.use_tone_map");

    APPLY_SETTING(PS_filter_size_fac_2D_PT, "settings.filter_size_fac_2D_PT");
    APPLY_SETTING(PS_filter_size_fac_3D_PT, "settings.filter_size_fac_3D_PT");

    APPLY_SETTING(PS_max_samples, "settings.max_samples");
    APPLY_SETTING(PS_max_iteration_time, "settings.max_frame_time");

    # Normal map
    APPLY_SETTING(PS_normal_map_intensity, "settings.normal_map_intensity");
    APPLY_SETTING(PS_normal_map_kernel_size, "settings.normal_map_kernel_size");



    if (viewport_mode == ViewportMode.ORBIT) {
        requested_render_resolution = PS_render_resolution_default_orbit;
    }

    require_composite = true;

    print "changes applied", 3;
}



# gets the setting value and sets a variable manually (goboscript creates too many func return vars currently)
proc get_setting_from_id_shared_variable element_id {
    return_value = get_setting_from_id($element_id);
}
