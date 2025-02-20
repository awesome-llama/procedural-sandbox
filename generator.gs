%include common/common.gs;

costumes "costumes/blank.svg" as "blank";

# test palette of colours
#list temp_1 = ["6e7b6e", "ccbe99", "8bc338", "c18644", "3eb13e", "5f5a70", "ed885e", "e17644"];

#list palette; # TODO

on "initalise" {
    hide;
}

on "hard reset" {
    
}


on "clear canvas" {
    clear_canvas;
    broadcast "composite";
}
proc clear_canvas  {
    delete canvas;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add VOXEL_NONE() to canvas;
    }

    broadcast "composite"; # TODO make this a variable
}


on "generate pipes" {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 8;
    clear_canvas;
    repeat 100 {
        voxel_brush.r = random(0, "1.0");
        voxel_brush.g = random(0, "1.0");
        voxel_brush.b = random(0, "1.0");
        voxel_brush.opacity = random(0.5, "1.0");

        random_walk_taxicab random(0, (canvas_size_x-1)), random(0, (canvas_size_y-1)), random(0, (canvas_size_z-1)), 20, 5;
    }
    broadcast "composite";
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
        voxel_brush = VOXEL_SOLID(brightness, brightness, brightness);
        
        tank_x = random(0,(canvas_size_x-1));
        tank_y = random(0,(canvas_size_y-1));

        draw_sphere tank_x, tank_y, tank_rad/2, tank_rad;

        brightness = random(0.5, 1);
        voxel_brush = VOXEL_SOLID(brightness, brightness, brightness);

        random_walk_taxicab tank_x+tank_rad, tank_y, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x-tank_rad, tank_y, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x, tank_y+tank_rad, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x, tank_y-tank_rad, random(1, tank_rad/2), 12, 16;
    }
    
    broadcast "composite";
}



# some of these may be better moved to a separate file, import them in (if the lists allow this)


proc set_base_layer r, g, b {
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        canvas[i] = VOXEL_SOLID($r, $g, $b);
        i++;
    }
}

proc random_walk_taxicab x, y, z, turns, steps {
    _temp_x = $x;
    _temp_y = $y;
    _temp_z = $z;

    repeat $turns {
        if (random(0, 1) == 0) {
            if (random(0, 1) == 0) {
                repeat random(1, $steps) {
                    _temp_x += 1;
                    set_voxel _temp_x, _temp_y, _temp_z;
                }
            } else {
                repeat random(1, $steps) {
                    _temp_x += -1;
                    set_voxel _temp_x, _temp_y, _temp_z;
                }
            }
        } else {
            if (random(0, 1) == 0) {
                repeat random(1, $steps) {
                    _temp_y += 1;
                    set_voxel _temp_x, _temp_y, _temp_z;
                }
            } else {
                repeat random(1, $steps) {
                    _temp_y += -1;
                    set_voxel _temp_x, _temp_y, _temp_z;
                }
            }
        }
    }
}


proc random_pos_xyz min, max {
    _temp_x = random(0, (canvas_size_x-1));
    _temp_y = random(0, (canvas_size_y-1));
    _temp_z = random($min, ($max-1));
}


proc set_voxel x, y, z {
    local set_px_z = floor($z);
    
    if ($z >= 0 and $z < canvas_size_z) { # only set the voxel if z is in range
        local set_px_i = 1 + (((canvas_size_x*canvas_size_y) * set_px_z) + ((canvas_size_x*(floor($y) % canvas_size_y))+(floor($x) % canvas_size_x)));

        canvas[set_px_i] = voxel_brush; # set voxel with brush
    }
}


proc draw_sphere x, y, z, radius {
    local rad_min = -1 - ceil($radius);
    local rad_width = 2 * (1 + ceil($radius));

    local px_z = rad_min;
    repeat rad_width {
        local px_y = rad_min;
        repeat rad_width {
            local px_x = rad_min;
            repeat rad_width {
                if sqrt(px_x*px_x + px_y*px_y + px_z*px_z) <= $radius {
                    set_voxel $x+px_x, $y+px_y, $z+px_z;
                }
                px_x++;
            }
            px_y++;
        }
        px_z++;
    }
}