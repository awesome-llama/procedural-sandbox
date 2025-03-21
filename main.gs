%include common/common.gs

costumes "costumes/main/main.svg" as "main";
hide;

on "initalise" {
    hide;
}

on "hard reset" {

}

on "start main loop" {
    render_resolution = 1;
    zoom_extents;
    
    require_composite = true;
    require_screen_refresh = true; # TODO rename to viewport
    forever {
        hide; # does this affect yielding?
        
        # reset hover detection
        if not mouse_down() {
            # the last hover variables are so that the click detection hats have usable data.
            # the hats do not run after the main loop.
            UI_last_hovered_group = UI_hovered_group;
            UI_last_hovered_element = UI_hovered_element;
            if abs(mouse_x()) < 240 and abs(mouse_y()) < 180 {
                UI_hovered_group = "viewport"; # default hover is viewport (if mouse is in bounds)
            } else {
                UI_hovered_group = "";
            }
            UI_hovered_element = "";
        
        }

        if (require_composite == true) {
            broadcast "composite";
            require_composite = false;
        }
        if (require_screen_refresh == true) {
            erase_all;
            broadcast "render viewport";
            broadcast "render viewport text";
            require_screen_refresh = false;
        }

        broadcast "render ui"; # always redraw, no erase. This goes to the UI sprite only.
        # more broadcasts for UI may be added although it's not clear if this is needed
    }
}


onkey "any" {
    if (key_pressed("d") or (key_pressed("a") or (key_pressed("w") or key_pressed("s")))) {
        render_resolution = 2;
        until (not (key_pressed("d") or (key_pressed("a") or (key_pressed("w") or key_pressed("s"))))) {
            cam_x += ((4/cam_scale)*(key_pressed("d")-key_pressed("a")));
            cam_y += ((4/cam_scale)*(key_pressed("w")-key_pressed("s")));
            require_screen_refresh = true;
        }
        render_resolution = 1;
        require_screen_refresh = true;
    }
}


onkey "p" {
    broadcast "generate carpet"; # debug
    broadcast "zoom extents";
}

# click and drag to pan
on "stage clicked" {
    if (UI_last_hovered_group == "viewport") {
        prev_mouse_x = mouse_x();
        prev_mouse_y = mouse_y();
        until (not mouse_down()) {
            if (viewport_mode == ViewportMode.COMPOSITOR) {
                cam_x += ((prev_mouse_x-mouse_x())/cam_scale);
                cam_y += ((prev_mouse_y-mouse_y())/cam_scale);
            } else {
                # 3D
            }
            prev_mouse_x = mouse_x();
            prev_mouse_y = mouse_y();
            require_screen_refresh = true;
        }
    }
}

# zoom in
onkey "up arrow" {
    cam_scale = (cam_scale*2);
    if (cam_scale > 32) {
        cam_scale = 32;
    }
    limit_scroll;
    require_screen_refresh = true;
}

# zoom out
onkey "down arrow" {
    cam_scale = (cam_scale/2);
    if (cam_scale < 0.125) {
        cam_scale = 0.125;
    }
    limit_scroll;
    require_screen_refresh = true;
}

# limit camera position to within the canvas
proc limit_scroll  {
    if (cam_x > canvas_size_x) {
        cam_x = canvas_size_x;
    } elif (cam_x < 0) {
        cam_x = 0;
    }
    
    if (cam_y > canvas_size_y) {
        cam_y = canvas_size_y;
    } elif (cam_y < 0) {
        cam_y = 0;
    }
}

onkey "space" {
    require_composite = true;
    require_screen_refresh = true;
}

on "zoom extents" {zoom_extents;}
proc zoom_extents {
    cam_x = (canvas_size_x/2);
    cam_y = (canvas_size_y/2);
    
    if canvas_size_x == 0 or canvas_size_y == 0 {
        cam_scale = 1;
    } elif ((canvas_size_x/canvas_size_y) > (4.0/3.0)) {
        cam_scale = ceil((0.5+(ln((480/canvas_size_x))/ln(2))));
    } else {
        cam_scale = ceil((0.5+(ln((360/canvas_size_y))/ln(2))));
    }

    require_screen_refresh = true;
}


