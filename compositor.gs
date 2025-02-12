# Converted from sb3 file
%include common/common.gs

list canvas_1_r = [];
list canvas_2_g = [];
list canvas_3_b = [];
list brightness = [0.8, 0.8181818181818182, 0.8363636363636364, 0.8545454545454546, 0.8727272727272728, 0.890909090909091, 0.9090909090909092, 0.9272727272727272, 0.9454545454545455, 0.9636363636363636, 0.9818181818181819, 1];
list pts = [];
list ao_sample_count = [];

costumes "costumes/compositor/compositor.svg" as "compositor";


# script iW (-1136,654)
on "composite" {
    composite;
}

# script sp (1071,220)
proc regenerate_cache_for_current_canvas_size  {
    if (not ((length render_cache_col) == (canvas_size_x*canvas_size_y))) {
        ____s "canvas is the wrong size, create it again";
        delete render_cache_col;
        delete canvas_1_r;
        delete canvas_2_g;
        delete canvas_3_b;
        repeat (canvas_size_x*canvas_size_y) {
            add "0" to render_cache_col;
            add "0" to canvas_1_r;
            add "0" to canvas_2_g;
            add "0" to canvas_3_b;
        }
    }
}

# script sm (-373,868)
proc composite_shaded_color  {
    make_brightness_LUT__s__s "0.8", "1";
    set_render_base__s__s__s "0.5", "0.5", "0.5";
    layer_size = (canvas_size_x*canvas_size_y);
    i = 1;
    repeat layer_size {
        iz = "0";
        brightness_index = "1";
        repeat canvas_size_z {
            if (_4_a[(i+iz)] > "0") {
                canvas_1_r[i] = (canvas_1_r[i]+(_4_a[(i+iz)]*((brightness[brightness_index]*_1_r[(i+iz)])-canvas_1_r[i])));
                canvas_2_g[i] = (canvas_2_g[i]+(_4_a[(i+iz)]*((brightness[brightness_index]*_2_g[(i+iz)])-canvas_2_g[i])));
                canvas_3_b[i] = (canvas_3_b[i]+(_4_a[(i+iz)]*((brightness[brightness_index]*_3_b[(i+iz)])-canvas_3_b[i])));
            }
            iz += layer_size;
            brightness_index += "1";
        }
        _temp_1 = ("0.7"+("0.3"*ao[i]));
        canvas_1_r[i] = (canvas_1_r[i]*_temp_1);
        canvas_2_g[i] = (canvas_2_g[i]*_temp_1);
        canvas_3_b[i] = (canvas_3_b[i]*_temp_1);
        i++;
    }
}

# script sQ (482,234)
proc set_render_base__s__s__s r, g, b {
    _repeat = (length render_cache_col);
    i = 1;
    repeat _repeat {
        canvas_1_r[i] = $r;
        canvas_2_g[i] = $g;
        canvas_3_b[i] = $b;
        i++;
    }
}

# script s/ (509,633)
proc make_brightness_LUT__s__s start, end {
    delete brightness;
    t = "0";
    repeat canvas_size_z {
        add ($start+(($end-$start)*t)) to brightness;
        t += ("1"/(canvas_size_z-"1"));
    }
}

# script s] (-509,2672)
proc composite_heightmap  {
    ____s "a pure heightmap of the topmost non-transparent voxel";
    make_brightness_LUT__s__s "0", "1";
    _repeat = (canvas_size_x*canvas_size_y);
    i = 1;
    repeat _repeat {
        canvas_1_r[i] = brightness[topmost[i]];
        canvas_2_g[i] = brightness[topmost[i]];
        canvas_3_b[i] = brightness[topmost[i]];
        i++;
    }
}

# script tf (360,2661)
proc composite_penetration  {
    ____s "colour by how much light penetrates through, for visualising transparency";
    set_render_base__s__s__s "1", "1", "1";
    i = "1";
    layer_size = ("0"-(canvas_size_x*canvas_size_y));
    repeat abs(layer_size) {
        iz = ((canvas_size_z-"1")*("0"-layer_size));
        brightness_index = "1";
        until (iz < "0") {
            iz += layer_size;
            brightness_index = (brightness_index*("1"-_4_a[(i+iz)]));
        }
        canvas_1_r[i] = brightness_index;
        canvas_2_g[i] = brightness_index;
        canvas_3_b[i] = brightness_index;
        i += "1";
    }
}

# script tt (4003,90)
proc raycast_ao_from__s__s__s_in_dir__s__s__s_with_range__s x, y, z, dx, dy, dz, r {
    total_distance = sqrt((($dx*$dx)+(($dy*$dy)+($dz*$dz))));
    scale_x = abs((total_distance/$dx));
    scale_y = abs((total_distance/$dy));
    scale_z = abs((total_distance/$dz));
    raycast_ix = floor($x);
    raycast_iy = floor($y);
    raycast_iz = floor($z);
    if ($dx < "0") {
        step_x = "-1";
        len_x = (($x%"1")*scale_x);
    } else {
        step_x = "1";
        len_x = (("1"-($x%"1"))*scale_x);
    }
    if ($dy < "0") {
        step_y = "-1";
        len_y = (($y%"1")*scale_y);
    } else {
        step_y = "1";
        len_y = (("1"-($y%"1"))*scale_y);
    }
    if ($dz < "0") {
        step_z = "-1";
        len_z = (($z%"1")*scale_z);
    } else {
        step_z = "1";
        len_z = (("1"-($z%"1"))*scale_z);
    }
    total_distance = "0";
    ray_light = "1";
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
        _temp_1 = _4_a[("1"+((raycast_iz*layer_size)+(((raycast_iy%canvas_size_y)*canvas_size_x)+(raycast_ix%canvas_size_x))))];
        if (_temp_1 == "") {
            stop_this_script;
        }
        ray_light = (ray_light*("1"-_temp_1));
        if (ray_light < "0.0001") {
            stop_this_script;
        }
        if (raycast_iz > canvas_size_z) {
            stop_this_script;
        }
    }
}

# script t_ (2073,195)
proc generate_ao_pass  {
    delete ao;
    layer_size = (canvas_size_x*canvas_size_y);
    i = "1";
    iy = "0";
    _repeat = "64";
    repeat canvas_size_y {
        ix = "0";
        repeat canvas_size_x {
            cumulative_light = "0";
            repeat _repeat {
                _temp_1 = random("0", "360.0");
                raycast_ao_from__s__s__s_in_dir__s__s__s_with_range__s ix, iy, topmost[i], sin(_temp_1), cos(_temp_1), tan(random("18.43", "90.0")), ("3"*canvas_size_z);
                cumulative_light += (ray_light/_repeat);
            }
            add cumulative_light to ao;
            ix += "1";
            i += "1";
        }
        iy += "1";
    }
}

# script t| (3006,179)
proc composite_ao_pass  {
    make_brightness_LUT__s__s "0", "1";
    _repeat = (canvas_size_x*canvas_size_y);
    i = 1;
    repeat _repeat {
        _temp_1 = ("1"*ao[i]);
        canvas_1_r[i] = _temp_1;
        canvas_2_g[i] = _temp_1;
        canvas_3_b[i] = _temp_1;
        i++;
    }
}

# script ui (2063,1421)
proc generate_topmost_voxel_pass  {
    delete topmost;
    i = "1";
    layer_size = ("0"-(canvas_size_x*canvas_size_y));
    repeat abs(layer_size) {
        i_offset = ((canvas_size_z-"1")*("0"-layer_size));
        iz = canvas_size_z;
        until ((iz < "1") or (_4_a[(i+i_offset)] > "0")) {
            i_offset += layer_size;
            iz += "-1";
        }
        add iz to topmost;
        i += "1";
    }
}

# script As (-1189,184)
onkey "1" {
    compositor_mode = "color";
    broadcast "composite";
}

# script BR (-855,172)
onkey "2" {
    compositor_mode = "shaded";
    broadcast "composite";
}

# script Av (-1058,360)
onkey "3" {
    compositor_mode = "height";
    broadcast "composite";
}

# script Bx (-682,379)
onkey "4" {
    compositor_mode = "ao";
    broadcast "composite";
}

# script AA (-349,389)
onkey "5" {
    compositor_mode = "penetration";
    broadcast "composite";
}

# script uJ (-1273,2678)
proc composite_topmost_colour  {
    ____s "simply the colour map looking down, no translucency handling";
    set_render_base__s__s__s "0.5", "0.5", "0.5";
    layer_size = (canvas_size_x*canvas_size_y);
    i = 1;
    repeat layer_size {
        _temp_1 = (i+((topmost[i]-"1")*layer_size));
        canvas_1_r[i] = _1_r[_temp_1];
        canvas_2_g[i] = _2_g[_temp_1];
        canvas_3_b[i] = _3_b[_temp_1];
        i++;
    }
}

# script B) (2299,-3)
# if (not ((length topmost) == (length ao))) {

# }

# script z~ (162,425)
# if false {
#     iz = "0";
#     repeat canvas_size_z {
#         iy = "0";
#         repeat canvas_size_y {
#             ix = "0";
#             repeat canvas_size_x {
#                 ix += "1";
#             }
#             iy += "1";
#         }
#         iz += "1";
#     }
# }

# script sk (-1134,841)
proc composite  {
    regenerate_cache_for_current_canvas_size;
    if (compositor_mode == "color") {
        generate_topmost_voxel_pass;
        composite_topmost_colour;
    } elif (compositor_mode == "shaded") {
        generate_topmost_voxel_pass;
        generate_ao_pass;
        composite_shaded_color;
    } elif (compositor_mode == "height") {
        generate_topmost_voxel_pass;
        composite_heightmap;
    } elif (compositor_mode == "ao") {
        generate_topmost_voxel_pass;
        generate_ao_pass;
        composite_ao_pass;
    } elif (compositor_mode == "penetration") {
            composite_penetration;
    } else {}

    comment "make combined values";
    _repeat = (canvas_size_x*canvas_size_y);
    i = 1;
    repeat _repeat {
        render_cache_col[i] = (("65536"*floor(("255"*antiln(("2.2"*ln(canvas_1_r[i]))))))+(("256"*floor(("255"*antiln(("2.2"*ln(canvas_2_g[i]))))))+floor(("255"*antiln(("2.2"*ln(canvas_3_b[i])))))));
        i++;
    }
    comment "";
    refresh_screen_ = "1";
}
