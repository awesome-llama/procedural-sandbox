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

    tank_rad = 8;
    # spherical tanks
    repeat 5 {
        brightness = random(0.9, 1);
        depositor_voxel = VOXEL_SOLID(brightness, brightness, brightness);
        
        tank_x = RANDOM_X;
        tank_y = RANDOM_Y;

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


on "generate unknown" {
    canvas_size_x = 128;
    canvas_size_y = 128;
    canvas_size_z = 16;
    clear_canvas;
    set_base_layer 0.7, 0.7, 0.6;

    repeat 10 {
        draw_cuboid_corner_size RANDOM_X, RANDOM_Y, 0, random(1,8), random(1,8), random(1, canvas_size_z*0.5);
    }


}

################################
#        Set depositor         #
################################


proc reset_depositor {
    depositor_mode = DepositorMode.DRAW;
    depositor_replace = true;
    voxel depositor_voxel = VOXEL_SOLID_GREY(1);
    depositor_texture_index = 0;
    XYZ depositor_texture_origin = XYZ {x:0, y:0, z:0};
}

# set from sRGB colour
proc set_depositor_from_sRGB r, g, b {
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = VOXEL_SOLID(ROOT($r, 2.2), ROOT($g, 2.2), ROOT($b, 2.2)); # convert to linear
}



# some of these may be better moved to a separate file, import them in (if the lists allow this)

################################
#             Misc             #
################################


# set a canvas voxel at a given position using the current depositor. Accounts for wrapping on X, Y
proc set_voxel x, y, z {
    local set_px_z = floor($z);
    
    if ($z >= 0 and $z < canvas_size_z) { # only set the voxel if z is in range
        local set_canvas_index = INDEX_FROM_3D_CANVAS($x, $y, $z, canvas_size_x, canvas_size_y); 

        if (depositor_replace == true or canvas[set_canvas_index].opacity == 0) { # only place if replace OR the canvas is air
            if (depositor_mode == DepositorMode.DRAW) {
                canvas[set_canvas_index] = depositor_voxel; # set voxel with brush
            } else {
                # get the texture index which is ptr + 3D index
                local tex_idx = depositor_texture_metadata[depositor_texture_index].ptr + INDEX_FROM_3D($x-depositor_texture_origin.x, $y-depositor_texture_origin.y, $z-depositor_texture_origin.z, depositor_texture_metadata[depositor_texture_index].sx, depositor_texture_metadata[depositor_texture_index].sy, depositor_texture_metadata[depositor_texture_index].sz);
                
                canvas[set_canvas_index] = depositor_texture_voxels[tex_idx];
            }
        }
    }
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
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        canvas[i] = VOXEL_SOLID($r, $g, $b);
        i++;
    }
    
    require_composite = true;
}


# draw a cylinder on the XY plane.
proc draw_cylinder x, y, z, radius, height {
    local bb_width = round(2 * $radius); # bounding box width
    local bb_min = 0.5 + (bb_width * -0.5); # bounding box local minima

    # TODO
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
    local total_distance = sqrt((($dx*$dx)+(($dy*$dy)+($dz*$dz))));
    local scale_x = abs(total_distance/$dx);
    local scale_y = abs(total_distance/$dy);
    local scale_z = abs(total_distance/$dz);
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

    local total_distance = 1;
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

        set_voxel raycast_ix, raycast_iy, raycast_iz;

        if (raycast_iz > canvas_size_z or raycast_iz < 0) {
            stop_this_script;
        }
    }
}



