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
#            Import            #
################################


on "io.load_canvas.run" {
    stop_other_scripts;
    ask "paste TextImage file, leave blank to cancel";
    if (answer() != "") {
        TextImage_file = answer();
        broadcast_and_wait "read TextImage";
        copy_TI_px_buffer_to_canvas;
        require_composite = true;
    }
}
proc copy_TI_px_buffer_to_canvas {
    canvas_size_x = TI_image_size_x;
    canvas_size_z = TI_header[1+("!_z" in TI_header)];

    if (canvas_size_z == "") {
        error "canvas size z is unknown";
        print "Error: Canvas size Z is unknown. Set it manually using reshape.", 7;
        canvas_size_y = TI_image_size_y;
        canvas_size_z = 1;
        UI_current_panel = "fx.reshape_canvas";
        broadcast "fx.reshape_canvas.get_current_dimensions";
    } else {
        canvas_size_y = TI_image_size_y / canvas_size_z;
    }
    
    if (canvas_size_y%1 > 0) {
        error "canvas is of wrong shape (not divisible)";
        print "Error: Dimensions are not factors of the voxel count. Set it manually using reshape.", 8;
        canvas_size_y = TI_image_size_y;
        canvas_size_z = 1;
        UI_current_panel = "fx.reshape_canvas";
        broadcast "fx.reshape_canvas.get_current_dimensions";
    }
    
    delete canvas;
    i = 1;
    repeat (length TI_1_r) {
        
        add voxel {opacity:TI_4_a[i]/255, r:TI_1_r[i]/255, g:TI_2_g[i]/255, b:TI_3_b[i]/255} to canvas;
        i++;
    }
}


on "io.import_height_map.run" {
    stop_other_scripts;
    ask "paste TextImage file, leave blank to cancel";
    if (answer() != "") {
        TextImage_file = answer(); 
        broadcast_and_wait "read TextImage";
        
        delete UI_return;
        setting_from_id "io.import_height_map.erase_canvas";
        setting_from_id "io.import_height_map.size_z";
        setting_col_from_id "io.import_height_map.new_color";

        setting_from_id "io.import_height_map.weight_r";
        setting_from_id "io.import_height_map.weight_g";
        setting_from_id "io.import_height_map.weight_b";

        setting_from_id "io.import_height_map.map_0";
        setting_from_id "io.import_height_map.map_1";

        copy_TI_px_buffer_to_canvas_as_height_map UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6], UI_return[7], UI_return[8], UI_return[9], UI_return[10];
        require_composite = true;
    }
}
proc copy_TI_px_buffer_to_canvas_as_height_map erase_canvas, size_z, new_col_r, new_col_g, new_col_b, weight_r, weight_g, weight_b, map_0, map_1 {
    if ($erase_canvas == 1) {
        canvas_size_x = TI_image_size_x;
        canvas_size_y = TI_image_size_y;
        canvas_size_z = $size_z;
        clear_canvas;

        layer_size = (canvas_size_x * canvas_size_y);
        i = 1;
        repeat layer_size {
            local heightmap_write_z = 0;
            local height = ((TI_2_g[i]*$weight_r + TI_2_g[i]*$weight_g + TI_2_g[i]*$weight_b) / 255); # normalised height
            repeat round(canvas_size_z * ($map_0 + (height * ($map_1-$map_0)))) {
                canvas[i + heightmap_write_z].r = $new_col_r;
                canvas[i + heightmap_write_z].g = $new_col_g;
                canvas[i + heightmap_write_z].b = $new_col_b;
                canvas[i + heightmap_write_z].opacity = 1;
                heightmap_write_z += layer_size;
            }
            i++;
        }
    } else {
        if (canvas_size_x != TI_image_size_x or canvas_size_y != TI_image_size_y) {
            crop floor((canvas_size_x-TI_image_size_x)/2), floor((canvas_size_y-TI_image_size_y)/2), 0, TI_image_size_x, TI_image_size_y, canvas_size_z;
        }

        layer_size = (canvas_size_x * canvas_size_y);
        i = 1;
        repeat layer_size {
            local heightmap_write_z = 0;
            local height = ((TI_2_g[i]*$weight_r + TI_2_g[i]*$weight_g + TI_2_g[i]*$weight_b) / 255); # normalised height
            repeat round(canvas_size_z * ($map_0 + (height * ($map_1-$map_0)))) {
                canvas[i + heightmap_write_z].opacity = 1;
                heightmap_write_z += layer_size;
            }
            i++;
        }
    }

}


on "io.import_color_map.run" {
    stop_other_scripts;
    ask "paste TextImage file, leave blank to cancel";
    if (answer() != "") {
        TextImage_file = answer(); 
        broadcast_and_wait "read TextImage";

        delete UI_return;
        setting_from_id "io.import_color_map.resize_canvas";
        setting_from_id "io.import_color_map.interpret_linear";

        read_TI_px_buffer_to_canvas_as_2D_color_map UI_return[1], UI_return[2];
        require_composite = true;
    }
}
proc read_TI_px_buffer_to_canvas_as_2D_color_map resize_canvas, interpret_linear {
    if $resize_canvas {
        if (canvas_size_x != TI_image_size_x or canvas_size_y != TI_image_size_y) {
            crop floor((canvas_size_x-TI_image_size_x)/2), floor((canvas_size_y-TI_image_size_y)/2), 0, TI_image_size_x, TI_image_size_y, canvas_size_z;
        }
    } else {
        error "not implemented"; # loop over the pixels which do fit
        print "not implemented", "";
    }

    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        local heightmap_write_z = 0;
        repeat canvas_size_z {
            # transform sRGB into linear
            if $interpret_linear {
                canvas[i + heightmap_write_z].r = FROM_LINEAR(TI_1_r[i]/255);
                canvas[i + heightmap_write_z].g = FROM_LINEAR(TI_2_g[i]/255);
                canvas[i + heightmap_write_z].b = FROM_LINEAR(TI_3_b[i]/255);
            } else {
                canvas[i + heightmap_write_z].r = (TI_1_r[i]/255);
                canvas[i + heightmap_write_z].g = (TI_2_g[i]/255);
                canvas[i + heightmap_write_z].b = (TI_3_b[i]/255);
            }
            heightmap_write_z += layer_size;
        }
        i++;
    }
}


################################
#            Export            #
################################

on "io.save_canvas.run" {
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
        add floor(canvas[i].r * 255) to TI_1_r;
        add floor(canvas[i].g * 255) to TI_2_g;
        add floor(canvas[i].b * 255) to TI_3_b;
        add floor(canvas[i].opacity * 255) to TI_4_a;
        i++;
    }
}


on "io.export_rendered_canvas.run" {
    copy_render_buffer_to_TI_px_buffer;
    broadcast_and_wait "write TextImage";
    delete copy_this;
    add TextImage_file to copy_this;
    show copy_this;
}
proc copy_render_buffer_to_TI_px_buffer {
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

# copied from generator.gs:
proc clear_canvas  {
    delete canvas;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add VOXEL_NONE to canvas;
    }

    require_composite = true;
}