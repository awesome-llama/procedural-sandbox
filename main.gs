# Converted from sb3 file
%include common/common.gs

costumes "costumes/main/main.svg" as "main";

# This is the sole green flag script in the project.
onflag {
    __dev = round((username() == "awesome-llama"));
    render_resolution = 1;
    zoom_extents;
    refresh_screen_ = 1;
    forever {
        wait_until (refresh_screen_ > 0);
        erase_all;
        broadcast "render canvas";
        broadcast "render world text";
        refresh_screen_ = 0;
    }
}

# script ax (994,806)
onkey "any" {
    if (touching("d") or (touching("a") or (touching("w") or touching("s")))) {
        render_resolution = 2;
        until (not (touching("d") or (touching("a") or (touching("w") or touching("s"))))) {
            cam_x += ((4/cam_scale)*(touching("a")-touching("d")));
            cam_y += ((4/cam_scale)*(touching("s")-touching("w")));
            refresh_screen_ = 1;
        }
        render_resolution = 1;
        refresh_screen_ = 1;
    }
}

# script h] (991,240)
on "stage clicked" {
    _mouse_x = mouse_x();
    _mouse_y = mouse_y();
    until (not mouse_down()) {
        cam_x += ((mouse_x()-_mouse_x)/cam_scale);
        cam_y += ((mouse_y()-_mouse_y)/cam_scale);
        _mouse_x = mouse_x();
        _mouse_y = mouse_y();
        refresh_screen_ = 1;
    }
}

onkey "up arrow" {
    if (cam_scale < 32) {
        cam_scale = (cam_scale*2);
        limit_scroll;
    }
    refresh_screen_ = 1;
}

onkey "down arrow" {
    if (cam_scale > 0.5) {
        cam_scale = (cam_scale/2);
        limit_scroll;
    }
    refresh_screen_ = 1;
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
    refresh_screen_ = 1;
}

on "zoom extents" {zoom_extents;}
proc zoom_extents  {
    cam_x = (canvas_size_x/-2);
    cam_y = (canvas_size_y/-2);
    
    if canvas_size_x == 0 or canvas_size_y == 0 {
        cam_scale = 1;
    } elif ((canvas_size_x/canvas_size_y) > (4/3)) {
        cam_scale = ceil((0.5+(ln((480/canvas_size_x))/ln(2))));
    } else {
        cam_scale = ceil((0.5+(ln((360/canvas_size_y))/ln(2))));
    }

    refresh_screen_ = 1;
}


