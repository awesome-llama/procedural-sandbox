%include lib/common

# User-invoked transformations. Any transformations needed in the generator should be implemented there only.

costumes "costumes/transform_canvas/icon.svg" as "icon";
hide;

# lists used to store the canvas temporarily
list voxel temp_canvas;


on "initalise" {
    hide;
}

on "sys.hard_reset" {
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
    require_composite = true;
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
    require_composite = true;
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
}


on "fx.rotate.rotate_-90" {
    resample_xy canvas_size_x-1, 0, 0, 1, canvas_size_y, -1, 0, canvas_size_x;
    require_composite = true;
}
on "fx.rotate.rotate_+90" {
    resample_xy 0, canvas_size_y-1, 0, -1, canvas_size_y, 1, 0, canvas_size_x;
    require_composite = true;
}


on "fx.rotate.set_origin_0" {
    set_setting_from_id "fx.rotate.ox", 0;
    set_setting_from_id "fx.rotate.oy", 0;
}
on "fx.rotate.set_origin_center" {
    set_setting_from_id "fx.rotate.ox", canvas_size_x/2;
    set_setting_from_id "fx.rotate.oy", canvas_size_y/2;
}

on "fx.rotate.run" {
    # custom rotation
    delete UI_return;
    setting_from_id "fx.rotate.ox";
    setting_from_id "fx.rotate.oy";
    setting_from_id "fx.rotate.angle";
    rotate_around UI_return[1], UI_return[2], UI_return[3];
}
proc rotate_around ox, oy, angle {
    local ax = cos(0-$angle);
    local ay = sin(0-$angle);
    local bx = cos(90-$angle);
    local by = sin(90-$angle);
    resample_xy ($ox-0.5)*(1-(ax+bx))+0.5, ($oy-0.5)*(1-(ay+by))+0.5, ax, ay, canvas_size_x, bx, by, canvas_size_y;
}

on "fx.mirror.flip_x" {
    resample_xy canvas_size_x-1, 0, -1, 0, canvas_size_x, 0, 1, canvas_size_y;
    require_composite = true;
}
on "fx.mirror.flip_y" {
    resample_xy 0, canvas_size_y-1, 1, 0, canvas_size_x, 0, -1, canvas_size_y;
    require_composite = true;
}

# iterate over the canvas using start, stop, step for the x and y axes. 
# origin (ox, oy), 1st axis vector (ax, ay) 1st axis size, 2nd axis vector (bx, by), 2nd axis size
# note that coordinates are floored. If you want to round, add 0.5 to the origin.
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
}

# copy a portion of the canvas to another location. Does not use a temp list.
proc clone_xy src_origin_x, src_origin_y, src_ax, src_ay, src_bx, src_by, dest_origin_x, dest_origin_y, dest_ax, dest_ay, dest_bx, dest_by, size_a, size_b {
    layer_size = (canvas_size_x * canvas_size_y);
    
    iy = 0;
    repeat ($size_b) {
        ix = 0;
        repeat ($size_a) {
            local src_index = INDEX_FROM_2D(($src_origin_x + ix*$src_ax + iy*$src_bx), ($src_origin_y + ix*$src_ay + iy*$src_by), canvas_size_x, canvas_size_y);
            local dest_index = INDEX_FROM_2D(($dest_origin_x + ix*$dest_ax + iy*$dest_bx), ($dest_origin_y + ix*$dest_ay + iy*$dest_by), canvas_size_x, canvas_size_y);

            repeat (canvas_size_z) { # it is ok to iterate z last because item replacement can be done in any order
                canvas[dest_index] = canvas[src_index];
                src_index += layer_size;
                dest_index += layer_size;
            }

            ix++;
        }
        iy++;
    }
}

on "fx.repeated_symmetry.run" {
    delete UI_return;
    setting_from_id "fx.repeated_symmetry.steps";
    setting_from_id "fx.repeated_symmetry.xy_bias";
    repeated_symmetry UI_return[1], UI_return[2];
    require_composite = true;
}
proc repeated_symmetry steps, xy_bias {
    repeat ($steps-1) {
        # choose a point to cut along
        if (PROBABILITY($xy_bias)) {
            local cut = RANDOM_Y();
            clone_xy 0, cut, 1, 0, 0, 1, 0, cut, 1, 0, 0, -1, canvas_size_x, canvas_size_y/2;
        } else {
            local cut = RANDOM_X();
            clone_xy cut, 0, 1, 0, 0, 1, cut, 0, -1, 0, 0, 1, canvas_size_x/2, canvas_size_y;
        }
    }
    # final mirror center of canvas
    if (PROBABILITY($xy_bias)) {
        local cut = canvas_size_y/2;
        clone_xy 0, cut, 1, 0, 0, 1, 0, cut, 1, 0, 0, -1, canvas_size_x, canvas_size_y/2;
    } else {
        local cut = canvas_size_x/2;
        clone_xy cut, 0, 1, 0, 0, 1, cut, 0, -1, 0, 0, 1, canvas_size_x/2, canvas_size_y;
    }
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
    require_composite = true;
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
}


# crop, keeping the center of the canvas
proc crop_centered size_x, size_y, size_z {
    crop floor((canvas_size_x-$size_x)/2), floor((canvas_size_y-$size_y)/2), floor((canvas_size_z-$size_z)/2), $size_x, $size_y, $size_z;
}


on "fx.reshape_canvas.get_current_dimensions" {
    set_setting_from_id "fx.reshape_canvas.size_x", canvas_size_x;
    set_setting_from_id "fx.reshape_canvas.size_y", canvas_size_y;
    set_setting_from_id "fx.reshape_canvas.size_z", canvas_size_z;
}

on "fx.reshape_canvas.run" {
    delete UI_return;
    setting_from_id "fx.reshape_canvas.size_x";
    setting_from_id "fx.reshape_canvas.size_y";
    setting_from_id "fx.reshape_canvas.size_z";
    setting_from_id "fx.reshape_canvas.any_size";
    
    # no procedure needed
    if UI_return[4] or (UI_return[1] * UI_return[2] * UI_return[3] == length(canvas)) {
        canvas_size_x = UI_return[1];
        canvas_size_y = UI_return[2];
        canvas_size_z = UI_return[3];
        require_composite = true;
    } else {
        print "Reshape failed: " & UI_return[1] & "*" & UI_return[2] & "*" & UI_return[3] & " = " & (UI_return[1] * UI_return[2] * UI_return[3]) & " does not fit voxel count of " & length(canvas), 6;
        #error "does not fit";
    }
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

