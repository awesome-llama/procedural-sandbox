
costumes "costumes/transform canvas/icon.svg" as "icon";

list temp_1_r;
list temp_2_g;
list temp_3_b;
list temp_4_a;
list neighbours = ["", "", "", "", ""];

on "hard reset" {
    delete temp_1_r;
    delete temp_2_g;
    delete temp_3_b;
    delete temp_4_a;
}

proc scale_along_xy_nearest_neighbour scale_fac {
    _scale = ($scale_fac+("2"*(($scale_fac+0) == 0)));
    _step = (1/_scale);
    delete temp_1_r;
    delete temp_2_g;
    delete temp_3_b;
    delete temp_4_a;
    iz = 0;
    repeat canvas_size_z {
        iy = 0;
        repeat (canvas_size_y*_scale) {
            ix = 0;
            repeat (canvas_size_x*_scale) {
                i = (1+(((canvas_size_x*canvas_size_y)*iz)+((canvas_size_x*(floor(iy)%canvas_size_y))+(floor(ix)%canvas_size_x))));
                add canvas_1_r[i] to temp_1_r;
                add canvas_2_g[i] to temp_2_g;
                add canvas_3_b[i] to temp_3_b;
                add canvas_4_a[i] to temp_4_a;
                ix += _step;
            }
            iy += _step;
        }
        iz += 1;
    }
    write_temp_lists_to_canvas;
    canvas_size_x = (canvas_size_x*_scale);
    canvas_size_y = (canvas_size_y*_scale);
    broadcast "composite";
}

proc write_temp_lists_to_canvas  {
    delete canvas_1_r;
    delete canvas_2_g;
    delete canvas_3_b;
    delete canvas_4_a;
    i = 1;
    repeat (length temp_4_a) {
        add temp_1_r[i] to canvas_1_r;
        add temp_2_g[i] to canvas_2_g;
        add temp_3_b[i] to canvas_3_b;
        add temp_4_a[i] to canvas_4_a;
        i += 1;
    }
    delete temp_1_r;
    delete temp_2_g;
    delete temp_3_b;
    delete temp_4_a;
}


proc translate dx, dy {
    delete temp_1_r;
    delete temp_2_g;
    delete temp_3_b;
    delete temp_4_a;
    iz = 0;
    repeat canvas_size_z {
        iy = (0-$dy);
        repeat canvas_size_y {
            ix = (0-$dx);
            repeat canvas_size_x {
                i = (1+(((canvas_size_x*canvas_size_y)*iz)+((canvas_size_x*(floor(iy)%canvas_size_y))+(floor(ix)%canvas_size_x))));
                add canvas_1_r[i] to temp_1_r;
                add canvas_2_g[i] to temp_2_g;
                add canvas_3_b[i] to temp_3_b;
                add canvas_4_a[i] to temp_4_a;
                ix += 1;
            }
            iy += 1;
        }
        iz += 1;
    }
    write_temp_lists_to_canvas;
    broadcast "composite";
}
