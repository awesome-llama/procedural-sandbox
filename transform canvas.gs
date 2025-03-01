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
    revolve 0;
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


# sample using matrix, TODO
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


# take a 1 voxel thick canvas and revlove
proc revolve dist_offset {
    # copy the line of voxels
    delete temp;
    local row_index = 1;
    repeat (canvas_size_z) {
        ix = 0;
        repeat (canvas_size_x) {
            add canvas[row_index + ix] to temp;
            ix++;
        }
        row_index += (canvas_size_x * canvas_size_y);
    }
    local temp_width = canvas_size_x;

    # reset canvas
    delete canvas;
    canvas_size_x = temp_width * 2;
    canvas_size_y = temp_width * 2;

    # create revolution
    local bb_min = 0.5 + (canvas_size_x * -0.5);
    local row_index = 1; # offset for temp list
    repeat (canvas_size_z) {

        local iy = bb_min;
        repeat (canvas_size_y) {
            local ix = bb_min;
            repeat (canvas_size_x) {
                local dist = floor($dist_offset + VEC2_LEN(ix, iy));
                if (dist < temp_width and dist > -1) {
                    add temp[row_index + dist] to canvas;
                } else {
                    add VOXEL_NONE to canvas;
                }
                ix++;
            }
            iy++;
        }
        row_index += temp_width; # temp list does not have thickness along y
    }
    
    delete temp;
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

