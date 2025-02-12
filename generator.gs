# Converted from sb3 file
#%include common/common.gs

list temp_1 = ["6e7b6e", "ccbe99", "8bc338", "c18644", "3eb13e", "5f5a70", "ed885e", "e17644"];

costumes "costumes/blank.svg" as "blank";

# script qK (1101,368)
proc clear_canvas  {
    delete _1_r;
    delete _2_g;
    delete _3_b;
    delete _4_a;
    repeat (canvas_size_x*(canvas_size_y * canvas_size_z)) {
        add 1 to _1_r;
        add 1 to _2_g;
        add 1 to _3_b;
        add 0 to _4_a;
    }
}

# script c] (154,419)
on "generate 1" {
    clear_canvas;
    set_pixel__s__s__s_depth__s_col__s__s__s__s "3", "3", "0", "", "1", "0", "0", "";
    i = "0";
    repeat canvas_size_z {
        set_pixel__s__s__s_depth__s_col__s__s__s__s i, "0", i, "12", "0.7", "0.7", "0.9", "1";
        i += "1";
    }
    broadcast "composite";
}


# script qW (1588,1495)
proc draw_rect__s__s__s_size__s__s__s x, y, z, width, height, depth {
    px_y = ($y-$height);
    repeat $width {
        px_x = ($x-$width);
        repeat $height {
            set_pixel__s__s__s_depth__s_col__s__s__s__s px_x, px_y, $z, $depth, _col_r, _col_g, _col_b, _col_a;
            px_x += "1";
        }
        px_y += "1";
    }
}

# script qX (2958,152)
proc set_pixel__s__s__s_depth__s_col__s__s__s__s x, y, z, depth, r, g, b, a {
    if ($depth == "") {
        px_depth = "1";
    } else {
        px_depth = floor($depth);
    }
    set_px__z = floor($z);
    if (not (set_px__z < canvas_size_z)) {
        set_px__z = (canvas_size_z-"1");
    }
    set_px__i = ("1"+(((canvas_size_x*canvas_size_y)*set_px__z)+((canvas_size_x*(floor($y)%canvas_size_y))+(floor($x)%canvas_size_x))));
    repeat "1" {
        _1_r[set_px__i] = ($r+($r == ""));
        _2_g[set_px__i] = ($g+($g == ""));
        _3_b[set_px__i] = ($b+($b == ""));
        _4_a[set_px__i] = ($a+($a == ""));
        set_px__i += ("0"-(canvas_size_x*canvas_size_y));
        if (set_px__i < "1") {
            stop_this_script;
        }
    }
}


on "clear canvas" {
    clear_canvas;
    broadcast "composite";
}


proc random_walk_taxicab___turns___s_length___s turns, _length {
    random_pos___depth___s__s "0", canvas_size_z;
    repeat $turns {
        if (random("0", "1") == "0") {
            if (random("0", "1") == "0") {
                repeat random("1", $_length) {
                    _temp_x += "1";
                    set_pixel__s__s__s_depth__s_col__s__s__s__s _temp_x, _temp_y, _temp_z, "1", _col_r, _col_g, _col_b, _col_a;
                }
            } else {
                repeat random("1", $_length) {
                    _temp_x += "-1";
                    set_pixel__s__s__s_depth__s_col__s__s__s__s _temp_x, _temp_y, _temp_z, "1", _col_r, _col_g, _col_b, _col_a;
                }
            }
        } else {
            if (random("0", "1") == "0") {
                repeat random("1", $_length) {
                    _temp_y += "1";
                    set_pixel__s__s__s_depth__s_col__s__s__s__s _temp_x, _temp_y, _temp_z, "1", _col_r, _col_g, _col_b, _col_a;
                }
            } else {
                repeat random("1", $_length) {
                    _temp_y += "-1";
                    set_pixel__s__s__s_depth__s_col__s__s__s__s _temp_x, _temp_y, _temp_z, "1", _col_r, _col_g, _col_b, _col_a;
                }
            }
        }
    }
}

proc random_pos___depth___s__s min, max {
    _temp_x = random("0", (canvas_size_x-"1"));
    _temp_y = random("0", (canvas_size_y-"1"));
    _temp_z = random($min, ($max-"1"));
}


proc draw_circle__s__s__s_radius__s_depth__s_bevel__s x, y, z, radius, depth, bevel {
    px_y = ("0"-$radius);
    repeat ("1"+("2"*$radius)) {
        px_x = ("0"-$radius);
        repeat ("1"+("2"*$radius)) {
            _dist = sqrt(((px_x*px_x)+(px_y*px_y)));
            if (_dist < $radius) {
                if (_dist > ($radius-$bevel)) {
                    set_pixel__s__s__s_depth__s_col__s__s__s__s ($x+px_x), ($y+px_y), ($z-(_dist-($radius-$bevel))), $depth, _col_r, _col_g, _col_b, _col_a;
                } else {
                    set_pixel__s__s__s_depth__s_col__s__s__s__s ($x+px_x), ($y+px_y), $z, $depth, _col_r, _col_g, _col_b, _col_a;
                }
            }
            px_x += "1";
        }
        px_y += "1";
    }
}

proc set_col_from_hex__s hex {
    _temp_1 = ("0x" & $hex);
    _col_r = ((floor((_temp_1/"65536"))%"256")/"256");
    _col_g = ((floor((_temp_1/"256"))%"256")/"256");
    _col_b = ((_temp_1%"256")/"256");
    _col_r = antiln((("1"/"2.4")*ln(_col_r)));
    _col_g = antiln((("1"/"2.4")*ln(_col_g)));
    _col_b = antiln((("1"/"2.4")*ln(_col_b)));
    _col_a = "1";
}
