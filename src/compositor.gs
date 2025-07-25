%include lib/common

costumes "costumes/compositor/icon.svg" as "icon";
hide;

list buffer_ao; # ambient occlusion
list buffer_topmost; # elevation index of topmost voxel (really just a heightmap)
list buffer_r;
list buffer_g;
list buffer_b;
list XYZ raytracer_ray_origins;

on "initalise" {
    if (PS_reset_render_on_flag) {
        XYZ raytracer_ray_direction = XYZ {x:0, y:0, z:0}; # this would have to be a list if perspective rendering was done (or create a new script specifically for it)
        
        last_raytracer_config = "undefined"; # keeps track of the state of the raytracer lists so they only get updated when needed.
    }
}

on "sys.hard_reset" {
    delete buffer_ao;
    delete buffer_topmost;
    delete buffer_r;
    delete buffer_g;
    delete buffer_b;
    delete raytracer_ray_origins;
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
    compositor_mode = CompositorMode.PATHTRACED;
    require_composite = true;
}

onkey "4" {
    compositor_mode = CompositorMode.HEIGHT;
    require_composite = true;
}

onkey "5" {
    compositor_mode = CompositorMode.AO;
    require_composite = true;
}

onkey "6" {
    compositor_mode = CompositorMode.NORMAL;
    require_composite = true;
}


################################
#             Main             #
################################


on "sys.composite" {
    require_iterative_compositor = false; # default off
    render_resolution = requested_render_resolution; # this is the only time the resolution is set
    counted_samples = 1;

    # run different custom blocks depending on mode
    if (viewport_mode == ViewportMode.ALIGNED) {
        render_size_x = canvas_size_x;
        render_size_y = canvas_size_y;
        resize_render_buffer;

        if (compositor_mode == CompositorMode.COLOR) {
            cmp_aligned_color;

        } elif (compositor_mode == CompositorMode.SHADED) {
            init_aligned_ao_pass;
            require_iterative_compositor = true;

        } elif (compositor_mode == CompositorMode.PATHTRACED) {
            calculate_sun_vector;
            init_aligned_raytracer;
            require_iterative_compositor = true;

        } elif (compositor_mode == CompositorMode.HEIGHT) {
            cmp_aligned_heightmap;

        } elif (compositor_mode == CompositorMode.AO) {
            init_aligned_ao_pass;
            require_iterative_compositor = true;

        } elif (compositor_mode == CompositorMode.NORMAL) {
            cmp_aligned_normal;

        }
    } elif (viewport_mode == ViewportMode.ORBIT) {
        # there is only 1 rendering mode in orbit view, raytraced
        render_size_x = ceil((stage_size_x-UI_sidebar_width) / render_resolution);
        render_size_y = ceil((stage_size_y-20) / render_resolution);
        resize_render_buffer;
        
        if (compositor_mode == CompositorMode.COLOR) {
            init_orbit_raytracer;
            cmp_orbit_color;

        } elif (compositor_mode == CompositorMode.SHADED) {
            init_orbit_raytracer;
            cmp_orbit_shaded;

        } elif (compositor_mode == CompositorMode.PATHTRACED) {
            calculate_sun_vector;
            init_orbit_raytracer;
            require_iterative_compositor = true;

        } elif (compositor_mode == CompositorMode.HEIGHT) {
            init_orbit_raytracer;
            cmp_orbit_height;

        } elif (compositor_mode == CompositorMode.AO) {
            init_orbit_raytracer;
            require_iterative_compositor = true;

        } elif (compositor_mode == CompositorMode.NORMAL) {
            init_orbit_raytracer;
            cmp_orbit_normal;
            
        }
    }

    require_composite = false;
}


on "sys.iterative_compositor" {
    if (iterative_compositor_paused) {
        stop_this_script; # pause rendering (e.g. prioritise UI performance)
    }

    if (viewport_mode == ViewportMode.ALIGNED) {
        if (compositor_mode == CompositorMode.SHADED) {
            iterate_aligned_ao PS_max_samples, PS_max_iteration_time, 1; # use 1 because it is composited with color
            cmp_aligned_shaded_color;

        } elif (compositor_mode == CompositorMode.PATHTRACED) {
            iterate_generic_pathtracer PS_max_samples, PS_max_iteration_time, PS_filter_size_fac_2D_PT;

        } elif (compositor_mode == CompositorMode.AO) {
            iterate_aligned_ao PS_max_samples, PS_max_iteration_time, PS_filter_size_fac_2D_PT;
            cmp_aligned_ao;
        }
    } elif (viewport_mode == ViewportMode.ORBIT) {
        if (compositor_mode == CompositorMode.SHADED) {
            # use AO

        } elif (compositor_mode == CompositorMode.PATHTRACED) {
            iterate_generic_pathtracer PS_max_samples, PS_max_iteration_time, PS_filter_size_fac_3D_PT;

        } elif (compositor_mode == CompositorMode.AO) {
            iterate_generic_ao PS_max_samples, PS_max_iteration_time, PS_filter_size_fac_3D_PT;

        }
    }

    if (counted_samples >= PS_max_samples) {
        require_iterative_compositor = false;
    }
    require_viewport_refresh = true;
}


################################
#            Passes            #
################################


# the topmost non-0-opacity voxel, found by raycasting downwards. The index of the solid voxel, not the air above it.
proc generate_pass_topmost {
    layer_size = (canvas_size_x * canvas_size_y);
    if ((length buffer_topmost) != layer_size) { # optimised
        delete buffer_topmost;
        
        i = 1;
        repeat layer_size {
            iz = canvas_size_z;
            until ((iz < 0) or (canvas[i + (iz * layer_size)].opacity > 0)) {
                iz += -1;
            }
            add iz to buffer_topmost;
            i++;
        }
    
    } else {
        i = 1;
        repeat layer_size {
            iz = canvas_size_z;
            until ((iz < 0) or (canvas[i + (iz * layer_size)].opacity > 0)) {
                iz += -1;
            }
            buffer_topmost[i] = iz;
            i++;
        }
    }
}


################################
#  non-iterative compositing   #
################################


# simply the color map looking down, no translucency handling
proc cmp_aligned_color {
    generate_pass_topmost;
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        local index = buffer_topmost[i];
        if index < 0 {
            # entire column was air, use background color
            render_buffer_final_col[i] = COL_TRANSPARENT();
        } else {
            render_buffer_final_col[i] = COMBINE_RGB_CHANNELS((canvas[i + index*layer_size].r), (canvas[i + index*layer_size].g), (canvas[i + index*layer_size].b));
        }
        i++;
    }
    require_viewport_refresh = true;
}


# heightmap of the topmost non-transparent voxel, normalised to greyscale 0-1
proc cmp_aligned_heightmap {
    generate_pass_topmost;
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        local height = (buffer_topmost[i]+1) / canvas_size_z;
        render_buffer_final_col[i] = COMBINE_RGB_CHANNELS(height, height, height);
        i++;
    }
    require_viewport_refresh = true;
}


# heightmap of the topmost non-transparent voxel, normalised to greyscale 0-1
%define NRM_KERNEL_X(DX,DY,WX) \
dx += WX*(buffer_topmost[INDEX_FROM_2D_INTS(ix+(DX), iy+(DY), canvas_size_x, canvas_size_y)] - h);

%define NRM_KERNEL_Y(DX,DY,WY) \
dy += WY*(buffer_topmost[INDEX_FROM_2D_INTS(ix+(DX), iy+(DY), canvas_size_x, canvas_size_y)] - h);

%define NRM_KERNEL_XY(DX,DY,WX,WY) \
local kernel_h = (buffer_topmost[INDEX_FROM_2D_INTS(ix+(DX), iy+(DY), canvas_size_x, canvas_size_y)] - h);\
dx += WX*kernel_h;\
dy += WY*kernel_h;\

%define W_EDGE 0.25
%define W_CORNER 0.125

proc cmp_aligned_normal {
    generate_pass_topmost;
    iy = 0;
    repeat (canvas_size_y) {
        ix = 0;
        repeat (canvas_size_x) {
            i = INDEX_FROM_2D_NOWRAP_INTS(ix, iy, canvas_size_x);

            local dx = 0;
            local dy = 0;
            local h = buffer_topmost[i]; # height of current
            
            # 2x2 kernel
            NRM_KERNEL_X(1,0,-W_EDGE)
            NRM_KERNEL_Y(0,1,-W_EDGE)
            NRM_KERNEL_XY(1,1,-W_CORNER,-W_CORNER)

            # 3x3 kernel
            if (PS_normal_map_kernel_size == 3) {
                # x
                NRM_KERNEL_X(-1,0,W_EDGE)
                #NRM_KERNEL_X(1,0,-W_EDGE) # also used by 2x2
                
                # y
                NRM_KERNEL_Y(0,-1,W_EDGE)
                #NRM_KERNEL_Y(0,1,-W_EDGE) # also used by 2x2

                # corners
                #NRM_KERNEL_XY(1,1,-W_CORNER,-W_CORNER) # also used by 2x2
                NRM_KERNEL_XY(-1,1,W_CORNER,-W_CORNER)
                NRM_KERNEL_XY(1,-1,-W_CORNER,W_CORNER)
                NRM_KERNEL_XY(-1,-1,W_CORNER,W_CORNER)
            }
            

            # weight
            dx *= PS_normal_map_intensity;
            dy *= PS_normal_map_intensity;

            # normalise
            local len = VEC3_LEN(dx,dy,1)*2; # multiply by 2 because normal map centers at 0.5

            render_buffer_final_col[i] = COMBINE_RGB_CHANNELS(0.5+(dx/len), 0.5+(dy/len), 0.5+(1/len));

            ix++;
        }
        iy++;
    }
    require_viewport_refresh = true;
}


proc cmp_orbit_color {
    set_sample_pixel_shift 0;
    i = 1;
    repeat (render_size_x * render_size_y) {
        raycast_wrapped_canvas raytracer_ray_origins[i].x+shift.x, raytracer_ray_origins[i].y+shift.y, raytracer_ray_origins[i].z+shift.z, raytracer_ray_direction.x, raytracer_ray_direction.y, raytracer_ray_direction.z;
        
        if (hit_index > 0) {
            render_buffer_final_col[i] = COMBINE_RGB_CHANNELS(canvas[hit_index].r, canvas[hit_index].g, canvas[hit_index].b);
        } else {
            render_buffer_final_col[i] = COL_TRANSPARENT();
        }
        i++;
    }

    require_viewport_refresh = true;
}


proc cmp_orbit_shaded {
    set_sample_pixel_shift 0;
    i = 1;
    repeat (render_size_x * render_size_y) {
        raycast_wrapped_canvas raytracer_ray_origins[i].x+shift.x, raytracer_ray_origins[i].y+shift.y, raytracer_ray_origins[i].z+shift.z, raytracer_ray_direction.x, raytracer_ray_direction.y, raytracer_ray_direction.z;
        
        if (hit_index > 0) {
            local height = 0.5 + 0.5*(1 - (canvas_size_z-hit_position.z) / MAX(8, canvas_size_z));
            
            if (side == 2) {
                local brightness_fac = height;
            } elif (side == 1) {
                local brightness_fac = 0.85 * height;
            } else {
                local brightness_fac = 0.9 * height;
            }
            brightness_fac = 1-((1-brightness_fac) * (1-canvas[hit_index].emission)); # disable shading for emission
            
            render_buffer_final_col[i] = COMBINE_RGB_CHANNELS(canvas[hit_index].r*brightness_fac, canvas[hit_index].g*brightness_fac, canvas[hit_index].b*brightness_fac);
        } else {
            render_buffer_final_col[i] = COL_TRANSPARENT();
        }
        i++;
    }

    require_viewport_refresh = true;
}

proc cmp_orbit_height {
    set_sample_pixel_shift 0;
    i = 1;
    repeat (render_size_x * render_size_y) {
        raycast_wrapped_canvas raytracer_ray_origins[i].x+shift.x, raytracer_ray_origins[i].y+shift.y, raytracer_ray_origins[i].z+shift.z, raytracer_ray_direction.x, raytracer_ray_direction.y, raytracer_ray_direction.z;
        
        if (hit_index > 0) {
            local height = hit_position.z / canvas_size_z;
            height = CLAMP_0_1(height);
            render_buffer_final_col[i] = COMBINE_RGB_CHANNELS(height, height, height);
        } else {
            render_buffer_final_col[i] = COL_TRANSPARENT();
        }
        i++;
    }

    require_viewport_refresh = true;
}

proc cmp_orbit_normal {
    set_sample_pixel_shift 0;
    i = 1;
    repeat (render_size_x * render_size_y) {
        raycast_wrapped_canvas raytracer_ray_origins[i].x+shift.x, raytracer_ray_origins[i].y+shift.y, raytracer_ray_origins[i].z+shift.z, raytracer_ray_direction.x, raytracer_ray_direction.y, raytracer_ray_direction.z;
        
        if (hit_index > 0) {
            render_buffer_final_col[i] = COMBINE_RGB_CHANNELS(
                0.5 + (side==0) * ((step_x < 0) - 0.5), 
                0.5 + (side==1) * ((step_y < 0) - 0.5), 
                0.5 + (side==2) * ((step_z < 0) - 0.5) 
                );
        } else {
            render_buffer_final_col[i] = COL_TRANSPARENT();
        }
        i++;
    }

    require_viewport_refresh = true;
}

################################
#       Iterative modes        #
################################


# used by both ao and shaded modes
proc init_aligned_ao_pass {
    generate_pass_topmost;
    counted_samples = 1;
    delete buffer_ao;
    delete render_buffer_final_col;
    repeat layer_size {
        add 0 to buffer_ao;
        add 0 to render_buffer_final_col;
    }
}

# ambient occlusion in 2D on the topmost non-air voxel. Requires topmost voxel data.
proc iterate_aligned_ao max_samples, max_time, filter_size {
    start_time = days_since_2000();

    layer_size = (canvas_size_x * canvas_size_y);

    repeat $max_samples {

        set_sample_pixel_shift $filter_size;

        i = 1;
        iy = 0.5+shift.y; # start at center of voxel
        repeat canvas_size_y {
            ix = 0.5+shift.x;
            repeat canvas_size_x {
                local bearing = random("0", "360.0");
                raycast_AO ix, iy, buffer_topmost[i]+1, sin(bearing), cos(bearing), tan(random("18.43", "90.0"));
                buffer_ao[i] += ray_light;
                ix++;
                i++;
            }
            iy++;
        }
        
        counted_samples += 1;

        if ((days_since_2000()-start_time)*86400 > $max_time) {
            stop_this_script; # out of time
        }
    }
}

# a semi-realistic shaded style, accounting for translucency and AO.
proc cmp_aligned_shaded_color {
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        iz = 0;
        local r = TO_LINEAR(0.5); # the background color
        local g = TO_LINEAR(0.5);
        local b = TO_LINEAR(0.5);

        repeat canvas_size_z {
            if (canvas[i+iz].opacity > 0) {
                r += (canvas[i+iz].opacity * (TO_LINEAR(canvas[i+iz].r)-r));
                g += (canvas[i+iz].opacity * (TO_LINEAR(canvas[i+iz].g)-g));
                b += (canvas[i+iz].opacity * (TO_LINEAR(canvas[i+iz].b)-b));
            }
            iz += layer_size;
        }
        local ao_fac = 0.5 + (0.5 * (buffer_ao[i] / counted_samples));
        if (ao_fac > 1) { ao_fac = 1; }

        local r = FROM_LINEAR(r * ao_fac);
        local g = FROM_LINEAR(g * ao_fac);
        local b = FROM_LINEAR(b * ao_fac);
        render_buffer_final_col[i] = COMBINE_RGB_CHANNELS(r, g, b);
        i++;
    }
}

# ambient occlusion, normalised to greyscale 0-1
proc cmp_aligned_ao {
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        local ao_fac = FROM_LINEAR((1 * buffer_ao[i]) / counted_samples);
        if (ao_fac > 1) { ao_fac = 1; }
        
        render_buffer_final_col[i] = COMBINE_RGB_CHANNELS(ao_fac, ao_fac, ao_fac);
        i++;
    }
}





# any changes that would make the raytracer settings different should be in the hash
%define LAST_RAYTRACER_CONFIG_HASH() (canvas_size_x & "," & canvas_size_y & "," & viewport_mode)

proc init_aligned_raytracer {
    counted_samples = 1;
    reset_render_RGB;

    # this shouldn't need to be regenerated unless the canvas size changed or viewport mode changed
    local config = LAST_RAYTRACER_CONFIG_HASH();
    if (last_raytracer_config != config) {
        # create rays
        raytracer_ray_direction = XYZ {x:0, y:0, z:-1};
        delete raytracer_ray_origins;

        iy = 0.5; # start at center of voxel
        repeat (canvas_size_y) {
            ix = 0.5;
            repeat (canvas_size_x) {
                add XYZ {x:ix, y:iy, z:canvas_size_z+1} to raytracer_ray_origins;
                ix++;
            }
            iy++;
        }
        last_raytracer_config = config;
    }
}

proc init_orbit_raytracer {
    # this has to run every time the camera is updated, there is no way around needing to reset the raytracer

    counted_samples = 1;
    reset_render_RGB;

    raytracer_ray_direction = rotate_cam_space_to_world_space(0,0,-1);
    
    # create raytracer origins list
    delete raytracer_ray_origins;
    pixel_size = ((((canvas_size_x + canvas_size_y)/2) / ((render_size_x + render_size_y)/2)) / cam_scale);
    iy = render_size_y / -2;
    repeat (render_size_y) {
        ix = render_size_x / -2;
        repeat (render_size_x) {
            local XYZ origin = rotate_cam_space_to_world_space(ix*pixel_size, iy*pixel_size, 50);
            # project the origin point to the top of the canvas, at z=canvas_size_z
            local steps_from_top = ((canvas_size_z+1)-origin.z) / raytracer_ray_direction.z;
            add XYZ {x:origin.x+steps_from_top*raytracer_ray_direction.x+cam_x, y:origin.y+steps_from_top*raytracer_ray_direction.y+cam_y, z:canvas_size_z+1} to raytracer_ray_origins;

            ix += 1;
        }
        iy += 1;
    }
    last_raytracer_config = LAST_RAYTRACER_CONFIG_HASH(); # not actually used by orbit raytracer, too much to track and changes too often
}

# general-purpose pathtracer using raytracer_ray_origins and raytracer_ray_direction as ray source
proc iterate_generic_pathtracer max_samples, max_time, filter_size {
    start_time = days_since_2000();
    
    repeat $max_samples {

        set_sample_pixel_shift $filter_size;

        i = 1;
        repeat (render_size_x * render_size_y) {
            local acc_col_r = 0;
            local acc_col_g = 0;
            local acc_col_b = 0;
            local throughput_r = 1;
            local throughput_g = 1;
            local throughput_b = 1;

            vec_x = raytracer_ray_direction.x; # set initially just in case the first ray doesn't hit anything, it's used for sky color
            vec_y = raytracer_ray_direction.y;
            vec_z = raytracer_ray_direction.z;
            current_opacity = 0;

            raycast_wrapped_canvas raytracer_ray_origins[i].x+shift.x, raytracer_ray_origins[i].y+shift.y, raytracer_ray_origins[i].z+shift.z, vec_x, vec_y, vec_z;
            
            local bounces_left = 6; # 4 is perceptually sufficient for opaque voxels
            until bounces_left < 1 { # repeat until allows for breaking out of it
                if (hit_index > 0) {
                    # get voxel info
                    linear_col_r = TO_LINEAR(canvas[hit_index].r);
                    linear_col_g = TO_LINEAR(canvas[hit_index].g);
                    linear_col_b = TO_LINEAR(canvas[hit_index].b);
                    opacity = canvas[hit_index].opacity;
                    emission = canvas[hit_index].emission;

                    # shoot a new ray
                    if (RANDOM_0_1() < (opacity - current_opacity)) {
                        # diffuse bounce

                        # add light from emission
                        acc_col_r += throughput_r * (linear_col_r * (emission * PS_emission_intensity));
                        acc_col_g += throughput_g * (linear_col_g * (emission * PS_emission_intensity));
                        acc_col_b += throughput_b * (linear_col_b * (emission * PS_emission_intensity));

                        # update throughput (scales towards 0)
                        throughput_r *= linear_col_r;
                        throughput_g *= linear_col_g;
                        throughput_b *= linear_col_b;

                        if (side == 0) {
                            if (step_x > 0) { 
                                # normal -X
                                random_lambertian_vector -1, 0, 0;
                                raycast_wrapped_canvas hit_position.x-0.001, hit_position.y, hit_position.z, vec_x, vec_y, vec_z;
                            } else { 
                                # normal +X
                                random_lambertian_vector 1, 0, 0;
                                raycast_wrapped_canvas hit_position.x+0.001, hit_position.y, hit_position.z, vec_x, vec_y, vec_z;
                            }
                        } elif (side == 1) {
                            if (step_y > 0) { 
                                # normal -Y
                                random_lambertian_vector 0, -1, 0;
                                raycast_wrapped_canvas hit_position.x, hit_position.y-0.001, hit_position.z, vec_x, vec_y, vec_z;
                            } else { 
                                # normal +Y
                                random_lambertian_vector 0, 1, 0;
                                raycast_wrapped_canvas hit_position.x, hit_position.y+0.001, hit_position.z, vec_x, vec_y, vec_z;
                            }
                        } else {
                            if (step_z > 0) { 
                                # normal -Z
                                random_lambertian_vector 0, 0, -1;
                                raycast_wrapped_canvas hit_position.x, hit_position.y, hit_position.z-0.001, vec_x, vec_y, vec_z;
                            } else { 
                                # normal +Z
                                random_lambertian_vector 0, 0, 1;
                                raycast_wrapped_canvas hit_position.x, hit_position.y, hit_position.z+0.001, vec_x, vec_y, vec_z;
                            }
                        }
                        current_opacity = 0;
                        bounces_left -= 1;
                    } else {
                        # transparency - pass through unimpeded
                        # TODO: optimise with a single raycast
                        raycast_wrapped_canvas hit_position.x + vec_x*0.001, hit_position.y + vec_y*0.001, hit_position.z + vec_z*0.001, vec_x, vec_y, vec_z;
                        current_opacity = opacity;
                        # does not contribute to bounces
                    }

                } else {
                    bounces_left = 0; # break out ot the loop
                }
                
            }

            # this final check is because the above loop stops before its own check
            if (hit_index > 0) {
                # add light from emission
                opacity = canvas[hit_index].opacity;
                acc_col_r += throughput_r * TO_LINEAR(canvas[hit_index].r) * (canvas[hit_index].emission * PS_emission_intensity) * opacity;
                acc_col_g += throughput_g * TO_LINEAR(canvas[hit_index].g) * (canvas[hit_index].emission * PS_emission_intensity) * opacity;
                acc_col_b += throughput_b * TO_LINEAR(canvas[hit_index].b) * (canvas[hit_index].emission * PS_emission_intensity) * opacity;
            } else {
                # sky
                local sun_alignment = DOT_PRODUCT_3D(vec_x, vec_y, vec_z, sun_direction.x, sun_direction.y, sun_direction.z);
                if (sun_alignment > 0.95) {
                    acc_col_r += throughput_r * PS_sun_intensity;
                    acc_col_g += throughput_g * PS_sun_intensity; 
                    acc_col_b += throughput_b * PS_sun_intensity;
                } else {
                    acc_col_r += throughput_r * PS_sky_intensity;
                    acc_col_g += throughput_g * PS_sky_intensity; 
                    acc_col_b += throughput_b * PS_sky_intensity;
                }
            }

            # add to result
            buffer_r[i] += acc_col_r;
            buffer_g[i] += acc_col_g;
            buffer_b[i] += acc_col_b;

            # convert to displayed color
            if PS_use_tone_map {
                PBR_neutral_tone_map (buffer_r[i] / (counted_samples)), (buffer_g[i] / (counted_samples)), (buffer_b[i] / (counted_samples));
                local r = FROM_LINEAR(return_r);
                local g = FROM_LINEAR(return_g);
                local b = FROM_LINEAR(return_b);
            } else {
                local r = FROM_LINEAR(buffer_r[i] / (counted_samples));
                local g = FROM_LINEAR(buffer_g[i] / (counted_samples));
                local b = FROM_LINEAR(buffer_b[i] / (counted_samples));
            }
            if r > 1 {r = 1;}
            if g > 1 {g = 1;}
            if b > 1 {b = 1;}

            render_buffer_final_col[i] = COMBINE_RGB_CHANNELS(r, g, b);

            i++;
        }

        counted_samples += 1;

        if ((days_since_2000()-start_time)*86400 > $max_time) {
            stop_this_script; # out of time
        }
    }
}

%define PBR_NEUTRAL_START_COMPRESSION 0.76
%define PBR_NEUTRAL_DESATURATION 0.15
%define PBR_NEUTRAL_D (1 - PBR_NEUTRAL_START_COMPRESSION)

# https://github.com/KhronosGroup/ToneMapping/blob/main/PBR_Neutral/README.md
proc PBR_neutral_tone_map r, g, b {
    #local startCompression = 0.8 - 0.04;
    #local desaturation = 0.15;
    
    # find min and max
    if ($r < $b) {
        if ($r < $g) {
            if ($g < $b) {
                local chan_min = $r; # AKA `x`
                local chan_max = $b; # AKA `peak`
            } else {
                local chan_min = $r;
                local chan_max = $g;
            }
        } else {
            local chan_min = $g;
            local chan_max = $b;
        }
    } else {
        if ($g < $b) {
            local chan_min = $g;
            local chan_max = $r;
        } else {
            if ($r < $g) {
                local chan_min = $b;
                local chan_max = $g;
            } else {
                local chan_min = $b;
                local chan_max = $r;
            }
        }
    }

    if (chan_min < 0.08) {
        local offset = chan_min - (6.25 * chan_min * chan_min);
    } else {
        local offset = 0.04;
    }
    
    return_r = $r - offset;
    return_g = $g - offset;
    return_b = $b - offset;

    if (chan_max < PBR_NEUTRAL_START_COMPRESSION) {
        stop_this_script;
    }

    #local d = (1 - startCompression);
    local new_peak = 1 - (PBR_NEUTRAL_D * PBR_NEUTRAL_D / ((chan_max + PBR_NEUTRAL_D) - PBR_NEUTRAL_START_COMPRESSION));
    return_r *= (new_peak / chan_max);
    return_g *= (new_peak / chan_max);
    return_b *= (new_peak / chan_max);

    # mix
    local f = 1 / (PBR_NEUTRAL_DESATURATION * (chan_max - new_peak) + 1);
    return_r = f * return_r + (1 - f) * new_peak;
    return_g = f * return_g + (1 - f) * new_peak;
    return_b = f * return_b + (1 - f) * new_peak;
}


proc iterate_generic_ao max_samples, max_time, filter_size {
    start_time = days_since_2000();
    
    repeat $max_samples {

        set_sample_pixel_shift $filter_size;

        i = 1;
        repeat (render_size_x * render_size_y) {
            local throughput = 1;
            
            current_opacity = 0;

            raycast_wrapped_canvas raytracer_ray_origins[i].x+shift.x, raytracer_ray_origins[i].y+shift.y, raytracer_ray_origins[i].z+shift.z, raytracer_ray_direction.x, raytracer_ray_direction.y, raytracer_ray_direction.z;
            
            local bounces_left = 6; # 4 is perceptually sufficient for opaque voxels
            until bounces_left < 1 { # repeat until allows for breaking out of it
                if (hit_index > 0) {
                    # get voxel info
                    opacity = canvas[hit_index].opacity;

                    # shoot a new ray
                    if (RANDOM_0_1() < (opacity - current_opacity)) {
                        # diffuse bounce
                        if (side == 0) {
                            if (step_x > 0) { 
                                # normal -X
                                random_lambertian_vector -1, 0, 0;
                                raycast_wrapped_canvas hit_position.x-0.001, hit_position.y, hit_position.z, vec_x, vec_y, vec_z;
                            } else { 
                                # normal +X
                                random_lambertian_vector 1, 0, 0;
                                raycast_wrapped_canvas hit_position.x+0.001, hit_position.y, hit_position.z, vec_x, vec_y, vec_z;
                            }
                        } elif (side == 1) {
                            if (step_y > 0) { 
                                # normal -Y
                                random_lambertian_vector 0, -1, 0;
                                raycast_wrapped_canvas hit_position.x, hit_position.y-0.001, hit_position.z, vec_x, vec_y, vec_z;
                            } else { 
                                # normal +Y
                                random_lambertian_vector 0, 1, 0;
                                raycast_wrapped_canvas hit_position.x, hit_position.y+0.001, hit_position.z, vec_x, vec_y, vec_z;
                            }
                        } else {
                            if (step_z > 0) { 
                                # normal -Z
                                random_lambertian_vector 0, 0, -1;
                                raycast_wrapped_canvas hit_position.x, hit_position.y, hit_position.z-0.001, vec_x, vec_y, vec_z;
                            } else { 
                                # normal +Z
                                random_lambertian_vector 0, 0, 1;
                                raycast_wrapped_canvas hit_position.x, hit_position.y, hit_position.z+0.001, vec_x, vec_y, vec_z;
                            }
                        }
                        current_opacity = 0;
                        bounces_left -= 1;
                    } else {
                        # transparency
                        
                        # update throughput (scales towards 0)
                        throughput *= (1-opacity);

                        # transparency - pass through unimpeded
                        # TODO: optimise with a single raycast
                        raycast_wrapped_canvas hit_position.x + vec_x*0.001, hit_position.y + vec_y*0.001, hit_position.z + vec_z*0.001, vec_x, vec_y, vec_z;
                        current_opacity = opacity;
                        # does not contribute to bounces
                    }

                } else {
                    bounces_left = 0; # break out ot the loop
                }
            }

            if (not (hit_index > 0)) {
                # sky
                buffer_r[i] += throughput;
            }

            # combine
            local val = FROM_LINEAR(buffer_r[i] / (counted_samples));
            if val > 1 {val = 1;}
            render_buffer_final_col[i] = COMBINE_RGB_CHANNELS(val, val, val);

            i++;
        }

        counted_samples += 1;

        if ((days_since_2000()-start_time)*86400 > $max_time) {
            stop_this_script; # out of time
        }
    }
}

################################
#            Utils             #
################################


func rotate_cam_space_to_world_space(x, y, z) XYZ {
    # rotate point around X
    local XYZ r1 = XYZ {x:$x, y:$y*cos(cam_elev)-$z*sin(cam_elev), z:$y*sin(cam_elev)+$z*cos(cam_elev)};
    # rotate point around Z
    return XYZ {x:r1.x*cos(cam_azi)-r1.y*sin(cam_azi), y:r1.x*sin(cam_azi)+r1.y*cos(cam_azi), z:r1.z};
}

func rotate_vector_intrinsic_zx(x, y, z, angle_x, angle_z) XYZ {
    # rotate point around X
    local XYZ r1 = XYZ {x:$x, y:$y*cos($angle_x)-$z*sin($angle_x), z:$y*sin($angle_x)+$z*cos($angle_x)};
    # rotate point around Z
    return XYZ {x:r1.x*cos($angle_z)-r1.y*sin($angle_z), y:r1.x*sin($angle_z)+r1.y*cos($angle_z), z:r1.z};
}

proc calculate_sun_vector {
    # the direction the sun rotates is probably unconventional, I don't know much about this subject.
    XYZ sun_direction = rotate_vector_intrinsic_zx(0, 1, 0, PS_sun_elevation, -PS_sun_bearing);
}


# Special implementation of 3D DDA, returns ray_light for 2D composited AO. Optimised for downwards rays only.
proc raycast_AO x, y, z, dx, dy, dz {
    local vec_len = sqrt((($dx*$dx)+(($dy*$dy)+($dz*$dz))));
    local scale_x = abs(vec_len/$dx);
    local scale_y = abs(vec_len/$dy);
    local scale_z = abs(vec_len/$dz);
    ray_ix = floor($x);
    ray_iy = floor($y);
    ray_iz = floor($z);
    if ($dx < 0) {
        step_x = -1;
        local len_x = (($x%1)*scale_x);
    } else {
        step_x = 1;
        local len_x = ((1-($x%1))*scale_x);
    }
    if ($dy < 0) {
        step_y = -1;
        local len_y = (($y%1)*scale_y);
    } else {
        step_y = 1;
        local len_y = ((1-($y%1))*scale_y);
    }
    if ($dz < 0) {
        step_z = -1;
        local len_z = (($z%1)*scale_z);
    } else {
        step_z = 1;
        local len_z = ((1-($z%1))*scale_z);
    }

    ray_light = 1; # this variable is returned, is not local to this procedure
    
    forever {
        # find the shortest len variable and increase it:
        if (len_x < len_z) {
            if (len_x < len_y) {
                len_x += scale_x;
                ray_ix += step_x;
            } else {
                len_y += scale_y;
                ray_iy += step_y;
            }
        } else {
            if (len_y < len_z) {
                len_y += scale_y;
                ray_iy += step_y;
            } else {
                len_z += scale_z;
                ray_iz += step_z;
            }
        }

        local alpha = canvas[INDEX_FROM_3D_CANVAS(ray_ix, ray_iy, ray_iz, canvas_size_x, canvas_size_y)].opacity;

        if (alpha == "") { stop_this_script; } # did not get a list item, therefore out of bounds along z
        
        ray_light *= (1-alpha);
        
        if (ray_light < 0.001) { stop_this_script; } # too dark, hit enough voxels
    }
}


# 3D DDA raycast with wrapped canvas
# some variables are not local because they are used elsewhere
proc raycast_wrapped_canvas x, y, z, dx, dy, dz {
    local vec_len = sqrt((($dx*$dx)+(($dy*$dy)+($dz*$dz))));
    #ray_dx = $dx/vec_len;
    #ray_dy = $dy/vec_len;
    #ray_dz = $dz/vec_len;
    local scale_x = abs(vec_len/$dx);
    local scale_y = abs(vec_len/$dy);
    local scale_z = abs(vec_len/$dz);
    ray_ix = floor($x);
    ray_iy = floor($y);
    ray_iz = floor($z);
    if ($dx < 0) {
        step_x = -1;
        local len_x = (($x%1)*scale_x);
    } else {
        step_x = 1;
        local len_x = ((1-($x%1))*scale_x);
    }
    if ($dy < 0) {
        step_y = -1;
        local len_y = (($y%1)*scale_y);
    } else {
        step_y = 1;
        local len_y = ((1-($y%1))*scale_y);
    }
    if ($dz < 0) {
        step_z = -1;
        local len_z = (($z%1)*scale_z);
    } else {
        step_z = 1;
        local len_z = ((1-($z%1))*scale_z);
    }

    hit_index = 0; # no hit

    repeat ((canvas_size_x+canvas_size_y+canvas_size_z)*12) { # todo: make it not stop short on some canvases
        # find the shortest len variable and increase it:
        if (len_x < len_z) {
            if (len_x < len_y) {
                local last_len = len_x;
                len_x += scale_x;
                ray_ix += step_x;
                side = 0;
            } else {
                local last_len = len_y;
                len_y += scale_y;
                ray_iy += step_y;
                side = 1;
            }
        } else {
            if (len_y < len_z) {
                local last_len = len_y;
                len_y += scale_y;
                ray_iy += step_y;
                side = 1;
            } else {
                local last_len = len_z;
                len_z += scale_z;
                ray_iz += step_z;
                side = 2;
            }
        }

        # check if the ray is leaving the canvas
        if (step_z > 0 and ray_iz > canvas_size_z or ray_iz < 0) {
            hit_index = 0; # no hit
            stop_this_script;
        }
        
        # get the voxel, wrapped along x and y axis
        hit_index = INDEX_FROM_3D_CANVAS(ray_ix, ray_iy, ray_iz, canvas_size_x, canvas_size_y);
        local alpha = canvas[hit_index].opacity;
        
        if (alpha > 0) { # hit! 
            # calculate intersection point on voxel surface and return it with variables for flexibility
            XYZ hit_position = XYZ {x:$x+$dx*(last_len/vec_len), y:$y+$dy*(last_len/vec_len), z:$z+$dz*(last_len/vec_len)};
            stop_this_script;
        }
    }

    hit_index = 0;
}


proc normalise_vector nx, ny, nz {
    local vec_len = VEC3_LEN($nx, $ny, $nz);
    vec_x /= vec_len;
    vec_y /= vec_len;
    vec_z /= vec_len;
}


# generate a random normalised hemisphere vector
proc random_vector nx, ny, nz {
    forever {
        vec_x = random("-1.0", "1.0");
        vec_y = random("-1.0", "1.0");
        vec_z = random("-1.0", "1.0");
        local vec_len = VEC3_LEN(vec_x, vec_y, vec_z);
        if (vec_len < 1 and vec_len > 0.001) {
            vec_x /= vec_len;
            vec_y /= vec_len;
            vec_z /= vec_len;

            if DOT_PRODUCT_3D(vec_x, vec_y, vec_z, $nx, $ny, $nz) < 0 {
                vec_x *= -1;
                vec_y *= -1;
                vec_z *= -1;
            }

            stop_this_script;
        }
    }
}


# generate a random normalised vector, weighted towards normal
# see: https://raytracing.github.io/books/RayTracingInOneWeekend.html#diffusematerials/truelambertianreflection
proc random_lambertian_vector nx, ny, nz {
    forever {
        vec_x = random("-1.0", "1.0");
        vec_y = random("-1.0", "1.0");
        vec_z = random("-1.0", "1.0");
        local vec_len = VEC3_LEN(vec_x, vec_y, vec_z);
        if (vec_len < 1) {
            # normalise and add normal
            vec_x = vec_x/vec_len + $nx;
            vec_y = vec_y/vec_len + $ny;
            vec_z = vec_z/vec_len + $nz;

            # renormalise
            local vec_len = VEC3_LEN(vec_x, vec_y, vec_z);
            if (vec_len > 0.001) {
                vec_x /= vec_len;
                vec_y /= vec_len;
                vec_z /= vec_len;

                stop_this_script;
            }
        }
    }
}


# resize the render buffer (final col only)
proc resize_render_buffer {
    if ((length render_buffer_final_col) != (render_size_x * render_size_y)) {
        delete render_buffer_final_col;
        repeat (render_size_x * render_size_y) {
            add 0 to render_buffer_final_col;
        }
    }
}

# set the render buffer to 0, required by raytracers as these are used additively.
proc reset_render_RGB {
    delete buffer_r;
    delete buffer_g;
    delete buffer_b;
    repeat (render_size_x * render_size_y) {
        add 0 to buffer_r;
        add 0 to buffer_g;
        add 0 to buffer_b;
    }
}

proc set_sample_pixel_shift filter_size {
    # create a random translation in camera space, with filter_size being the total width of the shift interval.

    if (viewport_mode == ViewportMode.ALIGNED) {
        XYZ shift = XYZ {x:random(-0.5, 0.5)*$filter_size, y:random(-0.5, 0.5)*$filter_size, z:0};
    } else {
        XYZ shift = rotate_cam_space_to_world_space(random(-0.5, 0.5)*pixel_size*$filter_size, random(-0.5, 0.5)*pixel_size*$filter_size, 0);
        
        # project to the XY plane
        local steps_from_top = (-shift.z) / raytracer_ray_direction.z;
        shift.x += steps_from_top*raytracer_ray_direction.x;
        shift.y += steps_from_top*raytracer_ray_direction.y;
        shift.z = 0;
    }
}

