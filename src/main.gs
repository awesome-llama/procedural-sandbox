%include lib/common

costumes "costumes/main/icon.svg" as "icon";
hide;


# 2^(1/increment)
%define ZOOM_INCREMENT sqrt(2)

on "start main loop" {
    if (PS_reset_render_on_flag) {
        requested_render_resolution = 1;
        zoom_extents;
        
        require_composite = true;
        require_viewport_refresh = true;
    }

    last_time = days_since_2000();
    forever {
        dt = 86400*(days_since_2000()-last_time);
        if (dt > 0.1) { dt = 0.1; } # limit to 10 FPS
        last_time = days_since_2000();
        
        # reset hover detection
        if (not mouse_down()) {
            # the last hover variables are so that the click detection hats have usable data.
            # the hats do not run after the main loop.
            UI_last_hovered_group = UI_hovered_group;
            UI_last_hovered_element = UI_hovered_element;
            if abs(mouse_x()) < stage_max_x and abs(mouse_y()) < stage_max_y {
                UI_hovered_group = "viewport"; # default hover is viewport (if mouse is in bounds)
            } else {
                UI_hovered_group = "";
            }
            UI_hovered_element = "";
        }

        if (require_composite == true) {
            broadcast_and_wait "composite";
        }
        if (require_iterative_compositor == true) {
            broadcast_and_wait "iterative compositor";
        }
        if (require_viewport_refresh == true) {
            erase_all;
            broadcast "render viewport";
            broadcast "render viewport overlay";
            require_viewport_refresh = false;
        }

        broadcast "render ui"; # always redraw, no erase. This goes to the UI sprite only.
        # more broadcasts for UI may be added although it's not clear if this is needed
    }
}


%define PRESSED_WASD() ((key_pressed("d") or key_pressed("a")) or (key_pressed("w") or key_pressed("s")))
%define PRESSED_MOVE_X() (key_pressed("d")-key_pressed("a"))
%define PRESSED_MOVE_Y() (key_pressed("w")-key_pressed("s"))

onkey "any" {
    if (PRESSED_WASD()) {
        if (viewport_mode == ViewportMode.ALIGNED) {
            requested_render_resolution = 2;
            until (not PRESSED_WASD()) {
                movement_speed = 200*(1+key_pressed("shift"));
                cam_x += (PRESSED_MOVE_X() * ((dt*movement_speed)/cam_scale));
                cam_y += (PRESSED_MOVE_Y() * ((dt*movement_speed)/cam_scale));
                require_viewport_refresh = true;
            }
            requested_render_resolution = 1;
            require_viewport_refresh = true;
            
        } elif (viewport_mode == ViewportMode.ORBIT) {
            # move the camera forwards or sideways horizontally, using current azimuth
            until (not PRESSED_WASD()) {
                movement_speed = (((canvas_size_x+canvas_size_y)/2)/4)*(1+key_pressed("shift"));
                cam_x += ((PRESSED_MOVE_X()*cos(cam_azi)) - (PRESSED_MOVE_Y()*sin(cam_azi))) * ((dt*movement_speed)/cam_scale);
                cam_y += ((PRESSED_MOVE_X()*sin(cam_azi)) + (PRESSED_MOVE_Y()*cos(cam_azi))) * ((dt*movement_speed)/cam_scale);

                cam_x = cam_x % canvas_size_x;
                cam_y = cam_y % canvas_size_y;

                require_composite = true;
            }
            require_composite = true;
        }
    }
}

proc move_camera dx, dy {
    cam_x += $dx;
    cam_y += $dy;
}


onkey "p" {
    broadcast "gen.test.run"; # debug
    broadcast "zoom extents";
}


%define UPDATE_MOUSE() prev_mouse_x = mouse_x(); prev_mouse_y = mouse_y();

# click and drag to pan
on "stage clicked" {
    if (UI_last_hovered_group == "viewport") {
        if (viewport_mode == ViewportMode.ALIGNED) {
            
            wait_until_mouse_moves;
            if mouse_moved {
                requested_render_resolution = 2;
                until (not mouse_down()) {
                    cam_x += ((prev_mouse_x-mouse_x())/cam_scale);
                    cam_y += ((prev_mouse_y-mouse_y())/cam_scale);
                    UPDATE_MOUSE()
                    require_viewport_refresh = true;
                }
                requested_render_resolution = 1;
                require_viewport_refresh = true;
            }
        } elif (viewport_mode == ViewportMode.ORBIT) {

            wait_until_mouse_moves;
            if mouse_moved {
                requested_render_resolution = PS_render_resolution_default_orbit * 2; # movement uses 2x just to make it faster
                until (not mouse_down()) {
                    cam_azi = (cam_azi + ((prev_mouse_x-mouse_x()) * 0.4)) % 360;
                    cam_elev += ((mouse_y()-prev_mouse_y) * 0.4);
                    if (cam_elev > 85) {
                        cam_elev = 85;
                    } elif (cam_elev < 0) {
                        cam_elev = 0;
                    }
                    UPDATE_MOUSE()
                    require_composite = true;
                }
                requested_render_resolution = PS_render_resolution_default_orbit;
                require_composite = true;
            }
        }
    }
}


nowarp proc wait_until_mouse_moves {
    mouse_moved = false;
    UPDATE_MOUSE()
    until (not mouse_down()) {
        if ((abs(mouse_x()-prev_mouse_x) > 2) or (abs(mouse_y()-prev_mouse_y) > 2)) {
            mouse_moved = true;
            stop_this_script;
        }
    }
    mouse_moved = false;
}


onkey "up arrow" { broadcast "zoom in"; }
on "zoom in" {
    change_zoom 1;
    limit_scroll;
    if (viewport_mode == ViewportMode.ORBIT) {
        require_composite = true;
    }
    require_viewport_refresh = true;
}

onkey "down arrow" { broadcast "zoom out"; }
on "zoom out" {
    change_zoom -1;
    limit_scroll;
    if (viewport_mode == ViewportMode.ORBIT) {
        require_composite = true;
    }
    require_viewport_refresh = true;
}


# limit camera position to within the canvas
proc limit_scroll  {
    if (viewport_mode == ViewportMode.ALIGNED) {
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
}


on "zoom extents" { zoom_extents; }
proc zoom_extents {
    # first get avail width and height of viewport
    local viewport_width = stage_size_x-UI_sidebar_width;
    local viewport_height = stage_size_y-20;

    cam_x = (canvas_size_x/2);
    cam_y = (canvas_size_y/2);
    
    if (canvas_size_x == 0 or canvas_size_y == 0) {
        cam_scale = 1;
    } elif ((canvas_size_x/canvas_size_y) > (viewport_width/viewport_height)) { # find which side will reach the limit first
        # x is largest
        cam_scale = ceil((0.5+(ln((viewport_width/canvas_size_x))/ln(2)))); # TODO
    } else {
        # y is largest
        cam_scale = ceil((0.5+(ln((viewport_height/canvas_size_y))/ln(2))));
    }

    if (viewport_mode == ViewportMode.ORBIT) {
        cam_azi = -45;
        cam_elev = 45;
        require_composite = true;
    } else {
        require_viewport_refresh = true;
    }
}


proc change_zoom increment {
    cam_scale = POW(ZOOM_INCREMENT, round(LOG(cam_scale, ZOOM_INCREMENT) + $increment));
    
    # limits
    if (cam_scale < 0.25) {
        cam_scale = 0.25;
    } elif (cam_scale > 32) {
        cam_scale = 32;
    }
}

