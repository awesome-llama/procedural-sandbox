%include common/common.gs

costumes "costumes/transform canvas/icon.svg" as "icon";
hide;

# lists used to store the canvas temporarily
list voxel temp;


on "initalise" {
    hide;
}

on "zzz" {
    scale_along_xy_nearest_neighbour 1;
    translate canvas_size_x/2, canvas_size_y/2;

}

on "hard reset" {
    delete temp;
}


proc scale_along_xy_nearest_neighbour scale_fac {
    local _scale = ($scale_fac+(2*(($scale_fac+"0") == 0))); # default value is x2
    local _step = 1/_scale;
    delete temp;

    iz = 0;
    repeat canvas_size_z {
        iy = 0;
        repeat (canvas_size_y * _scale) {
            ix = 0;
            repeat (canvas_size_x * _scale) {
                i = (1+(((canvas_size_x*canvas_size_y)*iz)+((canvas_size_x*(floor(iy)%canvas_size_y))+(floor(ix)%canvas_size_x))));
                add canvas[i] to temp;
                ix += _step;
            }
            iy += _step;
        }
        iz++;
    }
    _write_temp_lists_to_canvas;
    canvas_size_x = (canvas_size_x*_scale);
    canvas_size_y = (canvas_size_y*_scale);
    broadcast "composite";
}

proc translate dx, dy {
    delete temp;

    local dx = floor($dx);
    local dy = floor($dy);
    
    iz = 0;
    repeat canvas_size_z {
        iy = (0-dy);
        repeat canvas_size_y {
            ix = (0-dx);
            repeat canvas_size_x {
                i = (1+(((canvas_size_x*canvas_size_y)*iz)+((canvas_size_x*(floor(iy)%canvas_size_y))+(floor(ix)%canvas_size_x))));
                add canvas[i] to temp;
                ix++;
            }
            iy++;
        }
        iz++;
    }
    _write_temp_lists_to_canvas;
    broadcast "composite";
}


# final cleanup after the operation was run
proc _write_temp_lists_to_canvas  {
    delete canvas;
    i = 1;
    repeat (length temp) {
        add temp[i] to canvas;
        i++;
    }
    delete temp;
}

