#%include common/common.gs

costumes "costumes/main/main.svg" as "main";


on "initalise" {
    hide;
}

on "hard reset" {

}

on "start main loop" {
    render_resolution = 1;
    zoom_extents;
    refresh_screen_required = 1;
    forever {
        wait_until (refresh_screen_required > 0);
        erase_all;
        broadcast "render canvas";
        broadcast "render world text";
        refresh_screen_required = 0;
    }
}


onkey "any" {
    if (key_pressed("d") or (key_pressed("a") or (key_pressed("w") or key_pressed("s")))) {
        render_resolution = 2;
        until (not (key_pressed("d") or (key_pressed("a") or (key_pressed("w") or key_pressed("s"))))) {
            cam_x += ((4/cam_scale)*(key_pressed("a")-key_pressed("d")));
            cam_y += ((4/cam_scale)*(key_pressed("s")-key_pressed("w")));
            refresh_screen_required = 1;
        }
        render_resolution = 1;
        refresh_screen_required = 1;
    }
}


# click and drag to pan
on "stage clicked" {
    prev_mouse_x = mouse_x();
    prev_mouse_y = mouse_y();
    until (not mouse_down()) {
        cam_x += ((mouse_x()-prev_mouse_x)/cam_scale);
        cam_y += ((mouse_y()-prev_mouse_y)/cam_scale);
        prev_mouse_x = mouse_x();
        prev_mouse_y = mouse_y();
        refresh_screen_required = 1;
    }
}

# zoom in
onkey "up arrow" {
    if (cam_scale < 32) {
        cam_scale = (cam_scale*2);
        limit_scroll;
    }
    refresh_screen_required = 1;
}

# zoom out
onkey "down arrow" {
    if (cam_scale > 0.5) {
        cam_scale = (cam_scale/2);
        limit_scroll;
    }
    refresh_screen_required = 1;
}

# limit camera position to within the canvas
proc limit_scroll  {
    if (cam_x > canvas_size_x) {
        cam_x = canvas_size_x;
    } elif (cam_x < (0-canvas_size_x)) {
        cam_x = (0-canvas_size_x);
    }
    
    if (cam_y > canvas_size_y) {
        cam_y = canvas_size_y;
    } elif (cam_y < (0-canvas_size_y)) {
        cam_y = (0-canvas_size_y);
    }
}

onkey "space" {
    broadcast "composite";
    refresh_screen_required = 1;
}

on "zoom extents" {zoom_extents;}
proc zoom_extents {
    cam_x = (canvas_size_x/-2);
    cam_y = (canvas_size_y/-2);
    
    if canvas_size_x == 0 or canvas_size_y == 0 {
        cam_scale = 1;
    } elif ((canvas_size_x/canvas_size_y) > (4/3)) {
        cam_scale = ceil((0.5+(ln((480/canvas_size_x))/ln(2))));
    } else {
        cam_scale = ceil((0.5+(ln((360/canvas_size_y))/ln(2))));
    }

    refresh_screen_required = 1;
}


