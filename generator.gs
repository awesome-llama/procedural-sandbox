%include common/common.gs;

costumes "costumes/blank.svg" as "blank";
hide;


on "initalise" {
    hide;
}

on "hard reset" {
    
}


on "generate pipes" {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 8;
    clear_canvas;
    set_base_layer 0.7, 0.7, 0.6;
    reset_depositor;

    repeat 100 {
        depositor_voxel.r = random(0, "1.0");
        depositor_voxel.g = random(0, "1.0");
        depositor_voxel.b = random(0, "1.0");
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
    set_base_layer 0.7, 0.7, 0.6;
    reset_depositor;

    tank_rad = 8;
    # spherical tanks
    repeat 5 {
        brightness = random(0.9, 1);
        depositor_voxel = VOXEL_SOLID(brightness, brightness, brightness);
        
        tank_x = floor(RANDOM_X * 16)/16;
        tank_y = floor(RANDOM_Y * 16)/16;

        draw_sphere tank_x, tank_y, tank_rad/2, tank_rad;

        brightness = random(0.5, 1);
        depositor_voxel = VOXEL_SOLID(brightness, brightness, brightness);

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
    set_base_layer 0.7, 0.7, 0.6;
    reset_depositor;

    repeat 300 { # cuboids and low pipes
        brightness = random(0.5, 0.9);
        depositor_voxel = VOXEL_SOLID(brightness, brightness, brightness);


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
    set_base_layer 0.7, 0.7, 0.6;
    reset_depositor;

    repeat 10 {
        draw_cuboid_corner_size RANDOM_X, RANDOM_Y, 0, random(1,18), random(1,18), random(1, canvas_size_z*0.5);
    }

    repeat 10 {
        draw_line_DDA RANDOM_X, RANDOM_Y, RANDOM_Z, random("-1.0","1.0"), random("-1.0","1.0"), 0, random(1, 20);
    }
    draw_cylinder RANDOM_X, RANDOM_Y, 0, 10, 3;
    glbfx_jitter 0.2;
    glbfx_spall 0.2;
    glbfx_color_noise "0.9", "1.1";

    require_composite = true;
}



on "generate carpet" { generate_carpet; }
proc generate_carpet {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 12;

    clear_canvas;
    set_base_layer 0.9, 0.9, 0.9;
    glbfx_color_noise "0.9", "1.1";

    reset_depositor;

    repeat 100 {
        set_depositor_from_sRGB random(0, "0.2"), random(0.2, 0.9), random(0.2, 0.9);
        repeat 10 {
            draw_line_DDA RANDOM_X, RANDOM_Y, RANDOM_Z, random("-1.0","1.0"), random("-1.0","1.0"), 0, random(1, 20);
        }
        glbfx_jitter 0.003;
    }
    
    require_composite = true;
}



################################
#          Templates           #
################################


proc delete_all_templates {
    delete depositor_template_metadata;
    delete depositor_template_voxels;
}


proc save_canvas_as_template slot_index {
    # TODO
}



################################
#        Set depositor         #
################################


proc reset_depositor {
    depositor_mode = DepositorMode.DRAW;
    depositor_replace = true;
    voxel depositor_voxel = VOXEL_SOLID_GREY(1);
    depositor_template_index = 0;
    XYZ depositor_template_origin = XYZ {x:0, y:0, z:0};
}

# set from sRGB colour
proc set_depositor_from_sRGB r, g, b {
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = VOXEL_SOLID(ROOT($r, 2.2), ROOT($g, 2.2), ROOT($b, 2.2)); # convert to linear
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
                # get the template index which is ptr + 3D index
                local tex_idx = depositor_template_metadata[depositor_template_index].ptr + INDEX_FROM_3D($x-depositor_template_origin.x, $y-depositor_template_origin.y, $z-depositor_template_origin.z, depositor_template_metadata[depositor_template_index].sx, depositor_template_metadata[depositor_template_index].sy, depositor_template_metadata[depositor_template_index].sz);
                
                canvas[set_canvas_index] = depositor_template_voxels[tex_idx];
            }
        }
    }
}


func is_voxel_air(x, y, z) {
    if ($z >= 0 and $z < canvas_size_z) { # only set the voxel if z is in range
        return (canvas[INDEX_FROM_3D_CANVAS($x, $y, $z, canvas_size_x, canvas_size_y)].opacity == 0);
    }
    return true;
}


func is_voxel_exposed(x, y, z) {
    if (canvas[INDEX_FROM_3D_CANVAS($x+1, $y, $z, canvas_size_x, canvas_size_y)].opacity == 0) { return true; }
    if (canvas[INDEX_FROM_3D_CANVAS($x-1, $y, $z, canvas_size_x, canvas_size_y)].opacity == 0) { return true; }
    if (canvas[INDEX_FROM_3D_CANVAS($x, $y+1, $z, canvas_size_x, canvas_size_y)].opacity == 0) { return true; }
    if (canvas[INDEX_FROM_3D_CANVAS($x, $y-1, $z, canvas_size_x, canvas_size_y)].opacity == 0) { return true; }
    if (canvas[INDEX_FROM_3D_CANVAS($x, $y, $z+1, canvas_size_x, canvas_size_y)].opacity == 0) { return true; }
    if (canvas[INDEX_FROM_3D_CANVAS($x, $y, $z-1, canvas_size_x, canvas_size_y)].opacity == 0) { return true; }
    return false;
}


################################
#            Shapes            #
################################


proc clear_canvas  {
    delete canvas;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add VOXEL_NONE to canvas;
    }

    require_composite = true;
}


proc set_base_layer r, g, b {
    local bl_i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        canvas[bl_i] = VOXEL_SOLID($r, $g, $b);
        bl_i++;
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
                if sqrt(px_x*px_x + px_y*px_y) <= $radius { 
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
                if sqrt(px_x*px_x + px_y*px_y + px_z*px_z) <= $radius { 
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



# random walk in a 2D plane using taxicab movement (X and Y axis only)
proc random_walk_taxicab x, y, z, turns, steps {
    local agent_x = $x;
    local agent_y = $y;
    local agent_z = $z;

    repeat $turns {
        if (random(0, 1) == 0) {
            if (random(0, 1) == 0) {
                repeat random(1, $steps) {
                    agent_x += 1;
                    set_voxel agent_x, agent_y, agent_z;
                }
            } else {
                repeat random(1, $steps) {
                    agent_x += -1;
                    set_voxel agent_x, agent_y, agent_z;
                }
            }
        } else {
            if (random(0, 1) == 0) {
                repeat random(1, $steps) {
                    agent_y += 1;
                    set_voxel agent_x, agent_y, agent_z;
                }
            } else {
                repeat random(1, $steps) {
                    agent_y += -1;
                    set_voxel agent_x, agent_y, agent_z;
                }
            }
        }
    }
}



# random walk snapping to particular angles
proc random_walk_any x, y, z, turns, steps, angle {
    
}



# 3D DDA
proc draw_line_DDA x, y, z, dx, dy, dz, r {
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
            if (len_y < len_y) {
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


# swap two voxels
proc swap_canvas_voxels v1, v2 {
    local voxel temp_voxel = canvas[v1];
    canvas[v1] = canvas[v2];
    canvas[v2] = temp_voxel;
}


# erode ("spall") exposed surfaces
proc glbfx_spall probability {

    local i = 1;
    local px_z = 0;
    repeat canvas_size_z {
        local px_y = 0;
        repeat canvas_size_y {
            local px_x = 0;
            repeat canvas_size_x {
                if (random("0.0","1.0") < $probability and canvas[i].opacity > 0) {
                    if is_voxel_exposed(px_x, px_y, px_z) { # this is really expensive, probably don't use this
                        canvas[i] = VOXEL_NONE; # set to 0
                    }
                }
                i++;
                px_x++;
            }
            px_y++;
        }
        px_z++;
    }
}

# TODO jitter in all directions, find a way to randomly pair voxels, skip z limits
# randomly shift voxels, swapping with neighbours
proc glbfx_jitter probability {
    
    local canvas_voxel_count = (canvas_size_x * canvas_size_y * canvas_size_z);
    repeat (canvas_voxel_count * $probability) {
        local jitter_i = random(1, canvas_voxel_count);

        local voxel temp_voxel = canvas[jitter_i];
        canvas[jitter_i] = canvas[jitter_i+1];
        canvas[jitter_i+1] = temp_voxel;
    }
}


# average pairs of voxels
#proc glbfx_melt


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
