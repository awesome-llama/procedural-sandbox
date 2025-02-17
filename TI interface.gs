# Converted from sb3 file
%include common/common.gs

costumes "costumes/TI interface/icon.svg" as "icon";

on "initalise" {
    hide;
}

on "export canvas" {
    copy_canvas_to_TI_px_buffer;
    broadcast_and_wait "write TextImage";
    delete copy_this;
    add TextImage_file to copy_this;
    show copy_this;
}

proc copy_canvas_to_TI_px_buffer  {
    comment "NO DISPLAY TRANSFORM -- SCENE LINEAR";
    TI_image_size_x = canvas_size_x;
    TI_image_size_y = (canvas_size_y * canvas_size_z);
    delete TI_1_r;
    delete TI_2_g;
    delete TI_3_b;
    delete TI_4_a;
    i = 1;
    repeat (length canvas_1_r) {
        add floor(canvas_1_r[i]*255) to TI_1_r;
        add floor(canvas_2_g[i]*255) to TI_2_g;
        add floor(canvas_3_b[i]*255) to TI_3_b;
        add floor(canvas_4_a[i]*255) to TI_4_a;
        i++;
    }
}

proc copy_render_buffer_to_TI_buffer  {
    comment "separate rgba";
    TI_image_size_x = canvas_size_x;
    TI_image_size_y = canvas_size_y;
    delete TI_1_r;
    delete TI_2_g;
    delete TI_3_b;
    delete TI_4_a;
    i = 1;
    repeat (length render_cache_final_col) {
        add (floor((render_cache_final_col[i]/65536))%256) to TI_1_r;
        add (floor((render_cache_final_col[i]/256))%256) to TI_2_g;
        add (render_cache_final_col[i]%256) to TI_3_b;
        add 255 to TI_4_a;
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

on "import to canvas" {
    broadcast_and_wait "read TextImage";
    copy_TI_px_buffer_to_canvas;
    broadcast "composite";
}

proc copy_TI_px_buffer_to_canvas  {
    canvas_size_x = TI_image_size_x;
    canvas_size_y = TI_image_size_y;
    canvas_size_z = TI_header[1+("!_z" in TI_header)];
    if (canvas_size_z == "") {
        # error "canvas size is unknown";
        stop_this_script;
    }
    delete canvas_1_r;
    delete canvas_2_g;
    delete canvas_3_b;
    delete canvas_4_a;
    i = 1;
    repeat (length TI_1_r) {
        add floor(TI_1_r[i]*255) to canvas_1_r;
        add floor(TI_2_g[i]*255) to canvas_2_g;
        add floor(TI_3_b[i]*255) to canvas_3_b;
        add floor(TI_4_a[i]*255) to canvas_4_a;
        i++;
    }
}

# script Dd (122,1297)
on "import as heightmap" {
    broadcast_and_wait "read TextImage";
    copy_TI_px_buffer_to_canvas_as_heightmap;
    broadcast "composite";
}

# script v| (1484,1168)
proc copy_TI_px_buffer_to_canvas_as_heightmap  {
    canvas_size_x = TI_image_size_x;
    canvas_size_y = TI_image_size_y;
    comment "custom";
    delete canvas_1_r;
    delete canvas_2_g;
    delete canvas_3_b;
    delete canvas_4_a;
    repeat ((canvas_size_x * canvas_size_y) * canvas_size_z) {
        add 0.5 to canvas_1_r;
        add 0.5 to canvas_2_g;
        add 0.5 to canvas_3_b;
        add 0 to canvas_4_a;
    }
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        heightmap_write_z = 0;
        repeat round(canvas_size_z * (TI_2_g[i]/255)) {
            canvas_4_a[i + heightmap_write_z] = 1;
            if false {
                canvas_1_r[i + heightmap_write_z] = (TI_1_r[i]/255);
                canvas_2_g[i + heightmap_write_z] = (TI_2_g[i]/255);
                canvas_3_b[i + heightmap_write_z] = (TI_3_b[i]/255);
            }
            heightmap_write_z += (canvas_size_x*canvas_size_y);
        }
        i++;
    }
}

on "import as color map" {
    broadcast_and_wait "read TextImage";
    read_TI_px_buffer_to_canvas_as_2D_color_map;
    broadcast "composite";
}

proc read_TI_px_buffer_to_canvas_as_2D_color_map  {
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        heightmap_write_z = 0;
        repeat round(canvas_size_z * (TI_2_g[i]/255)) {
            canvas_1_r[i + heightmap_write_z] = antiln((ln((TI_1_r[i]/255))/2.4));
            canvas_2_g[i + heightmap_write_z] = antiln((ln((TI_2_g[i]/255))/2.4));
            canvas_3_b[i + heightmap_write_z] = antiln((ln((TI_3_b[i]/255))/2.4));
            heightmap_write_z += (canvas_size_x * canvas_size_y);
        }
        i++;
    }
}
