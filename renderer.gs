%include common/common.gs

costumes "costumes/large.svg" as "full", "costumes/blank.svg" as "blank";
hide;

on "initalise" {
    hide;
}

on "render canvas" {
    render_edge_lines;
    render_image (floor(cam_x*cam_scale)/cam_scale), (floor(cam_y*cam_scale)/cam_scale), cam_scale, render_resolution;
}

proc render_image x, y, scale, res {
    switch_costume "blank";
    set_size "Infinity";
    switch_costume "large";
    if (($scale * $res) > 1) {
        set_pen_size ((1.45-(0.33/(($scale*$res)-0.26)))*($scale*$res));
        offset = (0.5*($scale*$res));
    } else {
        set_pen_size (1*($scale*$res));
        offset = 0;
    }
    iy = 0;
    repeat (canvas_size_y/$res) {
        ix = 0;
        goto (($scale*($x+ix))+offset), (($scale*($y+iy))+offset);
        if (y_position() > (-180-($scale*$res))) {
            repeat (canvas_size_x/$res) {
                i = (((iy+0)*canvas_size_x)+(ix + 1));
                set_pen_color render_cache_final_col[i];
                #set_pen_transparency 0;
                pen_down;
                pen_up;
                change_x ($scale*$res);
                ix += $res;
            }
            if (y_position() > 180) {
                stop_this_script;
            }
        }
        iy += $res;
    }
}

proc render_edge_lines  {
    set_pen_color "#727272";
    set_pen_size 1;
    goto_world_space 0, 0;
    set_y -180;
    pen_down;
    set_y 180;
    pen_up;
    goto_world_space (canvas_size_x), 0;
    set_y -180;
    pen_down;
    set_y 180;
    pen_up;
    goto_world_space 0, 0;
    set_x -240;
    pen_down;
    set_x 240;
    pen_up;
    goto_world_space 0, (canvas_size_y);
    set_x -240;
    pen_down;
    set_x 240;
    pen_up;
}


################################
#            Utils             #
################################

# go to a position in the world
proc goto_world_space x, y {
    goto floor(cam_scale*(cam_x+$x)), floor(cam_scale*(cam_y+$y));
}
