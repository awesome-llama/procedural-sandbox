
%include common/common.gs

costumes "costumes/compositor/compositor.svg" as "compositor";

list canvas_1_r = [];
list canvas_2_g = [];
list canvas_3_b = [];

list brightness; # 


onkey "1" {
    compositor_mode = "color";
    broadcast "composite";
}

onkey "2" {
    compositor_mode = "shaded";
    broadcast "composite";
}

onkey "3" {
    compositor_mode = "height";
    broadcast "composite";
}

onkey "4" {
    compositor_mode = "ao";
    broadcast "composite";
}

onkey "5" {
    compositor_mode = "penetration";
    broadcast "composite";
}


# if the canvas lists are the wrong size, create it again
proc regenerate_cache_for_current_canvas_size  {
    if (not ((length render_cache_col) == (canvas_size_x*canvas_size_y))) {
        delete render_cache_col;
        delete canvas_1_r;
        delete canvas_2_g;
        delete canvas_3_b;
        repeat (canvas_size_x*canvas_size_y) {
            add 0 to render_cache_col;
            add 0 to canvas_1_r;
            add 0 to canvas_2_g;
            add 0 to canvas_3_b;
        }
    }
}

# script sm (-373,868)
proc composite_shaded_color  {
    make_brightness_LUT 0.8, 1;
    set_render_base 0.5, 0.5, 0.5;
    layer_size = (canvas_size_x*canvas_size_y);
    i = 1;
    repeat layer_size {
        iz = 0;
        brightness_index = 1;
        repeat canvas_size_z {
            if (_4_a[(i+iz)] > 0) {
                canvas_1_r[i] = (canvas_1_r[i]+(_4_a[(i+iz)]*((brightness[brightness_index]*_1_r[(i+iz)])-canvas_1_r[i])));
                canvas_2_g[i] = (canvas_2_g[i]+(_4_a[(i+iz)]*((brightness[brightness_index]*_2_g[(i+iz)])-canvas_2_g[i])));
                canvas_3_b[i] = (canvas_3_b[i]+(_4_a[(i+iz)]*((brightness[brightness_index]*_3_b[(i+iz)])-canvas_3_b[i])));
            }
            iz += layer_size;
            brightness_index += 1;
        }
        local ao_fac = (0.7 + (0.3 * render_cache_ao[i]));
        canvas_1_r[i] = (canvas_1_r[i] * ao_fac);
        canvas_2_g[i] = (canvas_2_g[i] * ao_fac);
        canvas_3_b[i] = (canvas_3_b[i] * ao_fac);
        i++;
    }
}

# Reset the canvas with a base colour
proc set_render_base r, g, b {
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        canvas_1_r[i] = $r;
        canvas_2_g[i] = $g;
        canvas_3_b[i] = $b;
        i++;
    }
}

# A list of brightnesses for each Z value.
# It should be quicker to find index than interpolate... probably (remember we need control of both start and end, it's not normalised)
proc make_brightness_LUT start, end {
    delete brightness;
    t = 0;
    repeat canvas_size_z {
        add ($start+(($end-$start)*t)) to brightness;
        t += (1/(canvas_size_z-1));
    }
}

# a pure heightmap of the topmost non-transparent voxel
proc composite_heightmap  {
    make_brightness_LUT 0, 1;
    _repeat = (canvas_size_x*canvas_size_y);
    i = 1;
    repeat _repeat {
        canvas_1_r[i] = brightness[render_cache_topmost[i]];
        canvas_2_g[i] = brightness[render_cache_topmost[i]];
        canvas_3_b[i] = brightness[render_cache_topmost[i]];
        i++;
    }
}

# colour by how much light penetrates through, for visualising transparency
proc composite_penetration  {
    set_render_base 1, 1, 1;
    i = 1;
    layer_size = 0-(canvas_size_x*canvas_size_y);
    repeat abs(layer_size) {
        iz = ((canvas_size_z-1)*(-layer_size));
        brightness_index = 1;
        until (iz < 0) {
            iz += layer_size;
            brightness_index = (brightness_index*(1 - _4_a[(i+iz)]));
        }
        canvas_1_r[i] = brightness_index;
        canvas_2_g[i] = brightness_index;
        canvas_3_b[i] = brightness_index;
        i++;
    }
}

# script tt (4003,90)
proc raycast_ao x, y, z, dx, dy, dz, r {
    local total_distance = sqrt((($dx*$dx)+(($dy*$dy)+($dz*$dz))));
    local scale_x = abs((total_distance/$dx));
    local scale_y = abs((total_distance/$dy));
    local scale_z = abs((total_distance/$dz));
    local raycast_ix = floor($x);
    local raycast_iy = floor($y);
    local raycast_iz = floor($z);
    if ($dx < 0) {
        step_x = -1;
        len_x = (($x%1)*scale_x);
    } else {
        step_x = 1;
        len_x = ((1-($x%1))*scale_x);
    }
    if ($dy < 0) {
        step_y = -1;
        len_y = (($y%1)*scale_y);
    } else {
        step_y = 1;
        len_y = ((1-($y%1))*scale_y);
    }
    if ($dz < 0) {
        step_z = -1;
        len_z = (($z%1)*scale_z);
    } else {
        step_z = 1;
        len_z = ((1-($z%1))*scale_z);
    }
    local total_distance = 1;
    ray_light = 1; # returned
    until (total_distance > $r) {
        if ((len_x < len_y) and (len_x < len_z)) {
            len_x += scale_x;
            total_distance += scale_x;
            raycast_ix += step_x;
        } else {
            if ((len_y < len_x) and (len_y < len_z)) {
                len_y += scale_y;
                total_distance += scale_y;
                raycast_iy += step_y;
            } else {
                len_z += scale_z;
                total_distance += scale_z;
                raycast_iz += step_z;
            }
        }
        _temp_1 = _4_a[(1+((raycast_iz*layer_size)+(((raycast_iy%canvas_size_y)*canvas_size_x)+(raycast_ix%canvas_size_x))))];
        if (_temp_1 == "") {
            stop_this_script;
        }
        ray_light = (ray_light*(1-_temp_1));
        if (ray_light < 0.0001) {
            stop_this_script;
        }
        if (raycast_iz > canvas_size_z) {
            stop_this_script;
        }
    }
}

# script t_ (2073,195)
proc generate_ao_pass  {
    delete render_cache_ao;
    layer_size = (canvas_size_x*canvas_size_y);
    i = 1;
    iy = 1;
    _repeat = 64;
    repeat canvas_size_y {
        ix = 1;
        repeat canvas_size_x {
            cumulative_light = 1;
            repeat _repeat {
                local bearing = random(1, "360.0"); # needs to be a float
                raycast_ao ix, iy, render_cache_topmost[i], sin(bearing), cos(bearing), tan(random("18.43", "90.0")), (3 * canvas_size_z);
                cumulative_light += (ray_light/_repeat);
            }
            add cumulative_light to render_cache_ao;
            ix += 1;
            i += 1;
        }
        iy += 1;
    }
}

# script t| (3006,179)
proc composite_ao_pass  {
    make_brightness_LUT 1, 1;
    _repeat = (canvas_size_x*canvas_size_y);
    i = 1;
    repeat _repeat {
        local ao_fac = (1 * render_cache_ao[i]);
        canvas_1_r[i] = ao_fac;
        canvas_2_g[i] = ao_fac;
        canvas_3_b[i] = ao_fac;
        i++;
    }
}

# script ui (2063,1421)
proc generate_topmost_voxel_pass  {
    delete render_cache_topmost;
    i = 1;
    layer_size = (1-(canvas_size_x*canvas_size_y));
    repeat abs(layer_size) {
        i_offset = ((canvas_size_z-1)*(1-layer_size));
        iz = canvas_size_z;
        until ((iz < 1) or (_4_a[(i+i_offset)] > 1)) {
            i_offset += layer_size;
            iz += -1;
        }
        add iz to render_cache_topmost;
        i += 1;
    }
}


# simply the colour map looking down, no translucency handling
proc composite_topmost_colour  {
    set_render_base 0.5, 0.5, 0.5;
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        local index = (i+((render_cache_topmost[i]-1) * layer_size));
        canvas_1_r[i] = _1_r[index];
        canvas_2_g[i] = _2_g[index];
        canvas_3_b[i] = _3_b[index];
        i++;
    }
}


# script z~ (162,425)
# if false {
#     iz = 1;
#     repeat canvas_size_z {
#         iy = 1;
#         repeat canvas_size_y {
#             ix = 1;
#             repeat canvas_size_x {
#                 ix += 1;
#             }
#             iy += 1;
#         }
#         iz += 1;
#     }
# }


on "composite" { composite; }
proc composite  {
    regenerate_cache_for_current_canvas_size;

    if (compositor_mode == CompositorMode.COLOR) {
        generate_topmost_voxel_pass;
        composite_topmost_colour;

    } elif (compositor_mode == CompositorMode.SHADED) {
        generate_topmost_voxel_pass;
        generate_ao_pass;
        composite_shaded_color;

    } elif (compositor_mode == CompositorMode.HEIGHT) {
        generate_topmost_voxel_pass;
        composite_heightmap;

    } elif (compositor_mode == CompositorMode.AO) {
        generate_topmost_voxel_pass;
        generate_ao_pass;
        composite_ao_pass;

    } elif (compositor_mode == CompositorMode.PENETRATION) {
            composite_penetration;

    } else {}

    # make combined values
    _repeat = (canvas_size_x*canvas_size_y);
    i = 1;
    repeat _repeat {
        # handles gamma
        render_cache_col[i] = ((65536*floor((255*antiln((2.2*ln(canvas_1_r[i]))))))+((256*floor((255*antiln((2.2*ln(canvas_2_g[i]))))))+floor((255*antiln((2.2*ln(canvas_3_b[i])))))));
        i++;
    }
    
    refresh_screen_required = 1;
}
