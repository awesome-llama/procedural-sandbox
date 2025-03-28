%include common/common.gs

costumes "costumes/compositor/compositor.svg" as "compositor";
hide;

list brightness; # LUT

on "initalise" {
    hide;
}

on "hard reset" {
    delete brightness;
}

onkey "1" {
    compositor_mode = CompositorMode.COLOR;
    require_composite = true;
}

onkey "2" {
    compositor_mode = CompositorMode.SHADED;
    require_composite = true;
}

onkey "3" {
    compositor_mode = CompositorMode.HEIGHT;
    require_composite = true;
}

onkey "4" {
    compositor_mode = CompositorMode.AO;
    require_composite = true;
}

onkey "5" {
    compositor_mode = CompositorMode.DENSITY;
    require_composite = true;
}

onkey "6" {
    compositor_mode = CompositorMode.PENETRATION;
    require_composite = true;
}

onkey "7" {
    compositor_mode = CompositorMode.NORMAL;
    require_composite = true;
}


################################
#             Main             #
################################

on "composite" { composite; }
proc composite {
    
    # if the canvas lists are the wrong size, create them again
    # this doesn't happen often enough to optimise?
    if ((length render_cache_final_col) != (canvas_size_x * canvas_size_y)) {
        delete render_cache_ao;
        delete render_cache_topmost;
        delete render_cache_1_r;
        delete render_cache_2_g;
        delete render_cache_3_b;
        delete render_cache_final_col;
        repeat (canvas_size_x * canvas_size_y) {
            add 0 to render_cache_ao;
            add 0 to render_cache_topmost;
            add 0 to render_cache_1_r;
            add 0 to render_cache_2_g;
            add 0 to render_cache_3_b;
            add 0 to render_cache_final_col;
        }
    }

    # run different custom blocks depending on mode
    if (compositor_mode == CompositorMode.COLOR) {
        generate_pass_topmost;
        composite_topmost_colour;

    } elif (compositor_mode == CompositorMode.SHADED) {
        generate_pass_topmost;
        generate_pass_ao;
        composite_shaded_color;

    } elif (compositor_mode == CompositorMode.HEIGHT) {
        generate_pass_topmost;
        composite_heightmap;

    } elif (compositor_mode == CompositorMode.AO) {
        generate_pass_topmost;
        generate_pass_ao;
        composite_ao;

    } elif (compositor_mode == CompositorMode.DENSITY) {
        composite_density;

    } elif (compositor_mode == CompositorMode.PENETRATION) {
        generate_pass_topmost;
        composite_penetration;

    } elif (compositor_mode == CompositorMode.NORMAL) {
        generate_pass_topmost;
        composite_normal 1;
    
    } else {}

    # make combined values
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        render_cache_final_col[i] = COMBINE_RGB_CHANNELS((render_cache_1_r[i]), (render_cache_2_g[i]), (render_cache_3_b[i]));
        i++;
    }
    
    require_screen_refresh = true;
}



################################
#            Passes            #
################################


# the topmost non-0-opacity voxel, found by raycasting downwards. The index of the solid voxel, not the air above it.
proc generate_pass_topmost {
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        iz = canvas_size_z;
        until ((iz < 0) or (canvas[i + (iz * layer_size)].opacity > 0)) {
            iz += -1;
        }
        render_cache_topmost[i] = iz;
        i++;
    }
}


# ambient occlusion in 2D
proc generate_pass_ao {
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    iy = 0.5; # center of voxel
    local samples = 64;
    repeat canvas_size_y {
        ix = 0.5; # center of voxel
        repeat canvas_size_x {
            local cumulative_light = 0;
            repeat samples {
                local bearing = random("0", "360.0"); # needs to be a float. This is not deterministic
                raycast_ao ix, iy, render_cache_topmost[i]+1, sin(bearing), cos(bearing), tan(random("18.43", "90.0")), (3 * canvas_size_z);
                cumulative_light += ray_light;
            }
            render_cache_ao[i] = cumulative_light / samples;
            ix++;
            i++;
        }
        iy++;
    }
}



################################
#      Final compositing       #
################################


# simply the colour map looking down, no translucency handling
proc composite_topmost_colour {
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        local index = render_cache_topmost[i];
        if index < 0 { # no topmost
            render_cache_1_r[i] = 0.5;
            render_cache_2_g[i] = 0.5;
            render_cache_3_b[i] = 0.5;
        } else {
            render_cache_1_r[i] = canvas[i + index*layer_size].r;
            render_cache_2_g[i] = canvas[i + index*layer_size].g;
            render_cache_3_b[i] = canvas[i + index*layer_size].b;
        }
        i++;
    }
}


# a semi-realistic shaded style, accounting for translucency and AO.
proc composite_shaded_color {
    make_brightness_LUT 0.8, 1;
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        iz = 0;
        local brightness_index = 1; # brightness is slightly altered by depth
        local r = TO_LINEAR(0.5); # the background colour
        local g = TO_LINEAR(0.5);
        local b = TO_LINEAR(0.5);

        repeat canvas_size_z {
            if (canvas[i+iz].opacity > 0) {
                r += (canvas[i+iz].opacity * (TO_LINEAR(brightness[brightness_index]*canvas[i+iz].r)-r));
                g += (canvas[i+iz].opacity * (TO_LINEAR(brightness[brightness_index]*canvas[i+iz].g)-g));
                b += (canvas[i+iz].opacity * (TO_LINEAR(brightness[brightness_index]*canvas[i+iz].b)-b));
            }
            iz += layer_size;
            brightness_index += 1;
        }
        local ao_fac = 0.7 + (0.3 * render_cache_ao[i]);
        render_cache_1_r[i] = FROM_LINEAR(r * ao_fac);
        render_cache_2_g[i] = FROM_LINEAR(g * ao_fac);
        render_cache_3_b[i] = FROM_LINEAR(b * ao_fac);
        i++;
    }
}


# heightmap of the topmost non-transparent voxel, normalised to greyscale 0-1
proc composite_heightmap {
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        local height = (render_cache_topmost[i]+1) / canvas_size_z;
        render_cache_1_r[i] = height;
        render_cache_2_g[i] = height;
        render_cache_3_b[i] = height;
        i++;
    }
}


# ambient occlusion, normalised to greyscale 0-1
proc composite_ao {
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        local ao_fac = (1 * render_cache_ao[i]);
        render_cache_1_r[i] = ao_fac;
        render_cache_2_g[i] = ao_fac;
        render_cache_3_b[i] = ao_fac;
        i++;
    }
}

# sum of opacity, normalised to greyscale 0-1
proc composite_density {
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        local density = 0;
        local zoffset = 0;
        repeat canvas_size_z {
            density += canvas[i + zoffset].opacity;
            zoffset += layer_size;
        }
        render_cache_1_r[i] = density / canvas_size_z;
        render_cache_2_g[i] = density / canvas_size_z;
        render_cache_3_b[i] = density / canvas_size_z;
        i++;
    }
}

# raycast down, for visualising transparency, normalised to greyscale 0-1
proc composite_penetration {
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        local penetration_val = canvas[i+(layer_size*render_cache_topmost[i])].opacity;
        render_cache_1_r[i] = penetration_val;
        render_cache_2_g[i] = penetration_val;
        render_cache_3_b[i] = penetration_val;
        i++;
    }
}

# heightmap of the topmost non-transparent voxel, normalised to greyscale 0-1
%define NRM_KERNEL_X(DX,DY,WX) \
dx += WX*(render_cache_topmost[INDEX_FROM_2D_INTS(ix+(DX), iy+(DY), canvas_size_x, canvas_size_y)] - h);

%define NRM_KERNEL_Y(DX,DY,WY) \
dy += WY*(render_cache_topmost[INDEX_FROM_2D_INTS(ix+(DX), iy+(DY), canvas_size_x, canvas_size_y)] - h);

%define NRM_KERNEL_XY(DX,DY,WX,WY) \
local kernel_h = (render_cache_topmost[INDEX_FROM_2D_INTS(ix+(DX), iy+(DY), canvas_size_x, canvas_size_y)] - h);\
dx += WX*kernel_h;\
dy += WY*kernel_h;\

%define W_EDGE 0.25
%define W_CORNER 0.125

proc composite_normal intensity {
    iy = 0;
    repeat (canvas_size_y) {
        ix = 0;
        repeat (canvas_size_x) {
            i = INDEX_FROM_2D_NOWRAP_INTS(ix, iy, canvas_size_x);

            local dx = 0;
            local dy = 0;
            local h = render_cache_topmost[i]; # height of current
            
            # x
            NRM_KERNEL_X(-1,0,W_EDGE)
            NRM_KERNEL_X(1,0,-W_EDGE)
            
            # y
            NRM_KERNEL_Y(0,-1,W_EDGE)
            NRM_KERNEL_Y(0,1,-W_EDGE)

            # corners
            NRM_KERNEL_XY(1,1,-W_CORNER,-W_CORNER)
            NRM_KERNEL_XY(-1,1,W_CORNER,-W_CORNER)
            NRM_KERNEL_XY(1,-1,-W_CORNER,W_CORNER)
            NRM_KERNEL_XY(-1,-1,W_CORNER,W_CORNER)

            # weight
            dx *= $intensity;
            dy *= $intensity;

            # normalise
            local len = VEC3_LEN(dx,dy,1)*2; # multiply by 2 because normal map centers at 0.5

            render_cache_1_r[i] = 0.5+(dx/len);
            render_cache_2_g[i] = 0.5+(dy/len);
            render_cache_3_b[i] = 0.5+(1/len);

            ix++;
        }
        iy++;
    }
}



################################
#            Utils             #
################################

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


# 3D DDA, returns ray_light
proc raycast_ao x, y, z, dx, dy, dz, r {
    local vec_len = sqrt((($dx*$dx)+(($dy*$dy)+($dz*$dz))));
    local scale_x = abs(vec_len/$dx);
    local scale_y = abs(vec_len/$dy);
    local scale_z = abs(vec_len/$dz);
    local raycast_ix = floor($x);
    local raycast_iy = floor($y);
    local raycast_iz = floor($z);
    if ($dx < 0) {
        local step_x = -1;
        local len_x = (($x%1)*scale_x);
    } else {
        local step_x = 1;
        local len_x = ((1-($x%1))*scale_x);
    }
    if ($dy < 0) {
        local step_y = -1;
        local len_y = (($y%1)*scale_y);
    } else {
        local step_y = 1;
        local len_y = ((1-($y%1))*scale_y);
    }
    if ($dz < 0) {
        local step_z = -1;
        local len_z = (($z%1)*scale_z);
    } else {
        local step_z = 1;
        local len_z = ((1-($z%1))*scale_z);
    }

    ray_light = 1; # returned, not local to this script
    
    until (len_x > $r and len_y > $r and len_z > $r) {

        # find the shortest len variable and increase it:
        if (len_x < len_z) {
            if (len_x < len_y) {
                len_x += scale_x;
                raycast_ix += step_x;
            } else {
                len_y += scale_y;
                raycast_iy += step_y;
            }
        } else {
            if (len_y < len_z) {
                len_y += scale_y;
                raycast_iy += step_y;
            } else {
                len_z += scale_z;
                raycast_iz += step_z;
            }
        }

        local alpha = canvas[INDEX_FROM_3D_CANVAS(raycast_ix, raycast_iy, raycast_iz, canvas_size_x, canvas_size_y)].opacity;

        if (alpha == "") { stop_this_script; } # did not get a list item, therefore out of bounds
        
        ray_light = (ray_light*(1-alpha));
        
        if (ray_light < 0.0001) { stop_this_script; } # too dark
        if (raycast_iz > canvas_size_z) { stop_this_script; } # out of bounds, assume air
    }
}
