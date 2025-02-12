# Converted from sb3 file

costumes "costumes/renderer/full.svg" as "full", "costumes/blank.svg" as "blank";


# go to a position in the world
proc goto_world_space x, y {
    goto floor((cam_scale*(cam_x+$x))), floor((cam_scale*(cam_y+$y)));
}

proc render_edge_lines  {
    set_pen_color "#828282";
    set_pen_size 1;
    goto_world_space 0, 0;
    set_y -180;
    pen_down;
    set_y 180;
    pen_up;
    goto_world_space (canvas_size_x-1), 0;
    set_y -180;
    pen_down;
    set_y 180;
    pen_up;
    goto_world_space 0, 0;
    set_x -240;
    pen_down;
    set_x 240;
    pen_up;
    goto_world_space 0, (canvas_size_y-1);
    set_x -240;
    pen_down;
    set_x 240;
    pen_up;
}

# script B[ (-485,331)
on "render canvas" {
    erase_all;
    render_edge_lines;
    render__opaque__at__s__s_scale__s_resolution__s (floor((cam_x*cam_scale))/cam_scale), (floor((cam_y*cam_scale))/cam_scale), cam_scale, render_resolution;
}

# script dI (-466,644)
proc render__opaque__at__s__s_scale__s_resolution__s x, y, scale, res {
    switch_costume "blank";
    set_size "Infinity";
    switch_costume "full";
    if (($scale * $res) > "1") {
        set_pen_size (("1.45"-("0.33"/(($scale*$res)-"0.26")))*($scale*$res));
        offset = ("0.5"*($scale*$res));
    } else {
        set_pen_size ("1"*($scale*$res));
        offset = 0;
    }
    iy = 0;
    repeat (canvas_size_y/$res) {
        ix = 0;
        goto (($scale*($x+ix))+offset), (($scale*($y+iy))+offset);
        if (y_position() > (-180-($scale*$res))) {
            repeat (canvas_size_x/$res) {
                i = (((iy+0)*canvas_size_x)+(ix+"1"));
                set_pen_color render_cache_col[i];
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

# script CD (-1107,1403)
# erase_all;
# set_pen_color (""+(("0x" & "34") & "ff00ff"));
# set_pen_size "456";
# goto 0, 0;
# pen_down;
# pen_up;

# script CG (-997,1833)
# if render_cache_is_not_trans[i] {

# }
