%include common/common.gs

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

    refresh_screen_required = 1;
}


on "generate pipes" {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 8;
    clear_canvas;
    repeat 100 {
        col_r = random(0, "1.0");
        col_g = random(0, "1.0");
        col_b = random(0, "1.0");
        col_a = random(0.5, "1.0");
        random_walk_taxicab 20, 5;
    }
    broadcast "composite";
}



proc draw_rect x, y, z, width, height, depth {
    px_y = ($y-$height);
    repeat $width {
        px_x = ($x-$width);
        repeat $height {
            set_voxel px_x, px_y, $z, $depth, col_r, col_g, col_b, col_a;
            px_x += 1;
        }
        px_y += 1;
    }
}


proc set_voxel x, y, z, depth, r, g, b, a {
    if ($depth == "") {
        px_depth = 1;
    } else {
        px_depth = floor($depth);
    }
    local set_px_z = floor($z);
    if (not (set_px_z < canvas_size_z)) {
        set_px_z = (canvas_size_z-1);
    }
    local set_px_i = (1+(((canvas_size_x*canvas_size_y) * set_px_z)+((canvas_size_x*(floor($y) % canvas_size_y))+(floor($x) % canvas_size_x))));
    repeat 1 {
        canvas[set_px_i].r = ($r+($r == ""));
        canvas[set_px_i].g = ($g+($g == ""));
        canvas[set_px_i].b = ($b+($b == ""));
        canvas[set_px_i].opacity = ($a+($a == ""));
        set_px_i += (0-(canvas_size_x*canvas_size_y));
        if (set_px_i < 1) {
            stop_this_script;
        }
    }
}


# some of these may be better moved to a separate file, import them in (if the lists allow this)

proc random_walk_taxicab turns, steps {
    random_pos_xyz 0, canvas_size_z;
    repeat $turns {
        if (random(0, 1) == 0) {
            if (random(0, 1) == 0) {
                repeat random(1, $steps) {
                    _temp_x += 1;
                    set_voxel _temp_x, _temp_y, _temp_z, 1, col_r, col_g, col_b, col_a;
                }
            } else {
                repeat random(1, $steps) {
                    _temp_x += -1;
                    set_voxel _temp_x, _temp_y, _temp_z, 1, col_r, col_g, col_b, col_a;
                }
            }
        } else {
            if (random(0, 1) == 0) {
                repeat random(1, $steps) {
                    _temp_y += 1;
                    set_voxel _temp_x, _temp_y, _temp_z, 1, col_r, col_g, col_b, col_a;
                }
            } else {
                repeat random(1, $steps) {
                    _temp_y += -1;
                    set_voxel _temp_x, _temp_y, _temp_z, 1, col_r, col_g, col_b, col_a;
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

func random_pos(zmin, zmax) {
    return pos {x: 1, y: 2, z: $zmin};
}

proc draw_filled_circle x, y, z, radius, depth, bevel {
    px_y = (0-$radius);
    repeat (1+(2*$radius)) {
        px_x = (0-$radius);
        repeat (1+(2*$radius)) {
            _dist = sqrt(((px_x*px_x)+(px_y*px_y)));
            if (_dist < $radius) {
                if (_dist > ($radius-$bevel)) {
                    set_voxel ($x+px_x), ($y+px_y), ($z-(_dist-($radius-$bevel))), $depth, col_r, col_g, col_b, col_a;
                } else {
                    set_voxel ($x+px_x), ($y+px_y), $z, $depth, col_r, col_g, col_b, col_a;
                }
            }
            px_x += 1;
        }
        px_y += 1;
    }
}
