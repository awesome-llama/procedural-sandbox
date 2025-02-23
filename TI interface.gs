%include common/common.gs

costumes "costumes/TI interface/icon.svg" as "icon";
hide;

on "initalise" {
    hide;
}

on "hard reset" {
    # shared variables deleted in stage
}


# the following are broadcasts and procedures paired

on "export canvas" {
    copy_canvas_to_TI_px_buffer;
    broadcast_and_wait "write TextImage";
    delete copy_this;
    add TextImage_file to copy_this;
    show copy_this;
}

proc copy_canvas_to_TI_px_buffer {
    # NO DISPLAY TRANSFORM -- SCENE LINEAR
    TI_image_size_x = canvas_size_x;
    TI_image_size_y = (canvas_size_y * canvas_size_z);
    delete TI_1_r;
    delete TI_2_g;
    delete TI_3_b;
    delete TI_4_a;
    i = 1;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add floor(canvas[i].r*255) to TI_1_r;
        add floor(canvas[i].g*255) to TI_2_g;
        add floor(canvas[i].b*255) to TI_3_b;
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

# The render buffer is 2D and opaque
proc copy_render_buffer_to_TI_buffer {
    
    TI_image_size_x = canvas_size_x;
    TI_image_size_y = canvas_size_y;
    delete TI_1_r;
    delete TI_2_g;
    delete TI_3_b;
    delete TI_4_a;
    i = 1;
    repeat (length render_cache_final_col) {
        # separate into RGB components
        add (floor((render_cache_final_col[i]/65536))%256) to TI_1_r;
        add (floor((render_cache_final_col[i]/256))%256) to TI_2_g;
        add (render_cache_final_col[i]%256) to TI_3_b;
        add 255 to TI_4_a;
        i++;
    }
}


on "import to canvas" {
    broadcast_and_wait "read TextImage";
    copy_TI_px_buffer_to_canvas;
    require_composite = true;
}

proc copy_TI_px_buffer_to_canvas {
    canvas_size_x = TI_image_size_x;
    canvas_size_y = TI_image_size_y;
    canvas_size_z = TI_header[1+("!_z" in TI_header)];
    if (canvas_size_z == "") {
        # error "canvas size is unknown";
        stop_this_script;
    }
    delete canvas;
    i = 1;
    repeat (length TI_1_r) {
        add voxel {opacity:floor(TI_4_a[i]*255), r:floor(TI_1_r[i]*255), g:floor(TI_2_g[i]*255), b:floor(TI_3_b[i]*255)} to canvas;
        i++;
    }
}


on "import as heightmap" {
    broadcast_and_wait "read TextImage";
    copy_TI_px_buffer_to_canvas_as_heightmap;
    require_composite = true;
}

# replace opacity data
proc copy_TI_px_buffer_to_canvas_as_heightmap {
    canvas_size_x = TI_image_size_x;
    canvas_size_y = TI_image_size_y;
    # custom
    delete canvas;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add VOXEL_NONE() to canvas;
    }
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        local heightmap_write_z = 0;
        repeat round(canvas_size_z * (TI_2_g[i]/255)) { # using green channel
            canvas[i + heightmap_write_z].opacity = 1;
            heightmap_write_z += layer_size;
        }
        i++;
    }
}


on "import as color map" {
    broadcast_and_wait "read TextImage";
    read_TI_px_buffer_to_canvas_as_2D_color_map;
    require_composite = true;
}

# why isn't there a canvas size setter?
proc read_TI_px_buffer_to_canvas_as_2D_color_map {
    i = 1;
    layer_size = (canvas_size_x * canvas_size_y);
    repeat layer_size { # TODO: enumerate over volume, use mod to repeat the 2D data on the 3rd dimension
        local heightmap_write_z = 0;
        repeat round(canvas_size_z * (TI_2_g[i]/255)) {
            canvas[i + heightmap_write_z].r = antiln((ln((TI_1_r[i]/255))/2.4));
            canvas[i + heightmap_write_z].g = antiln((ln((TI_2_g[i]/255))/2.4));
            canvas[i + heightmap_write_z].b = antiln((ln((TI_3_b[i]/255))/2.4));
            heightmap_write_z += layer_size;
        }
        i++;
    }
}
