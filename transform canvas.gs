%include common/common.gs

# TODO move this into generator because it can benefit from these too (or maybe it's better to copy over the needed ones)

costumes "costumes/transform canvas/icon.svg" as "icon";
hide;

# lists used to store the canvas temporarily
list voxel temp;


on "initalise" {
    hide;
}

on "hard reset" {
    delete temp;
}

on "*" {
    scale_uniform_xy 1;
    translate canvas_size_x/2, canvas_size_y/2, 0;
    mirror_x 1;
    crop_centered 10, 10, canvas_size_z;
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
    delete temp;
    
    iz = (0-floor($dz));
    repeat canvas_size_z {
        iy = (0-floor($dy));
        repeat canvas_size_y {
            ix = (0-floor($dx));
            repeat canvas_size_x {
                local index = INDEX_FROM_3D(ix, iy, iz, canvas_size_x, canvas_size_y, canvas_size_z);
                add canvas[index] to temp;
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
    delete temp;

    iz = 0;
    repeat round(canvas_size_z * $scale_z) {
        iy = 0;
        repeat round(canvas_size_y * $scale_y) {
            ix = 0;
            repeat round(canvas_size_x * $scale_x) {
                local index = INDEX_FROM_3D_CANVAS(ix, iy, iz, canvas_size_x, canvas_size_y);
                add canvas[index] to temp;
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


# scale uniformly along all 3 axes
proc scale_uniform_xy scale_fac {
    scale $scale_fac, $scale_fac, $scale_fac;
}


# copy one side to the other
proc mirror_x keep_lower {
    # no additional list required

    iz = 0;
    repeat canvas_size_z {
        iy = 0;
        repeat canvas_size_y {
            local row_index = ((canvas_size_x * canvas_size_y) * iz) + (canvas_size_x * iy);
            ix = 0;
            if $keep_lower {
                repeat canvas_size_x//2 {
                    local source_index = row_index + ix + 1;
                    local dest_index = row_index + (canvas_size_x-ix);
                    canvas[dest_index] = canvas[source_index];
                    ix++;
                }
            } else {
                repeat canvas_size_x//2 {
                    local source_index = row_index + (canvas_size_x-ix);
                    local dest_index = row_index + ix + 1;
                    canvas[dest_index] = canvas[source_index];
                    ix++;
                }
            }
            iy++;
        }
        iz++;
    }
    
    # no rewrite or temp list required
    require_composite = true;
}




# crop using origin and width
proc crop x, y, z, size_x, size_y, size_z {
    delete temp;
    iz = $z;
    repeat $size_z {
        iy = $y;
        repeat $size_y {
            ix = $z;
            repeat $size_x {
                local index = INDEX_FROM_3D(ix, iy, iz, canvas_size_x, canvas_size_y, canvas_size_z);
                add canvas[index] to temp;
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
    repeat (length temp) {
        add temp[i] to canvas;
        i++;
    }
    delete temp;
}

