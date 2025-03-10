%include common/common.gs;

costumes "costumes/blank.svg" as "blank";
hide;


on "initalise" {
    hide;
}

on "hard reset" {
    
}

on "*" {
    delete_all_templates;
    add_canvas_as_template;
    load_template_to_canvas 0;
    stamp_template 0, 0, 0, 0;
}


on "generate pipes" {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 8;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.7, 0.7, 0.6;
    draw_base_layer;

    repeat 100 {
        set_depositor_from_sRGB random(0, "1.0"), random(0, "1.0"), random(0, "1.0");
        depositor_voxel.opacity = random(0.5, "1.0");

        random_walk_taxicab RANDOM_X, RANDOM_Y, RANDOM_Z, 20, 5;
    }

    require_composite = true;
}


on "generate refinery" {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 16;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.7, 0.7, 0.6;
    draw_base_layer;

    tank_rad = 8;
    # spherical tanks
    repeat 3 {
        brightness = random(0.9, 1);
        set_depositor_from_sRGB brightness, brightness, brightness;
        
        tank_x = floor(RANDOM_X * 16)/16;
        tank_y = floor(RANDOM_Y * 16)/16;

        draw_sphere tank_x, tank_y, tank_rad/2, tank_rad;

        brightness = random(0.5, 1);
        set_depositor_from_sRGB brightness, brightness, brightness;

        random_walk_taxicab tank_x+tank_rad, tank_y, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x-tank_rad, tank_y, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x, tank_y+tank_rad, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x, tank_y-tank_rad, random(1, tank_rad/2), 12, 16;
    }
    
    require_composite = true;
}


on "generate city" { generate_city; }
proc generate_city {
    canvas_size_x = 128;
    canvas_size_y = 128;
    canvas_size_z = 16;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.7, 0.7, 0.6;
    draw_base_layer;

    repeat 300 { # cuboids and low pipes
        brightness = random(0.5, 0.9);
        set_depositor_from_sRGB brightness, brightness, brightness;

        local c1x = RANDOM_X;
        local c1y = RANDOM_Y;
        local cube_x = random(2,16);
        local cube_y = random(2,16);
        local cube_z = random(1, 15);

        draw_cuboid_corner_size c1x, c1y, 0, cube_x, cube_y, cube_z-1;
        draw_cuboid_corner_size c1x+1, c1y+1, 0, cube_x-2, cube_y-2, cube_z;
    }
    repeat 90 { # pipes, grey
        brightness = random(0.5, 0.7);
        set_depositor_from_sRGB brightness+random(-0.1, 0.1), brightness+random(-0.1, 0.1), brightness+random(-0.1, 0.1);
        random_walk_taxicab RANDOM_X, RANDOM_Y, random(1, 12), 16, 20;
    }
    repeat 10 { # pipes multicolor
        set_depositor_from_sRGB random(0.4, 0.9), random(0.4, 0.9), random(0.4, 0.9);
        random_walk_taxicab RANDOM_X, RANDOM_Y, random(1, 16), 16, 20;
    }
    repeat 10 { # high pipes
        set_depositor_from_sRGB random(0.4, 0.8), random(0.4, 0.8), random(0.4, 0.8);
        random_walk_taxicab RANDOM_X, RANDOM_Y, random(1, 16), 16, 20;
    }
    set_depositor_from_sRGB 0.65, 0.65, 0.75;
    repeat 30 {
        draw_sphere floor(RANDOM_X * 16)/16, floor(RANDOM_Y * 16)/16, random(1, 6), random(1, 6);
    }
    
    require_composite = true;
}




on "generate unknown" { generate_unknown; }
proc generate_unknown {
    canvas_size_x = 128;
    canvas_size_y = 128;
    canvas_size_z = 16;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.7, 0.7, 0.6;
    draw_base_layer;

    repeat 10 {
        draw_cuboid_corner_size RANDOM_X, RANDOM_Y, 0, random(1,18), random(1,18), random(1, canvas_size_z*0.5);
    }

    repeat 10 {
        draw_line_DDA RANDOM_X, RANDOM_Y, RANDOM_Z, random("-1.0","1.0"), random("-1.0","1.0"), 0, random(1, 20);
    }
    draw_cylinder RANDOM_X, RANDOM_Y, 0, 10, 3;
    glbfx_jitter 0.2;
    set_depositor_to_air;
    glbfx_surface_replace 0.2;
    glbfx_spatter 0.2;
    glbfx_melt 0.1;
    glbfx_color_noise "0.9", "1.1";

    require_composite = true;
}



on "generate carpet" { generate_carpet; }
proc generate_carpet {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 12;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.9, 0.9, 0.9;
    draw_base_layer;

    glbfx_color_noise "0.9", "1.1";

    repeat 100 {
        set_depositor_from_sRGB random(0, "0.2"), random(0.2, 0.9), random(0.2, 0.9);
        repeat 10 {
            draw_line_DDA RANDOM_X, RANDOM_Y, RANDOM_Z, random("-1.0","1.0"), random("-1.0","1.0"), 0, random(1, 20);
        }
        glbfx_jitter 0.003;
    }
    
    require_composite = true;
}


on "generate green weave" { generate_gw; }
proc generate_gw {
    canvas_size_x = 128;
    canvas_size_y = 128;
    canvas_size_z = 12;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.3, 0.6, 0.3;
    draw_base_layer;
    glbfx_color_noise 0.5, 1;

    repeat 600 {
        set_depositor_from_sRGB 0.2, random(0.2, 0.5), 0.2;
        random_walk_any RANDOM_X, RANDOM_Y, RANDOM_Z, 0, 20, 5, 45;
    }
    
    repeat 15 {
    set_depositor_from_sRGB 0.7, random(0.9, 1.0), 0.7;
        random_walk_any RANDOM_X, RANDOM_Y, RANDOM_Z, 0, 20, 5, 45;
    }
    
    require_composite = true;
}


on "generate grad" { generate_grad; }
proc generate_grad {
    canvas_size_x = 101;
    canvas_size_y = 101;
    canvas_size_z = 2;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.5, 0.5, 0.5;
    draw_base_layer;

    local px_y = 0;
    repeat 101 {
        local px_x = 0;
        repeat 101 {
            set_depositor_from_HSV px_x/100, px_y/100, 1;
            set_voxel px_x, px_y, 0;
            px_x++;
        }
        px_y++;
    }
    
    require_composite = true;
}


################################
#          Templates           #
################################
# Templates are used to temporarily store canvases to be loaded later or drawn by the depositor. They may be used for storing textures, shapes, etc.

proc delete_all_templates {
    delete depositor_template_metadata;
    delete depositor_template_voxels;
}

proc add_canvas_as_template {
    # metadata
    add template_metadata { ptr:(1+length depositor_template_voxels), sx:canvas_size_x, sy:canvas_size_y, sz:canvas_size_z } to depositor_template_metadata;
    
    # copy canvas
    template_i = 1;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add canvas[template_i] to depositor_template_voxels;
        template_i++;
    }
}

proc load_template_to_canvas index {
    template_i = depositor_template_metadata[$index].ptr;

    if (template_i != "") {
        # read metadata
        canvas_size_x = depositor_template_metadata[$index].sx;
        canvas_size_y = depositor_template_metadata[$index].sy;
        canvas_size_z = depositor_template_metadata[$index].sz;

        # copy template
        delete canvas;
        repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
            add depositor_template_voxels[template_i] to canvas;
            template_i++;
        }
    }
}

# place the entire template in the canvas, intended for a small template. Uses the depositor.
proc stamp_template index, x, y, z {
    template_i = depositor_template_metadata[$index].ptr;

    if (template_i != "") {
        # read metadata
        local template_size_x = depositor_template_metadata[$index].sx;
        local template_size_y = depositor_template_metadata[$index].sy;
        local template_size_z = depositor_template_metadata[$index].sz;

        # copy template
        local px_z = floor($z);
        repeat template_size_x {
            local px_y = floor($y);
            repeat template_size_y {
                local px_x = floor($x);
                repeat template_size_z {
                    # remember that wrapping is needed:
                    local set_canvas_index = INDEX_FROM_3D_CANVAS_INTS(px_x, px_y, px_z, canvas_size_x, canvas_size_y); 
                    if (depositor_replace == true or canvas[set_canvas_index].opacity == 0) { 
                        canvas[set_canvas_index] = depositor_template_voxels[template_i];
                    }
                    px_x++;
                }
                px_y++;
            }
            px_z++;
        }
    }
}




################################
#        Set depositor         #
################################


proc reset_depositor {
    depositor_mode = DepositorMode.DRAW;
    depositor_replace = true;
    depositor_voxel = VOXEL_SOLID_GREY(1);
    depositor_template_index = 0;
    depositor_template_origin = XYZ {x:0, y:0, z:0};
}

proc set_depositor_to_air {
    depositor_mode = DepositorMode.DRAW;
    depositor_replace = true; # assumes that the user wants to erase voxels
    depositor_voxel = VOXEL_NONE;
}

proc set_depositor_from_sRGB r, g, b {
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = VOXEL_SOLID(ROOT($r, 2.2), ROOT($g, 2.2), ROOT($b, 2.2)); # convert to linear
}

proc set_depositor_from_HSV h, s, v {
    local RGB col = HSV_to_RGB($h, $s, $v); 
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = VOXEL_SOLID(ROOT(col.r, 2.2), ROOT(col.g, 2.2), ROOT(col.b, 2.2)); # convert to linear
}

proc set_depositor_to_template slot_index, ox, oy, oz {
    depositor_mode = DepositorMode.TEMPLATE;
    depositor_template_index = $slot_index;
    depositor_template_origin = XYZ {x:$ox, y:$oy, z:$oz};
}




# some of these may be better moved to a separate file, import them in (if the lists allow this)

################################
#             Misc             #
################################


# set a canvas voxel at a given position using the current depositor. Accounts for wrapping on X, Y
proc set_voxel x, y, z {
    if ($z >= 0 and $z < canvas_size_z) { # only set the voxel if z is in range
        local set_canvas_index = INDEX_FROM_3D_CANVAS($x, $y, $z, canvas_size_x, canvas_size_y); 

        if (depositor_replace == true or canvas[set_canvas_index].opacity == 0) { # only place if replace OR the canvas is air
            if (depositor_mode == DepositorMode.DRAW) {
                canvas[set_canvas_index] = depositor_voxel; # set voxel with brush
            } else {
                local template_sx = depositor_template_metadata[depositor_template_index].sx; # this is read multiple times so should be faster when stored in a var
                local template_sy = depositor_template_metadata[depositor_template_index].sy;
                # get the template index which is ptr + 3D index
                local tex_idx = depositor_template_metadata[depositor_template_index].ptr + INDEX_FROM_3D($x-depositor_template_origin.x, $y-depositor_template_origin.y, $z-depositor_template_origin.z, template_sx, template_sy, depositor_template_metadata[depositor_template_index].sz);
                
                canvas[set_canvas_index] = depositor_template_voxels[tex_idx];
            }
        }
    }
}


################################
#            Shapes            #
################################


on "clear canvas" { clear_canvas; }
proc clear_canvas  {
    delete canvas;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add VOXEL_NONE to canvas;
    }

    require_composite = true;
}


proc draw_base_layer {
    local px_y = 0;
    repeat canvas_size_y {
        local px_x = 0;
        repeat canvas_size_x {
            set_voxel px_x, px_y, 0;
            px_x++;
        }
        px_y++;
    }
    require_composite = true;
}


# draw a cylinder on the XY plane, extruded along Z. Negative height allowed.
proc draw_cylinder x, y, z, radius, height {
    local bb_width = round(2 * $radius); # bounding box width
    local bb_min = 0.5 + (bb_width * -0.5); # bounding box local minima

    local px_z = $z - (($height < 0)*round($height)); # handled differently, always start from base
    repeat round($height) {
        local px_y = bb_min;
        repeat bb_width {
            local px_x = bb_min;
            repeat bb_width {
                if VEC2_LEN(px_x, px_y) <= $radius { 
                    # the distance calculation prevents px from being stored as canvas space coordinates
                    set_voxel $x+px_x, $y+px_y, px_z;
                }
                px_x++;
            }
            px_y++;
        }
        px_z++;
    }
}



# sphere centered exactly at the given coordinates (not voxel counts)
proc draw_sphere x, y, z, radius {
    local bb_width = round(2 * $radius); # bounding box width
    local bb_min = 0.5 + (bb_width * -0.5); # bounding box local minima
    
    local px_z = bb_min;
    repeat bb_width {
        local px_y = bb_min;
        repeat bb_width {
            local px_x = bb_min;
            repeat bb_width {
                if VEC3_LEN(px_x, px_y, px_z) <= $radius { 
                    # the distance calculation prevents px from being stored as canvas space coordinates
                    set_voxel $x+px_x, $y+px_y, $z+px_z;
                }
                px_x++;
            }
            px_y++;
        }
        px_z++;
    }
}



# rectangular prism between from a corner
proc draw_cuboid_corner_size x, y, z, size_x, size_y, size_z {
    local px_z = $z;
    repeat abs(round($size_z)) {
        local px_y = $y;
        repeat abs(round($size_y)) {
            local px_x = $x;
            repeat abs(round($size_x)) {
                set_voxel px_x, px_y, px_z;
                px_x++;
            }
            px_y++;
        }
        px_z++;
    }
}


# rectangular prism centered at x,y,z
proc draw_cuboid_centered x, y, z, size_x, size_y, size_z {
    draw_cuboid_corner_size 0.5-(round($size_x)/2), 0.5-(round($size_y)/2), 0.5-(round($size_z)/2), round($size_x), round($size_y), round($size_z);
}



# randomly deposit molecules through breadth-first search
proc crystal_growth x, y, z, size_x, size_y, size_z {
    # TODO
    # store list of voxels to explore
}



# random walk in a 2D plane using taxicab movement (X and Y axis only)
proc random_walk_taxicab x, y, z, turns, steps {
    local agent_x = $x;
    local agent_y = $y;

    repeat $turns {
        if (random(0, 1) == 0) {
            if (random(0, 1) == 0) {
                repeat random(1, $steps) {
                    agent_x += 1;
                    set_voxel agent_x, agent_y, $z;
                }
            } else {
                repeat random(1, $steps) {
                    agent_x += -1;
                    set_voxel agent_x, agent_y, $z;
                }
            }
        } else {
            if (random(0, 1) == 0) {
                repeat random(1, $steps) {
                    agent_y += 1;
                    set_voxel agent_x, agent_y, $z;
                }
            } else {
                repeat random(1, $steps) {
                    agent_y += -1;
                    set_voxel agent_x, agent_y, $z;
                }
            }
        }
    }
}



# random XY walk, snapping to particular angles
proc random_walk_any x, y, z, start_dir, turns, steps, angle {
    local agent_x = $x;
    local agent_y = $y;
    local agent_dir = $start_dir;

    repeat $turns {
        local dist = random(1, $steps);
        draw_line_DDA agent_x, agent_y, $z, cos(agent_dir), sin(agent_dir), 0, dist;
        agent_x += dist * cos(agent_dir);
        agent_y += dist * sin(agent_dir);
        agent_dir += random(-1,1)*$angle;
    }
}



# 3D DDA
proc draw_line_DDA x, y, z, dx, dy, dz, r {
    local vec_len = VEC3_LEN($dx, $dy, $dz);
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

    until (len_x > $r and len_y > $r and len_z > $r) {
        
        set_voxel raycast_ix, raycast_iy, raycast_iz; # set voxel at current location

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

        if (raycast_iz > canvas_size_z or raycast_iz < 0) {
            stop_this_script; # reached canvas height limits
        }
    }
}


################################
#       Global effects         #
################################
# (glbfx)


# replace exposed surfaces randomly
proc glbfx_surface_replace probability {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $probability) {
        local px_x = random(0, canvas_size_x-1);
        local px_y = random(0, canvas_size_y-1);
        local px_z = random(0, canvas_size_z-1);

        if (canvas[INDEX_FROM_3D_NOWRAP_INTS(px_x, px_y, px_z, canvas_size_x, canvas_size_y)].opacity > 0) {
            
            if (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x+1, px_y, px_z, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x-1, px_y, px_z, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y+1, px_z, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y-1, px_z, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y, px_z+1, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y, px_z-1, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            }
        }
    }
}


# deposit voxels adjacent to any non-air surface randomly
proc glbfx_spatter probability {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $probability) {
        local px_x = random(0, canvas_size_x-1);
        local px_y = random(0, canvas_size_y-1);
        local px_z = random(0, canvas_size_z-1);

        if (canvas[INDEX_FROM_3D_NOWRAP_INTS(px_x, px_y, px_z, canvas_size_x, canvas_size_y)].opacity == 0) {
            if (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x+1, px_y, px_z, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x-1, px_y, px_z, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y+1, px_z, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y-1, px_z, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y, px_z+1, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y, px_z-1, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            }
        }
    }
}


# randomly shift voxels, swapping with neighbours
proc glbfx_jitter probability {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $probability) {
        local jitter_x = random(0, canvas_size_x-1);
        local jitter_y = random(0, canvas_size_y-1);
        local jitter_z = random(0, canvas_size_z-2); # do not cross upper boundary

        local jitter_i1 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y, jitter_z, canvas_size_x, canvas_size_y);
        if RANDOM_0_1 < 0.333 {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x+1, jitter_y, jitter_z, canvas_size_x, canvas_size_y); # x
        } elif random(0,1) == 0 {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y+1, jitter_z, canvas_size_x, canvas_size_y); # y
        } else {
            local jitter_i2 = jitter_i1 + (canvas_size_x * canvas_size_y); # z
        }

        local voxel temp_voxel = canvas[jitter_i1];
        canvas[jitter_i1] = canvas[jitter_i2];
        canvas[jitter_i2] = temp_voxel;
    }
}


# randomly average pairs of non-air voxels
proc glbfx_melt probability {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $probability) {
        local jitter_x = random(0, canvas_size_x-1);
        local jitter_y = random(0, canvas_size_y-1);
        local jitter_z = random(0, canvas_size_z-2); # do not cross upper boundary

        local jitter_i1 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y, jitter_z, canvas_size_x, canvas_size_y);
        if RANDOM_0_1 < 0.333 {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x+1, jitter_y, jitter_z, canvas_size_x, canvas_size_y); # x
        } elif random(0,1) == 0 {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y+1, jitter_z, canvas_size_x, canvas_size_y); # y
        } else {
            local jitter_i2 = jitter_i1 + (canvas_size_x * canvas_size_y); # z
        }

        if (canvas[jitter_i1].opacity > 0 and canvas[jitter_i2].opacity > 0) { # don't melt air
            canvas[jitter_i1].opacity = AVERAGE(canvas[jitter_i1].opacity, canvas[jitter_i2].opacity);
            canvas[jitter_i1].r = AVERAGE(canvas[jitter_i1].r, canvas[jitter_i2].r);
            canvas[jitter_i1].g = AVERAGE(canvas[jitter_i1].g, canvas[jitter_i2].g);
            canvas[jitter_i1].b = AVERAGE(canvas[jitter_i1].b, canvas[jitter_i2].b);
            canvas[jitter_i1].emission = AVERAGE(canvas[jitter_i1].emission, canvas[jitter_i2].emission);
            canvas[jitter_i2] = canvas[jitter_i1];
        }
    }
}


# darken voxels randomly
proc glbfx_color_noise min, max {
    local i = 1;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        canvas[i].r *= random($min, $max);
        if canvas[i].r < 0 { canvas[i].r = 0; }
        if canvas[i].r > 1 { canvas[i].r = 1; }

        canvas[i].g *= random($min, $max);
        if canvas[i].g < 0 { canvas[i].g = 0; }
        if canvas[i].g > 1 { canvas[i].g = 1; }

        canvas[i].b *= random($min, $max);
        if canvas[i].b < 0 { canvas[i].b = 0; }
        if canvas[i].b > 1 { canvas[i].b = 1; }
        
        i++;
    }
}
