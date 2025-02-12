# Converted from sb3 file
%include common/common.gs

costumes "costumes/TI interface/icon.svg" as "icon";

on "export canvas" {
    copy_canvas_to_TI_px_buffer;
    broadcast_and_wait "write TextImage";
    delete copy_this;
    add TextImage to copy_this;
    show copy_this;
}

proc copy_canvas_to_TI_px_buffer  {
    comment "NO DISPLAY TRANSFORM -- SCENE LINEAR";
    TI__image_size_x = canvas_size_x;
    TI__image_size_y = (canvas_size_y*canvas_size_z);
    delete TI__1_r;
    delete TI__2_g;
    delete TI__3_b;
    delete TI__4_a;
    i = 1;
    repeat (length _1_r) {
        add floor((_1_r[i]*"255")) to TI__1_r;
        add floor((_2_g[i]*"255")) to TI__2_g;
        add floor((_3_b[i]*"255")) to TI__3_b;
        add floor((_4_a[i]*"255")) to TI__4_a;
        i++;
    }
}

proc copy_render_buffer_to_TI_buffer  {
    comment "separate rgba";
    TI__image_size_x = canvas_size_x;
    TI__image_size_y = canvas_size_y;
    delete TI__1_r;
    delete TI__2_g;
    delete TI__3_b;
    delete TI__4_a;
    i = 1;
    repeat (length render_cache_col) {
        add (floor((render_cache_col[i]/"65536"))%"256") to TI__1_r;
        add (floor((render_cache_col[i]/"256"))%"256") to TI__2_g;
        add (render_cache_col[i]%"256") to TI__3_b;
        add "255" to TI__4_a;
        i++;
    }
}

on "export render" {
    copy_render_buffer_to_TI_buffer;
    broadcast_and_wait "write TextImage";
    delete copy_this;
    add TextImage to copy_this;
    show copy_this;
}

on "import to canvas" {
    broadcast_and_wait "read TextImage";
    copy_TI_px_buffer_to_canvas;
    broadcast "composite";
}

proc copy_TI_px_buffer_to_canvas  {
    canvas_size_x = TI__image_size_x;
    canvas_size_y = TI__image_size_y;
    canvas_size_z = TI__header[("1"+("!_z" in TI__header))];
    if (canvas_size_z == "") {
        # error "canvas size is unknown";
        stop_this_script;
    }
    delete _1_r;
    delete _2_g;
    delete _3_b;
    delete _4_a;
    i = 1;
    repeat (length TI__1_r) {
        add floor((TI__1_r[i]*"255")) to _1_r;
        add floor((TI__2_g[i]*"255")) to _2_g;
        add floor((TI__3_b[i]*"255")) to _3_b;
        add floor((TI__4_a[i]*"255")) to _4_a;
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
    canvas_size_x = TI__image_size_x;
    canvas_size_y = TI__image_size_y;
    comment "custom";
    delete _1_r;
    delete _2_g;
    delete _3_b;
    delete _4_a;
    repeat ((canvas_size_x*canvas_size_y)*canvas_size_z) {
        add "0.5" to _1_r;
        add "0.5" to _2_g;
        add "0.5" to _3_b;
        add "0" to _4_a;
    }
    i = 1;
    repeat (canvas_size_x*canvas_size_y) {
        heightmap_write_z = "0";
        repeat round((canvas_size_z*(TI__2_g[i]/"255"))) {
            _4_a[(i+heightmap_write_z)] = "1";
            if false {
                _1_r[(i+heightmap_write_z)] = (TI__1_r[i]/"255");
                _2_g[(i+heightmap_write_z)] = (TI__2_g[i]/"255");
                _3_b[(i+heightmap_write_z)] = (TI__3_b[i]/"255");
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
    repeat (canvas_size_x*canvas_size_y) {
        heightmap_write_z = "0";
        repeat round((canvas_size_z*(TI__2_g[i]/"255"))) {
            _1_r[(i+heightmap_write_z)] = antiln((ln((TI__1_r[i]/"255"))/"2.4"));
            _2_g[(i+heightmap_write_z)] = antiln((ln((TI__2_g[i]/"255"))/"2.4"));
            _3_b[(i+heightmap_write_z)] = antiln((ln((TI__3_b[i]/"255"))/"2.4"));
            heightmap_write_z += (canvas_size_x*canvas_size_y);
        }
        i++;
    }
}
