# Converted from sb3 file

list temp_1_r = [];
list temp_2_g = [];
list temp_3_b = [];
list temp_4_a = [];
list neighbours = ["", "", "", "", ""];

costumes "costumes/transform canvas/icon.svg" as "icon";

# script w% (-22,1068)
proc scale__s_along_xy_nearest_neighbour scale_fac {
    _scale = ($scale_fac+("2"*(($scale_fac+"0") == "0")));
    _step = ("1"/_scale);
    delete temp_1_r;
    delete temp_2_g;
    delete temp_3_b;
    delete temp_4_a;
    iz = "0";
    repeat canvas_size_z {
        iy = "0";
        repeat (canvas_size_y*_scale) {
            ix = "0";
            repeat (canvas_size_x*_scale) {
                i = ("1"+(((canvas_size_x*canvas_size_y)*iz)+((canvas_size_x*(floor(iy)%canvas_size_y))+(floor(ix)%canvas_size_x))));
                add _1_r[i] to temp_1_r;
                add _2_g[i] to temp_2_g;
                add _3_b[i] to temp_3_b;
                add _4_a[i] to temp_4_a;
                ix += _step;
            }
            iy += _step;
        }
        iz += "1";
    }
    write_temp_lists_to_canvas;
    canvas_size_x = (canvas_size_x*_scale);
    canvas_size_y = (canvas_size_y*_scale);
    broadcast "composite";
}

# script w; (2150,1018)
proc write_temp_lists_to_canvas  {
    delete _1_r;
    delete _2_g;
    delete _3_b;
    delete _4_a;
    i = "1";
    repeat (length temp_4_a) {
        add temp_1_r[i] to _1_r;
        add temp_2_g[i] to _2_g;
        add temp_3_b[i] to _3_b;
        add temp_4_a[i] to _4_a;
        i += "1";
    }
    delete temp_1_r;
    delete temp_2_g;
    delete temp_3_b;
    delete temp_4_a;
}


# script xb (1547,1412)
proc translate__s__s dx, dy {
    delete temp_1_r;
    delete temp_2_g;
    delete temp_3_b;
    delete temp_4_a;
    iz = "0";
    repeat canvas_size_z {
        iy = ("0"-$dy);
        repeat canvas_size_y {
            ix = ("0"-$dx);
            repeat canvas_size_x {
                i = ("1"+(((canvas_size_x*canvas_size_y)*iz)+((canvas_size_x*(floor(iy)%canvas_size_y))+(floor(ix)%canvas_size_x))));
                add _1_r[i] to temp_1_r;
                add _2_g[i] to temp_2_g;
                add _3_b[i] to temp_3_b;
                add _4_a[i] to temp_4_a;
                ix += "1";
            }
            iy += "1";
        }
        iz += "1";
    }
    write_temp_lists_to_canvas;
    broadcast "composite";
}
