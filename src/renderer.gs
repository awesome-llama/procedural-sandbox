%include lib/common

costumes "costumes/large.svg" as "large", "costumes/blank.svg" as "blank";
hide;

on "initalise" {
    hide;
}

on "sys.render_viewport" {
    if (viewport_mode == ViewportMode.ALIGNED) {
        render_edge_lines stage_max_x, stage_max_y;
        render_canvas_2D;
    } elif (viewport_mode == ViewportMode.ORBIT) {
        render_image stage_min_x+UI_sidebar_width, stage_min_y, render_size_x, render_size_y, render_resolution;
    }
}


# Render the canvas. Optimised for 2D rendering, will clip to the edges of the screen.
# In the future this should be generalised to render an image within bounds of an origin and size.
proc render_canvas_2D {
    switch_costume "blank";
    set_size "Infinity";
    switch_costume "large";

    local min_x = 0;
    local min_y = 0;
    local repeat_x = render_size_x//render_resolution;
    local repeat_y = render_size_y//render_resolution;

    # clip to the available screen
    local border = (((((UI_sidebar_width/2)-stage_max_x)/cam_scale)+cam_x)//render_resolution)*render_resolution;
    if (border > min_x) {
        min_x = border;
        repeat_x -= border/render_resolution;
    }
    local border = ((((stage_max_x-(UI_sidebar_width/2))/cam_scale)+cam_x)//render_resolution)*render_resolution;
    if ((border - min_x)/render_resolution+1 < repeat_x) {
        repeat_x = (border - min_x)/render_resolution+1; # add 1 to extend 1 px offscreen
    }

    local border = ((((stage_min_y+10)/cam_scale)+cam_y)//render_resolution)*render_resolution;
    if (border > min_y) {
        min_y = border;
        repeat_y -= border/render_resolution;
    }
    local border = ((((stage_max_y-10)/cam_scale)+cam_y)//render_resolution)*render_resolution;
    if ((border - min_y)/render_resolution+1 < repeat_y) {
        repeat_y = (border - min_y)/render_resolution+1; # add 1 to extend 1 px offscreen
    }

    local pixel_screen_size = cam_scale * render_resolution;
    local ss_origin_x = floor(-cam_x * cam_scale);
    local ss_origin_y = floor(-cam_y * cam_scale);

    if (pixel_screen_size > 1) {
        ss_origin_x += (0.5*pixel_screen_size);
        ss_origin_y += (0.5*pixel_screen_size);
        
        set_pen_size ((1.45-(0.33/(pixel_screen_size-0.26)))*pixel_screen_size);

        # special cases optimising for visual quality in low-quality pen
        if APPROX(pixel_screen_size, 1.5, 0.49) {
            set_pen_size 2;
        } elif APPROX(pixel_screen_size, 2.5, 0.49) {
            set_pen_size 4;
        }
    } else {
        set_pen_size pixel_screen_size;
    }

    iy = min_y;
    repeat (repeat_y) {
        goto ss_origin_x + min_x*cam_scale + (UI_sidebar_width/2), ss_origin_y + iy*cam_scale - 10;
        i = (iy*render_size_x) + min_x + 1;
        repeat (repeat_x) {
            set_pen_color render_buffer_final_col[i];
            pen_down; # dots are required for drawing transparency
            pen_up;
            change_x pixel_screen_size;
            i += render_resolution;
        }
        iy += render_resolution;
    }
}


# Render a full-screen image (for 3D orbit view). Assumes solid pixels filling the screen, therefore is drawn with lines. Resolution is not set here.
proc render_image origin_x, origin_y, size_x, size_y, scale {
    switch_costume "blank";
    set_size "Infinity";
    switch_costume "large";

    local origin_x = $origin_x;
    local origin_y = $origin_y;

    set_pen_size $scale;
    if ($scale > 1) {
        origin_x += (0.5*$scale);
        origin_y += (0.5*$scale);
        if ($scale == 3) {
            set_pen_size 3.1; # fill some gaps
        }
    }

    iy = 0;
    set_y origin_y;
    repeat ($size_y) {
        set_x origin_x - $scale;
        i = (iy * $size_x) + 1;
        set_pen_color render_buffer_final_col[i];
        pen_down;
        change_x $scale * 2;
        repeat ($size_x - 1) {
            i += 1;
            set_pen_color render_buffer_final_col[i];
            change_x $scale;
        }
        pen_up;
        change_y $scale;
        iy += 1;
    }
}


proc render_edge_lines bound_x, bound_y {
    set_pen_color "#656565";
    set_pen_size 1;
    goto_world_space 0, 0;
    set_y -$bound_y;
    pen_down;
    set_y $bound_y;
    pen_up;
    goto_world_space (canvas_size_x), 0;
    set_y -$bound_y;
    pen_down;
    set_y $bound_y;
    pen_up;
    goto_world_space 0, 0;
    set_x -$bound_x;
    pen_down;
    set_x $bound_x;
    pen_up;
    goto_world_space 0, (canvas_size_y);
    set_x -$bound_x;
    pen_down;
    set_x $bound_x;
    pen_up;
}


################################
#            Utils             #
################################

# go to a position in the world
proc goto_world_space x, y {
    goto floor(cam_scale*($x-cam_x)+(UI_sidebar_width/2)), floor(cam_scale*($y-cam_y) - (20/2));
}
