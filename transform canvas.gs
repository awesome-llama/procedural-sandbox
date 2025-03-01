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
    scale_along_xy_nearest_neighbour 1;
    translate canvas_size_x/2, canvas_size_y/2;
    mirror_x 1;
}


proc scale_along_xy_nearest_neighbour scale_fac {
    local step = 1/$scale_fac;
    delete temp;

    iz = 0;
    repeat canvas_size_z {
        iy = 0;
        repeat (canvas_size_y * $scale_fac) {
            ix = 0;
            repeat (canvas_size_x * $scale_fac) {
                add canvas[INDEX_FROM_3D_CANVAS(ix, iy, iz, canvas_size_x, canvas_size_y)] to temp;
                ix += step;
            }
            iy += step;
        }
        iz++;
    }
    canvas_size_x *= $scale_fac;
    canvas_size_y *= $scale_fac;

    _write_temp_lists_to_canvas;
    require_composite = true;
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
                add canvas[INDEX_FROM_3D_CANVAS(ix, iy, iz, canvas_size_x, canvas_size_y)] to temp;
                ix++;
            }
            iy++;
        }
        iz++;
    }
    _write_temp_lists_to_canvas;
    require_composite = true;
}


# sample rotated 
proc resample a, b, c, d, e, f, g, h, i {
    delete temp;

    iz = 0;
    repeat canvas_size_z {
        iy = 0;
        repeat canvas_size_y {
            ix = 0;
            repeat canvas_size_x {
                # TODO calculate new 2d pt
                #add canvas[INDEX_FROM_3D_CANVAS(ix, iy, iz, canvas_size_x, canvas_size_y)] to temp;
                ix++;
            }
            iy++;
        }
        iz++;
    }
    require_composite = true;
}


# copy one side to the other (closer to 0)
proc mirror_x keep_lower {
    # this doesn't need to replace
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

