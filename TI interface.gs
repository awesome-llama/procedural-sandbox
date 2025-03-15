%include common/common.gs

costumes "costumes/TI interface/icon.svg" as "icon";
hide;

# lists used to store the canvas temporarily
list voxel temp;

on "initalise" {
    hide;
}

on "hard reset" {
    delete temp;
    # other shared variables are deleted in stage
}


################################
#            Export            #
################################

on "export canvas" {
    copy_canvas_to_TI_px_buffer;
    broadcast_and_wait "write TextImage";
    delete copy_this;
    add TextImage_file to copy_this;
    show copy_this;
}
proc copy_canvas_to_TI_px_buffer {
    TI_image_size_x = canvas_size_x;
    TI_image_size_y = (canvas_size_y * canvas_size_z);
    delete TI_1_r;
    delete TI_2_g;
    delete TI_3_b;
    delete TI_4_a;
    i = 1;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        # transform to sRGB
        add floor(POW(canvas[i].r, 2.2)*255) to TI_1_r;
        add floor(POW(canvas[i].g, 2.2)*255) to TI_2_g;
        add floor(POW(canvas[i].b, 2.2)*255) to TI_3_b;
        add floor(canvas[i].opacity*255) to TI_4_a;
        i++;
    }
}


on "export render" {
    copy_render_buffer_to_TI_buffer;
    broadcast_and_wait "write TextImage";
    delete copy_this;
    add TextImage_file to copy_this;
    show copy_this;
}
proc copy_render_buffer_to_TI_buffer {
    # The render buffer is 2D and opaque
    
    TI_image_size_x = canvas_size_x;
    TI_image_size_y = canvas_size_y;
    delete TI_1_r;
    delete TI_2_g;
    delete TI_3_b;
    delete TI_4_a;
    i = 1;
    repeat (length render_cache_final_col) {
        # render cache is sRGB combined. No transform needed, only separation into channels.
        add (floor((render_cache_final_col[i]/65536))%256) to TI_1_r;
        add (floor((render_cache_final_col[i]/256))%256) to TI_2_g;
        add (render_cache_final_col[i]%256) to TI_3_b;
        add 255 to TI_4_a;
        i++;
    }
}


################################
#            Import            #
################################


on "import canvas" {
    stop_other_scripts;
    ask "paste canvas";
    if (answer() != "") {
        TextImage_file = answer();
        broadcast_and_wait "read TextImage";
        copy_TI_px_buffer_to_canvas;
        require_composite = true;
    }
}
proc copy_TI_px_buffer_to_canvas {
    canvas_size_x = TI_image_size_x;
    canvas_size_y = TI_image_size_y;
    canvas_size_z = TI_header[1+("!_z" in TI_header)];
    if (canvas_size_z == "") {
        if (TI_image_size_y % TI_image_size_x == 0) {
            warn "assuming canvas is a square";
            canvas_size_y = TI_image_size_x;
            canvas_size_z = floor(TI_image_size_y / TI_image_size_x);
        } else {
            error "canvas size is unknown";
            stop_this_script;
        }
    }
    delete canvas;
    i = 1;
    repeat (length TI_1_r) {
        # transform sRGB into linear
        add voxel {opacity:floor(TI_4_a[i]*255), r:floor(ROOT(TI_1_r[i], 2.2)*255), g:floor(ROOT(TI_2_g[i], 2.2)*255), b:floor(ROOT(TI_3_b[i], 2.2)*255)} to canvas;
        i++;
    }
}


on "import height map" {
    stop_other_scripts;
    ask "paste canvas";
    if (answer() != "") {
        TextImage_file = answer(); 
        broadcast_and_wait "read TextImage";
        copy_TI_px_buffer_to_canvas_as_height_map;
        require_composite = true;
    }
}
proc copy_TI_px_buffer_to_canvas_as_height_map {
    if (canvas_size_x != TI_image_size_x or canvas_size_y != TI_image_size_y) {
        crop floor((canvas_size_x-TI_image_size_x)/2), floor((canvas_size_y-TI_image_size_y)/2), 0, TI_image_size_x, TI_image_size_y, canvas_size_z;
    }
    
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        local heightmap_write_z = 0;
        repeat round(canvas_size_z * ((TI_2_g[i]*0.25 + TI_2_g[i]*0.5 + TI_2_g[i]*0.25) / 255)) { # using 1:2:1 rgb
            canvas[i + heightmap_write_z].opacity = 1;
            heightmap_write_z += layer_size;
        }
        i++;
    }
}


on "import color map" {
    stop_other_scripts;
    ask "paste canvas";
    if (answer() != "") {
        TextImage_file = answer(); 
        broadcast_and_wait "read TextImage";
        read_TI_px_buffer_to_canvas_as_2D_color_map;
        require_composite = true;
    }
}
proc read_TI_px_buffer_to_canvas_as_2D_color_map {
    if (canvas_size_x != TI_image_size_x or canvas_size_y != TI_image_size_y) {
        crop floor((canvas_size_x-TI_image_size_x)/2), floor((canvas_size_y-TI_image_size_y)/2), 0, TI_image_size_x, TI_image_size_y, canvas_size_z;
    }

    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        local heightmap_write_z = 0;
        repeat canvas_size_z {
            # transform sRGB into linear
            canvas[i + heightmap_write_z].r = ROOT(TI_1_r[i]/255, 2.2);
            canvas[i + heightmap_write_z].g = ROOT(TI_2_g[i]/255, 2.2);
            canvas[i + heightmap_write_z].b = ROOT(TI_3_b[i]/255, 2.2);
            heightmap_write_z += layer_size;
        }
        i++;
    }
}


################################
#            Utils             #
################################

# copied from transorm canvas.gs:

# crop using origin and width
proc crop x, y, z, size_x, size_y, size_z {
    delete temp;
    iz = $z;
    repeat $size_z {
        iy = $y;
        repeat $size_y {
            ix = $z;
            repeat $size_x {
                local index = INDEX_FROM_3D_CANVAS(ix, iy, iz, canvas_size_x, canvas_size_y);
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
