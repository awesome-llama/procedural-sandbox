%include common/common.gs

# User-invoked transformations. Any transformations needed in the generator should be implemented there only.

costumes "costumes/transform canvas/icon.svg" as "icon";
hide;

# lists used to store the canvas temporarily
list voxel temp_canvas;


on "initalise" {
    hide;
}

on "hard reset" {
    delete temp_canvas;
}


on "fx.translate.set_0" {
    set_setting_from_id "fx.translate.dx", 0;
    set_setting_from_id "fx.translate.dy", 0;
    set_setting_from_id "fx.translate.dz", 0;
}

on "fx.translate.set_half_canvas_xy" {
    set_setting_from_id "fx.translate.dx", round(canvas_size_x/2);
    set_setting_from_id "fx.translate.dy", round(canvas_size_y/2);
}

on "fx.translate.run" {
    delete UI_return;
    setting_from_id "fx.translate.dx";
    setting_from_id "fx.translate.dy";
    setting_from_id "fx.translate.dz";

    translate UI_return[1], UI_return[2], UI_return[3];
}
# translate with wrapping
proc translate dx, dy, dz {
    delete temp_canvas;
    
    iz = (0-floor($dz));
    repeat canvas_size_z {
        iy = (0-floor($dy));
        repeat canvas_size_y {
            ix = (0-floor($dx));
            repeat canvas_size_x {
                local index = INDEX_FROM_3D(ix, iy, iz, canvas_size_x, canvas_size_y, canvas_size_z);
                add canvas[index] to temp_canvas;
                ix++;
            }
            iy++;
        }
        iz++;
    }
    _write_temp_lists_to_canvas;
    require_composite = true;
}


on "fx.scale.set_x0.5" {
    set_setting_from_id "fx.scale.dx", 0.5;
    set_setting_from_id "fx.scale.dy", 0.5;
    set_setting_from_id "fx.scale.dz", 0.5;
}

on "fx.scale.set_x1" {
    set_setting_from_id "fx.scale.dx", 1;
    set_setting_from_id "fx.scale.dy", 1;
    set_setting_from_id "fx.scale.dz", 1;
}

on "fx.scale.set_x2" {
    set_setting_from_id "fx.scale.dx", 2;
    set_setting_from_id "fx.scale.dy", 2;
    set_setting_from_id "fx.scale.dz", 2;
}

on "fx.scale.run" {
    delete UI_return;
    setting_from_id "fx.scale.dx";
    setting_from_id "fx.scale.dy";
    setting_from_id "fx.scale.dz";

    scale UI_return[1], UI_return[2], UI_return[3];
}
# scale independently along x, y, z, axes
proc scale scale_x, scale_y, scale_z {
    local step_x = 1/$scale_x;
    local step_y = 1/$scale_y;
    local step_z = 1/$scale_z;
    delete temp_canvas;

    iz = 0;
    repeat round(canvas_size_z * $scale_z) {
        iy = 0;
        repeat round(canvas_size_y * $scale_y) {
            ix = 0;
            repeat round(canvas_size_x * $scale_x) {
                local index = INDEX_FROM_3D_CANVAS(ix, iy, iz, canvas_size_x, canvas_size_y);
                add canvas[index] to temp_canvas;
                ix += step_x;
            }
            iy += step_y;
        }
        iz += step_z;
    }
    canvas_size_x = round(canvas_size_x * $scale_x);
    canvas_size_y = round(canvas_size_y * $scale_y);
    canvas_size_z = round(canvas_size_z * $scale_z);

    _write_temp_lists_to_canvas;
    require_composite = true;
}


on "fx.rotate.rotate_-90" {
    resample_xy canvas_size_x-1, 0, 0, 1, canvas_size_y, -1, 0, canvas_size_x;
}
on "fx.rotate.rotate_+90" {
    resample_xy 0, canvas_size_y-1, 0, -1, canvas_size_y, 1, 0, canvas_size_x;
}

on "fx.mirror.flip_x" {
    resample_xy canvas_size_x-1, 0, -1, 0, canvas_size_x, 0, 1, canvas_size_y;
}
on "fx.mirror.flip_y" {
    resample_xy 0, canvas_size_y-1, 1, 0, canvas_size_x, 0, -1, canvas_size_y;
}

# iterate over the canvas using start, stop, step for the x and y axes. 
# origin (ox, oy), 1st axis vector (ax, ay) 1st axis size, 2nd axis vector (bx, by), 2nd axis size
proc resample_xy origin_x, origin_y, ax, ay, a_size, bx, by, b_size {
    delete temp_canvas;

    iz = 0;
    repeat (canvas_size_z) {
        iy = 0;
        repeat ($b_size) {
            ix = 0;
            repeat ($a_size) {
                local index = INDEX_FROM_3D_CANVAS(($origin_x + ix*$ax + iy*$bx), ($origin_y + ix*$ay + iy*$by), iz, canvas_size_x, canvas_size_y);
                add canvas[index] to temp_canvas;
                ix++;
            }
            iy++;
        }
        iz++;
    }

    # set canvas size
    canvas_size_x = $a_size;
    canvas_size_y = $b_size;

    _write_temp_lists_to_canvas;
    require_composite = true;
}


on "fx.crop_xy.run" {
    delete UI_return;
    setting_from_id "fx.crop_xy.centered";
    setting_from_id "fx.crop_xy.size_x";
    setting_from_id "fx.crop_xy.size_y";

    if (UI_return[1]) {
        crop_centered UI_return[2], UI_return[3], canvas_size_z;
    } else {
        crop 0, 0, 0, UI_return[2], UI_return[3], canvas_size_z;
    }
}

# crop using origin and width
proc crop x, y, z, size_x, size_y, size_z {
    delete temp_canvas;
    iz = $z;
    repeat $size_z {
        iy = $y;
        repeat $size_y {
            ix = $z;
            repeat $size_x {
                local index = INDEX_FROM_3D(ix, iy, iz, canvas_size_x, canvas_size_y, canvas_size_z);
                add canvas[index] to temp_canvas;
                ix++;
            }
            iy++;
        }
        iz++;
    }
    canvas_size_x = $size_x;
    canvas_size_y = $size_y;
    canvas_size_z = $size_z;
    
    _write_temp_lists_to_canvas;
    require_composite = true;
}


# crop, keeping the center of the canvas
proc crop_centered size_x, size_y, size_z {
    crop floor((canvas_size_x-$size_x)/2), floor((canvas_size_y-$size_y)/2), floor((canvas_size_z-$size_z)/2), $size_x, $size_y, $size_z;
}



# final cleanup after the operation was run
proc _write_temp_lists_to_canvas  {
    delete canvas;
    i = 1;
    repeat (length temp_canvas) {
        add temp_canvas[i] to canvas;
        i++;
    }
    delete temp_canvas;
}

