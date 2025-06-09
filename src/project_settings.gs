# Isolates the project settings code from the rest of the project for organisation.
# This code is quite standalone.

%include lib/common

costumes "costumes/blank.svg" as "blank";


on "settings.apply" {
    # Interface
    PS_slider_sensitivity = get_setting_from_id("settings.slider_sensitivity");

    # Render (misc.)
    PS_render_resolution_default_orbit = get_setting_from_id("settings.resolution");
    PS_reset_render_on_flag = get_setting_from_id("settings.reset_render_on_flag");

    # Pathtracer
    PS_emission_intensity = get_setting_from_id("settings.emission_intensity");

    PS_sky_intensity = get_setting_from_id("settings.sky_intensity");

    PS_sun_intensity = get_setting_from_id("settings.sun_intensity");
    PS_sun_bearing = get_setting_from_id("settings.sun_bearing");
    PS_sun_elevation = get_setting_from_id("settings.sun_elevation");

    PS_use_tone_map = get_setting_from_id("settings.use_tone_map");

    PS_filter_size_fac_2D_PT = get_setting_from_id("settings.filter_size_fac_2D_PT");
    PS_filter_size_fac_3D_PT = get_setting_from_id("settings.filter_size_fac_3D_PT");

    PS_max_samples = get_setting_from_id("settings.max_samples");
    PS_max_iteration_time = get_setting_from_id("settings.max_frame_time");
    
    # Normal map
    PS_normal_map_intensity = get_setting_from_id("settings.normal_map_intensity");
    PS_normal_map_kernel_size = get_setting_from_id("settings.normal_map_kernel_size");



    if (viewport_mode == ViewportMode.ORBIT) {
        requested_render_resolution = PS_render_resolution_default_orbit;
    }

    require_composite = true;

    print "changes applied", 3;
}
