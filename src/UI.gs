%include lib/common

costumes 
"costumes/UI/icon.svg" as "icon", 
"costumes/large.svg" as "large",
"costumes/blank.svg" as "",
"costumes/blank.svg" as "@ascii/",
"costumes/blank.svg" as "blank",
"costumes/UI/icons/triangle.svg",
"costumes/UI/icons/fill.svg",
"costumes/UI/icons/select.svg",
"costumes/UI/icons/settings.svg",
"costumes/UI/icons/texture.svg",
"costumes/UI/icons/viewport 2D.svg",
"costumes/UI/icons/viewport 3D.svg",
"costumes/UI/icons/zoom in.svg",
"costumes/UI/icons/zoom out.svg",
"costumes/UI/icons/zoom fit.svg",
"costumes/UI/icons/info.svg",
"costumes/UI/hsv0.png",
"costumes/UI/hsv1.png",
"costumes/UI/mouse detect.svg" as "mouse detect";
hide;


on "initalise" {
    hide;
    unfenced_mouse_x = 0;
}

on "sys.hard_reset" {
    UI_sidebar_width = 160;
}

%define TOP_BAR_HEIGHT 20

# background panel colour
%define THEME_COL_BG "#404040"

# the darker fill colour inside elements
%define THEME_COL_FILL "#333333"

# the darker fill colour inside elements, highlighted
%define THEME_COL_FILL_HIGHLIGHT "#404040"

# border of elements
%define THEME_COL_OUTLINE "#707070"

# outline when hovered
%define THEME_COL_OUTLINE_HIGHLIGHT "#aaaaaa"

# all text colour
%define THEME_COL_TEXT "#ffffff"

# all text colour
%define THEME_COL_TEXT_MINOR "#aaaaaa"

%define LINEHIGHT 16
%define TXT_Y_OFFSET 12
%define INPUT_WIDTH 50


# Render the UI and handle mouse hover detection. Constantly renders, this is because the ui needs to be interactive.
on "sys.render_UI" {
    clear_graphic_effects;
    switch_costume "large";
    point_in_direction 90;
    set_size 100;

    # VIEWPORT
    UI_check_touching_mouse stage_min_x+UI_sidebar_width, stage_max_y-TOP_BAR_HEIGHT, stage_size_x-UI_sidebar_width, stage_size_y-TOP_BAR_HEIGHT, "viewport", "";

    # TOP BAR
    draw_rect stage_min_x+UI_sidebar_width, stage_max_y-TOP_BAR_HEIGHT, stage_size_x-UI_sidebar_width, TOP_BAR_HEIGHT, 1, "#505050";
    set_pen_color "#ffffff";
    render_top_bar stage_min_x+UI_sidebar_width, stage_max_y;

    # SIDE BAR
    if (UI_sidebar_width > 8) {
        if (UI_current_panel == "menu.io" or UI_current_panel == "menu.gen" or UI_current_panel == "menu.fx" or UI_current_panel == "menu.draw" or UI_current_panel == "menu.settings") {
            draw_rect stage_min_x, stage_min_y, UI_sidebar_width, stage_size_y, 0, "#423C4F";
        } else {
            draw_rect stage_min_x, stage_min_y, UI_sidebar_width, stage_size_y, 0, THEME_COL_BG;
        }
        
        UI_check_touching_mouse stage_min_x, stage_max_y, UI_sidebar_width, stage_size_y, "side bar", "";

        render_side_bar stage_min_x+4, stage_max_y-TOP_BAR_HEIGHT, UI_sidebar_width-8, stage_size_y-TOP_BAR_HEIGHT;

        # tabs
        draw_rect stage_min_x, stage_max_y-TOP_BAR_HEIGHT, UI_sidebar_width, TOP_BAR_HEIGHT, 0, "#271D33";
        tab_offset = stage_min_x;
        tab_button tab_offset, 34, "I/O", "menu.io";
        tab_button tab_offset, 37, "Gen", "menu.gen";
        tab_button tab_offset, 31, "FX", "menu.fx";
        tab_button tab_offset, 58, "Settings", "menu.settings";

        # TODO note in top bar
    }

    render_popup;
    render_project_messages;
    switch_costume "icon";
}


proc render_side_bar x, y, width, height {
    local curr_index = (UI_current_panel in UI_data_panels);
    if curr_index > 0 {
        render_modular_element UI_data_panels[curr_index + 1], $x, $y, $width, "side bar";
    }
}


# get the index of a UI element
%define UI_DATA_INDEX(ID) UI_data_element_index[(ID) in UI_data_element_id]

proc render_popup {
    
    if UI_popup[1] { # is showing
        
        draw_UI_rect UI_popup[3], UI_popup[4], UI_popup[5]+1, UI_popup[6], 3, THEME_COL_OUTLINE, THEME_COL_BG;
        UI_check_touching_mouse UI_popup[3], UI_popup[4], UI_popup[5]+1, UI_popup[6], "popup", "";
        
        # render the different popups depending on data
        if UI_popup[2] == "color picker" {
            UI_y = UI_popup[4]-5; # UI_y is the same variable used by the modular element procedure

            # draw new proposed color
            local CP_col = get_setting_from_id("popup.color_picker.color");
            draw_UI_rect UI_popup[3]+5, UI_y, 120, 10, 0, CP_col, CP_col;

            # draw original colour preview on top
            draw_UI_rect UI_popup[3]+5, UI_y, 30, 10, 0, UI_data[UI_popup[7]+3], UI_data[UI_popup[7]+3];

            UI_check_touching_mouse UI_popup[3]+5, UI_y-12, 50, 9, "popup", "set_col_from_hex";
            if (UI_last_hovered_group == "popup") and (UI_last_hovered_element == "set_col_from_hex") {
                set_pen_color THEME_COL_OUTLINE_HIGHLIGHT;
            } else {
                set_pen_color THEME_COL_TEXT;
            }
            plainText UI_popup[3]+5, UI_y-21, 1, "#" & RGB_num_to_hex_code(CP_col);

            UI_y -= 25;

            #if (get_setting_from_id("popup.color_picker.mode") == 0) {
            local CP_h = get_setting_from_id("popup.color_picker.hue");
            local CP_s = get_setting_from_id("popup.color_picker.sat");
            local CP_v = get_setting_from_id("popup.color_picker.val");

            UI_check_touching_mouse UI_popup[3]+4, (UI_y+1), 122, 82, "popup", "HSV_2D";
            if (UI_last_hovered_group == "popup") and (UI_last_hovered_element == "HSV_2D") {
                set_pen_color THEME_COL_OUTLINE_HIGHLIGHT;
                set_pen_size 1;
                draw_rectangle_corner_wh UI_popup[3]+4, (UI_y-81), 121, 81;
            }

            clear_graphic_effects;
            switch_costume "hsv1";
            goto UI_popup[3]+65, UI_y-40;
            stamp;
            switch_costume "hsv0";
            set_ghost_effect CP_s*100;
            stamp;
            
            set_pen_color "#ffffff";
            set_pen_size 1;
            draw_rectangle_corner_wh round(UI_popup[3]+5+(CP_h*120)-2), round((UI_y-80)+(CP_v*80)-2), 3, 3;
            UI_y -= 84;

            render_modular_element UI_DATA_INDEX("popup.color_picker.hue"), UI_popup[3]+5, UI_y, UI_popup[5]-10, "popup";

            # update color from HSV sliders
            set_setting_from_id "popup.color_picker.color", HSV_to_number(CP_h, CP_s, CP_v);
            #}

            set_pen_color THEME_COL_TEXT;
            render_modular_element UI_DATA_INDEX("popup.color_picker.cancel"), UI_popup[3]+5, UI_popup[4]-165, 58, "popup";
            render_modular_element UI_DATA_INDEX("popup.color_picker.apply"), UI_popup[3]+67, UI_popup[4]-165, 58, "popup";
        
        } elif UI_popup[2] == "compositor mode" {
            # list of buttons
            render_modular_element UI_DATA_INDEX("project.compositor_mode.1"), UI_popup[3]+5, UI_popup[4]-4, 90, "popup";
            
        } elif UI_popup[2] == "dropdown" {
            # not implemented, there aren't any dropdowns yet
        } 

    }
}


on "popup.color_picker.cancel" {
    delete UI_popup;
    require_viewport_refresh = true;
}


on "popup.color_picker.apply" {
    if (UI_popup[2] == "color picker") {
        # copy to actual col element
        UI_data[UI_popup[7]+3] = get_setting_from_id("popup.color_picker.color");
    } else {
        error "not a color picker";
    }
    delete UI_popup;
    require_viewport_refresh = true;
}


proc set_color_picker_sliders_from_color {
    if (true) { # get_setting_from_id("popup.color_picker.mode") == 0
        # convert RGB num to HSV
        local CP_col = get_setting_from_id("popup.color_picker.color");
        local HSV col_picker_hsv = RGB_to_HSV((CP_col//65536)%256/255, (CP_col//256)%256/255, CP_col%256/255);
        set_value_element UI_DATA_INDEX("popup.color_picker.hue"), col_picker_hsv.h, false;
        set_value_element UI_DATA_INDEX("popup.color_picker.sat"), col_picker_hsv.s, false;
        set_value_element UI_DATA_INDEX("popup.color_picker.val"), col_picker_hsv.v, false;
    } else {
        error "not implemented";
    }
}


# create a new popup with the common properties. Add extra list items after calling this for any custom data.
proc create_popup type, x, y, width, height {
    delete UI_popup;
    add true to UI_popup; # item 1, truthy first item means the popup is showing
    add $type to UI_popup; # item 2

    # item 3, fence x
    if ($x < stage_min_x) {
        add stage_min_x to UI_popup;
    } elif ($x+$width > stage_max_x) {
        add stage_max_x-$width to UI_popup;
    } else {
        add round($x) to UI_popup;
    }

    # item 4, fence y
    if ($y > stage_max_y) {
        add stage_max_y to UI_popup;
    } elif ($y-$height < stage_min_y) {
        add stage_min_y+$height to UI_popup;
    } else {
        add round($y) to UI_popup;
    }

    add $width to UI_popup; # item 5
    add $height to UI_popup; # item 6
}


proc render_project_messages {
    local msg_i = 1;

    # update list of messages, not for rendering them
    local msg_i = 1;
    repeat ((length project_messages) / 2) {
        project_messages[msg_i+1] -= dt; # replace this with delta time
        if (project_messages[msg_i+1] < 0) {
            # delete message:
            delete project_messages[msg_i];
            delete project_messages[msg_i];
            require_viewport_refresh = true;
        } else {
            local msg_bottom_y = (stage_max_y-20)-msg_i*10 - 6;

            UI_check_touching_mouse (stage_min_x+10), msg_bottom_y+20, (stage_size_x-20), 20, "message", msg_i;
            if (UI_last_hovered_group == "message") and (UI_last_hovered_element == msg_i) {
                draw_rect (stage_min_x+10), msg_bottom_y + 1, (stage_size_x-20), 18, 3, "#202020"; # background
                set_pen_color "#a03030";
                plainText (stage_max_x-25), msg_bottom_y + 7, 1, "x"; # close indicator
            } else {
                draw_rect (stage_min_x+10), msg_bottom_y + 1, (stage_size_x-20), 18, 3, "#000000"; # background
            }
            
            set_pen_color "#00ffff";
            plainText (stage_min_x+20), msg_bottom_y + 6, 1, project_messages[msg_i];

            msg_i += 2;
        }
    }
} 


# custom implementation, not general-purpose
proc tab_button x, width, text, hover_id {
    if (abs(mouse_x()) < stage_max_x) and (abs(mouse_y()) < stage_max_y) {
        UI_check_touching_mouse $x, stage_max_y, $width, TOP_BAR_HEIGHT, "tabs", $hover_id;
    }
    if (UI_last_hovered_group == "tabs") and (UI_last_hovered_element == $hover_id) {
        draw_rect $x, stage_max_y-TOP_BAR_HEIGHT, $width, TOP_BAR_HEIGHT, 0, "#BD91FF";
        set_pen_color "#000000";
    } else {
        if (UI_current_panel == $hover_id) {
            draw_rect $x, stage_max_y-TOP_BAR_HEIGHT, $width, TOP_BAR_HEIGHT, 0, "#423C4F";
        }
        set_pen_color "#ffffff";
    }
    plainText $x+9, (stage_max_y-TOP_BAR_HEIGHT)+6, 1, $text;
    tab_offset += $width;
}


%define TOP_BAR_OFFSET(INDEX) ($x+(INDEX)*20-10)

proc render_top_bar x, y {
    set_pen_color "#ffffff";

    UI_check_touching_mouse $x, $y, stage_size_x-UI_sidebar_width, TOP_BAR_HEIGHT, "top bar", "";

    # arrow
    if (UI_sidebar_width < 8) {
        top_bar_button "open side bar", "triangle", TOP_BAR_OFFSET(1), $y-10, false;
    } else {
        point_in_direction -90;
        top_bar_button "close side bar", "triangle", TOP_BAR_OFFSET(1), $y-10, false;
        point_in_direction 90;
    }

    # viewport buttons
    top_bar_button "viewport 2D", "viewport 2D", TOP_BAR_OFFSET(3), $y-10, (viewport_mode == ViewportMode.ALIGNED);
    top_bar_button "viewport 3D", "viewport 3D", TOP_BAR_OFFSET(4), $y-10, (viewport_mode == ViewportMode.ORBIT);
    top_bar_button "compositor mode", "texture", TOP_BAR_OFFSET(6), $y-10, false;
    
    top_bar_button "zoom out", "zoom out", TOP_BAR_OFFSET(8), $y-10, false;
    top_bar_button "zoom fit", "zoom fit", TOP_BAR_OFFSET(9), $y-10, false;
    top_bar_button "zoom in", "zoom in", TOP_BAR_OFFSET(10), $y-10, false;
}

# custom implementation, not general-purpose
proc top_bar_button id, costume, x, y, enabled {
    if (abs(mouse_x()-$x) < 10 and abs(mouse_y()-$y) < 10) {
        UI_hovered_group = "top bar";
        UI_hovered_element = $id;
    }

    goto $x, $y;

    if ($enabled) {
        set_ghost_effect 70;
        switch_costume "fill";
        stamp;
    }
    clear_graphic_effects;
    switch_costume $costume;
    stamp;

    clear_graphic_effects;
    if (UI_last_hovered_group == "top bar") and (UI_last_hovered_element == $id) {
        switch_costume "select";
        stamp;
    }
}


on "sys.render_viewport_overlay" { render_viewport_overlay; }
proc render_viewport_overlay {
    # Text
    set_pen_color THEME_COL_TEXT;
    plainText stage_min_x+UI_sidebar_width+5, stage_max_y-TOP_BAR_HEIGHT-10, 1, ("canvas size: " & ((((canvas_size_x & ", ") & canvas_size_y) & ", ") & canvas_size_z));
    plainText stage_min_x+UI_sidebar_width+5, stage_max_y-TOP_BAR_HEIGHT-20, 1, (compositor_mode);
    plainText stage_min_x+UI_sidebar_width+5, stage_max_y-TOP_BAR_HEIGHT-30, 1, ("cam scale: " & round(cam_scale*100)/100);
    plainText stage_min_x+UI_sidebar_width+5, stage_max_y-TOP_BAR_HEIGHT-40, 1, ("timer: " & floor(( 100 * ((86400 * days_since_2000()) % 1))) & ", " & counted_samples & "/" & PS_max_samples);
  
    # Axes
    draw_axes stage_min_x+UI_sidebar_width+15, stage_min_y+15, 10;
}

proc draw_axes ox, oy, size {
    set_pen_size 1;

    if (viewport_mode == ViewportMode.ALIGNED) {
        set_pen_color "#00ff00";
        goto $ox, $oy;
        pen_down;
        goto $ox, $oy+$size;
        pen_up;

        set_pen_color "#ff0000";
        goto $ox, $oy;
        pen_down;
        goto $ox+$size, $oy;
        pen_up;

    } elif (viewport_mode == ViewportMode.ORBIT) {
        if (compositor_mode == CompositorMode.PATHTRACED) {
            set_pen_color "#ffff00";
            set_pen_size 2;
            calculate_sun_vector;
            local XYZ axis_vec = rotate_world_space_to_cam_space(sun_direction.x, sun_direction.y, sun_direction.z);
            goto $ox+axis_vec.x*$size, $oy+axis_vec.y*$size;
            pen_down;
            pen_up;
        }
    
        set_pen_color "#00ff00";
        goto $ox, $oy;
        pen_down;
        local XYZ axis_vec = rotate_world_space_to_cam_space(0, $size, 0);
        goto $ox+axis_vec.x, $oy+axis_vec.y;
        pen_up;

        set_pen_color "#ff0000";
        goto $ox, $oy;
        pen_down;
        local XYZ axis_vec = rotate_world_space_to_cam_space($size, 0, 0);
        goto $ox+axis_vec.x, $oy+axis_vec.y;
        pen_up;

        set_pen_color "#0000ff"; # render z last because it is always closer to the camera
        goto $ox, $oy;
        pen_down;
        local XYZ axis_vec = rotate_world_space_to_cam_space(0, 0, $size);
        goto $ox+axis_vec.x, $oy+axis_vec.y;
        pen_up;
    }
}


# modular panel specific
%define IS_HOVERED_MODULAR_PANEL() ((UI_last_hovered_group == $panel_id) and (UI_last_hovered_element == $index))

# modular panel
# recursive procedure, renders each modular element and then the next until an END is found.
proc render_modular_element index, x, y, width, panel_id {
    # index is to select what part of the list to read from

    UI_y = $y; # used as a return var for container next, required
    local elem_type = UI_data[$index];
    if (elem_type[1] == "#") {
        # spacing or comment, skip
        render_modular_element $index+1, $x, UI_y, $width, $panel_id;

    } elif (elem_type == "LABEL") {
        # [type, text, color]
        if (UI_data[$index+2] == "") { # custom color
            set_pen_color THEME_COL_TEXT;
        } else {
            set_pen_color UI_data[$index+2];
        }
        plainText $x, $y-TXT_Y_OFFSET, 1, UI_data[$index+1];
        UI_y -= LINEHIGHT;
        render_modular_element $index+3, $x, UI_y, $width, $panel_id;

    } elif (elem_type == "TEXTBLOCK") {
        # [type, text, color]
        if (UI_data[$index+2] == "") { # custom color
            set_pen_color THEME_COL_TEXT_MINOR;
        } else {
            set_pen_color UI_data[$index+2];
        }
        wrappedText $x, $y-TXT_Y_OFFSET, 1, UI_data[$index+1], $width;
        UI_y += (y_offset-($y+4));
        render_modular_element $index+3, $x, UI_y, $width, $panel_id;

    } elif (elem_type == "SEPARATOR") {
        # [type, line_width_fac, height]
        if (UI_data[$index+1] > 0) {
            set_pen_color THEME_COL_FILL;
            set_pen_size 1;
            goto $x, $y-ceil(UI_data[$index+2]/2);
            pen_down;
            change_x $width*UI_data[$index+1];
            pen_up;
        }
        UI_y -= UI_data[$index+2];
        render_modular_element $index+3, $x, UI_y, $width, $panel_id;

    } elif (elem_type == "BUTTON") {
        # [type, label, id, action, action_data]
        UI_check_touching_mouse $x, $y-1, $width, LINEHIGHT, $panel_id, $index;
        if (IS_HOVERED_MODULAR_PANEL()) {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT, 4, THEME_COL_OUTLINE_HIGHLIGHT, "#656565";
        } else {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT, 4, THEME_COL_OUTLINE, "#555555";
        }
        
        set_pen_color THEME_COL_TEXT;
        plainText $x+8, $y-TXT_Y_OFFSET, 1, UI_data[$index+1];
        UI_y -= (LINEHIGHT+2);
        render_modular_element $index+5, $x, UI_y, $width, $panel_id;

    } elif (elem_type == "CHECKBOX") {
        # [type, label, id, checked, default]
        set_pen_color THEME_COL_TEXT;
        plainText $x, $y-TXT_Y_OFFSET, 1, UI_data[$index+1];
        
        UI_check_touching_mouse (($x+$width)-LINEHIGHT), $y, LINEHIGHT, LINEHIGHT, $panel_id, $index;
        if (IS_HOVERED_MODULAR_PANEL()) {
            draw_UI_rect (($x+$width)-12), ($y-2), 12, 12, 2, THEME_COL_OUTLINE_HIGHLIGHT, THEME_COL_FILL_HIGHLIGHT;
        } else {
            draw_UI_rect (($x+$width)-12), ($y-2), 12, 12, 2, THEME_COL_OUTLINE, THEME_COL_FILL;
        }

        if (UI_data[$index+3] == 1) { # checked is true
            set_pen_color THEME_COL_TEXT;
            set_pen_size 6;
            goto (($x+$width)-6), ($y-8);
            pen_down;
            pen_up;
        }
        UI_y -= LINEHIGHT;
        render_modular_element $index+5, $x, UI_y, $width, $panel_id;

    } elif (elem_type == "VALUE") {
        # [type, label, id, val, default, soft_min, soft_max, hard_min, hard_max, step, shape]

        if (UI_data[$index+10] == "full") {
            UI_check_touching_mouse $x, $y, $width, LINEHIGHT, $panel_id, $index;
            if (IS_HOVERED_MODULAR_PANEL()) {
                # darkens to better show fill indicator
                draw_UI_rect $x, ($y-1), $width, LINEHIGHT-2, 2, THEME_COL_OUTLINE_HIGHLIGHT, "#151515";
            } else {
                draw_UI_rect $x, ($y-1), $width, LINEHIGHT-2, 2, THEME_COL_OUTLINE, THEME_COL_FILL;
            }

            # draw the fill indicator
            if (UI_data[$index+3] != UI_data[$index+5]) {
                draw_rect $x+1, $y-(LINEHIGHT-2), round(($width-2)*UNLERP(UI_data[$index+5],UI_data[$index+6],UI_data[$index+3])), LINEHIGHT-4, 0, "#505050"; 
            }

            # text
            set_pen_color THEME_COL_TEXT;
            plainText $x+5, $y-TXT_Y_OFFSET, 1, (UI_data[$index+1] & ": " & UI_data[$index+3]);

            if (IS_HOVERED_MODULAR_PANEL()) {
                set_ghost_effect 50;
                if (UI_data[$index+3] != UI_data[$index+5]) {
                    draw_triangle $x-2, $y-8, 180;
                }
                if (UI_data[$index+3] != UI_data[$index+6]) {
                    draw_triangle $x+$width+2, $y-8, 0;
                }
                set_ghost_effect 0;
            }

        } else {
            UI_check_touching_mouse (($x+$width)-INPUT_WIDTH), $y, INPUT_WIDTH, LINEHIGHT, $panel_id, $index;
            if (IS_HOVERED_MODULAR_PANEL()) {
                draw_UI_rect (($x+$width)-INPUT_WIDTH), ($y-1), INPUT_WIDTH, LINEHIGHT-2, 2, THEME_COL_OUTLINE_HIGHLIGHT, THEME_COL_FILL_HIGHLIGHT;
            } else {
                draw_UI_rect (($x+$width)-INPUT_WIDTH), ($y-1), INPUT_WIDTH, LINEHIGHT-2, 2, THEME_COL_OUTLINE, THEME_COL_FILL;
            }
            
            set_pen_color THEME_COL_TEXT;
            plainText $x, $y-TXT_Y_OFFSET, 1, UI_data[$index+1];
            plainText (($x+$width)-INPUT_WIDTH)+3, $y-TXT_Y_OFFSET, 1, UI_data[$index+3];
            
            if (IS_HOVERED_MODULAR_PANEL()) {
                set_ghost_effect 50;
                if (UI_data[$index+3] != UI_data[$index+5]) {
                    draw_triangle $x+$width-INPUT_WIDTH-2, $y-8, 180;
                }
                if (UI_data[$index+3] != UI_data[$index+6]) {
                    draw_triangle $x+$width+2, $y-8, 0;
                }
                set_ghost_effect 0;
            }
        }

        UI_y -= LINEHIGHT;
        render_modular_element $index+11, $x, UI_y, $width, $panel_id;
    
    } elif (elem_type == "COLOR") {
        # [type, label, id, color, default]
        set_pen_color THEME_COL_TEXT;
        plainText $x, $y-TXT_Y_OFFSET, 1, UI_data[$index+1];
        
        UI_check_touching_mouse (($x+$width)-32), $y, 32, LINEHIGHT, $panel_id, $index;
        if (IS_HOVERED_MODULAR_PANEL()) {
            draw_UI_rect (($x+$width)-32), ($y-1), 32, LINEHIGHT-2, 4, THEME_COL_OUTLINE_HIGHLIGHT, UI_data[$index+3];
        } else {
            draw_UI_rect (($x+$width)-32), ($y-1), 32, LINEHIGHT-2, 4, THEME_COL_OUTLINE, UI_data[$index+3];
        }

        UI_y -= LINEHIGHT;
        render_modular_element $index+5, $x, UI_y, $width, $panel_id;

    } elif (elem_type == "EXPANDER") {
        # [type, label, id, opened, height, size_of_self (number of items)]

        if (UI_data[$index+3] == 1) { # open
            UI_y -= (LINEHIGHT+2);
            render_modular_element $index+5, $x+5, UI_y, $width-10, $panel_id; # first child
            
            UI_y -= 4; # line (from bottom of rect) then margin

            set_pen_color THEME_COL_OUTLINE;
            set_pen_size 1;
            goto $x, $y-5;
            pen_down;
            set_y UI_y+3;
            goto $x+1, UI_y+2;
            set_x $x+$width-2;
            goto $x+$width-1, UI_y+3;
            set_y $y-5;
            pen_up;

        } else {
            UI_y -= (LINEHIGHT+2);
        }

        UI_check_touching_mouse $x, $y-1, $width, LINEHIGHT, $panel_id, $index;
        if (IS_HOVERED_MODULAR_PANEL()) {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT, 3, THEME_COL_OUTLINE_HIGHLIGHT, "#444444";
        } else {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT, 3, THEME_COL_OUTLINE, THEME_COL_FILL;
        }

        set_pen_color THEME_COL_TEXT;
        plainText $x+17, $y-TXT_Y_OFFSET, 1, UI_data[$index+1]; # label

        if (UI_data[$index+3] == 1) { # open
            draw_triangle $x+8, ($y-9), -90;
        } else {
            draw_triangle $x+8, ($y-9), 0;
        }

        render_modular_element $index+UI_data[$index+4], $x, UI_y, $width, $panel_id; # next
    }
}


# Check if the mouse is in a given rectangle, inclusive of bounds. Height is measured downwards.
proc UI_check_touching_mouse x, y, width, height, hov_group, hov_elem {
    if (not (((mouse_x() < $x) or (mouse_x() > ($x+$width))) or ((mouse_y() > $y) or (mouse_y() < ($y-$height))))) {
        UI_hovered_group = $hov_group;
        UI_hovered_element = $hov_elem;
    }
}



on "sys.stage_clicked" {
    stop_other_scripts; # stop previous ask block
    clicked_element = UI_last_hovered_element; # alias

    if (UI_last_hovered_group == "message") {
        if (UI_last_hovered_element % 2) == 1 {
            # delete message
            delete project_messages[UI_last_hovered_element];
            delete project_messages[UI_last_hovered_element];
            require_viewport_refresh = true;
        }
        
        stop_this_script;
    }

    if (UI_last_hovered_group == "popup") {
        
        if (UI_last_hovered_element == "HSV_2D") {
            # set hue and val by mouse position
            until not mouse_down() {
                set_value_element UI_data_element_index["popup.color_picker.hue" in UI_data_element_id], (mouse_x()-(UI_popup[3]+5))/120, true;
                set_value_element UI_data_element_index["popup.color_picker.val" in UI_data_element_id], (mouse_y()-(UI_popup[4]-30-80))/80, true;
            }
        } elif (UI_last_hovered_element == "set_col_from_hex") {
            ask "input a color (6-digit hex code)";
            if (answer() != "") {
                if (answer()[1] == "#") {
                    if (length answer() == 7) {
                        set_setting_from_id "popup.color_picker.color", 0+("0x"&answer()[2]&answer()[3]&answer()[4]&answer()[5]&answer()[6]&answer()[7]);
                        set_color_picker_sliders_from_color;
                    }
                } else {
                    if (length answer() == 6) {
                        set_setting_from_id "popup.color_picker.color", 0+("0x"&answer());
                        set_color_picker_sliders_from_color;
                    }
                }
            }
        }


    } else {
        # close popup and continue checking for other UI elements
        if (UI_popup[1]) { require_viewport_refresh = true; } # is showing
        delete UI_popup;
    }


    if (UI_last_hovered_group == "side bar" or UI_last_hovered_group == "popup") {
        if (UI_data[clicked_element] == "BUTTON") {
            # check for button behvaviour type
            if (UI_data[clicked_element+3] == "set_page") {
                UI_current_panel = UI_data[clicked_element+4];

            } elif (UI_data[clicked_element+3] == "broadcast") {
                broadcast UI_data[clicked_element+4];

            } elif (UI_data[clicked_element+3] == "command") {
                cmd_string = UI_data[clicked_element+4];
                broadcast "sys.run_command";
            }
            
        } elif (UI_data[clicked_element] == "CHECKBOX") {
            UI_data[clicked_element+3] = 1 - UI_data[clicked_element+3];

        } elif (UI_data[clicked_element] == "VALUE") {
            start_value = UI_data[clicked_element+3];

            get_unfenced_mouse;
            start_mouse_x = unfenced_mouse_x;
            mouse_moved = false;
            until not mouse_down() {
                get_unfenced_mouse;
                if (unfenced_mouse_x != start_mouse_x) { mouse_moved = true; }

                if mouse_moved { # only edit the slider if the mouse moved

                    delta_per_px = (1/UI_data[clicked_element+9])/20; # start with increment at 20px
                    if (delta_per_px > 10000000) { delta_per_px = 10000000; } # effectively accepts any floating point number
                    
                    if (UI_data[clicked_element+10] == "full") {
                        max_travel = 200; # full sliders should have travel closer to their width
                    } else {
                        max_travel = 500;
                    }
                    
                    # scale down if the total travel is larger than maximum
                    slider_total_travel = abs(UI_data[clicked_element+6]-UI_data[clicked_element+5])/delta_per_px;
                    if (slider_total_travel > max_travel) {
                        delta_per_px *= (slider_total_travel/max_travel);
                        slider_total_travel = max_travel;
                    }
                    delta_per_px *= PS_slider_sensitivity/100;
                    if key_pressed("shift") {
                        delta_per_px /= 4;
                    }

                    set_value_element clicked_element, start_value + delta_per_px*(unfenced_mouse_x-start_mouse_x), true;
                }
            }
            if (not mouse_moved) {
                ask "set \"" & UI_data[clicked_element+1] & "\" to number";
                if (answer() != "") {
                    set_value_element clicked_element, answer()+0, false;
                }
            }

        } elif (UI_data[clicked_element] == "COLOR") {
            # open the picker
            create_popup "color picker", round(mouse_x()+10), round(mouse_y()-10), 130, 186;
            add clicked_element to UI_popup; # 7. index
            
            set_setting_from_id "popup.color_picker.color", UI_data[clicked_element+3];
            set_color_picker_sliders_from_color;

            require_viewport_refresh = true; # update previous picker, temporary solution

        } elif (UI_data[clicked_element] == "EXPANDER") {
            UI_data[clicked_element+3] = 1 - UI_data[clicked_element+3];
        }
    
    } elif (UI_last_hovered_group == "tabs") {

        if (clicked_element != "") {
            UI_current_panel = clicked_element;
        }

    } elif (UI_last_hovered_group == "top bar") {
        # top bar
        if (clicked_element == "close side bar") {
            UI_sidebar_width = 0;
            if (viewport_mode == ViewportMode.ORBIT) {
                require_composite = true;
            }
            require_viewport_refresh = true;
        } elif (clicked_element == "open side bar") {
            UI_sidebar_width = 160;
            require_viewport_refresh = true;
        } elif (clicked_element == "viewport 2D") {
            viewport_mode = ViewportMode.ALIGNED;
            requested_render_resolution = 1;
            require_composite = true;
        } elif (clicked_element == "viewport 3D") {
            viewport_mode = ViewportMode.ORBIT;
            requested_render_resolution = PS_render_resolution_default_orbit;
            require_composite = true;
        } elif (clicked_element == "compositor mode") {
            create_popup "compositor mode", stage_min_x+UI_sidebar_width+80, stage_max_y-TOP_BAR_HEIGHT, 100, 116;
        } elif (clicked_element == "zoom in") {
            broadcast "sys.zoom_in";
        } elif (clicked_element == "zoom out") {
            broadcast "sys.zoom_out";
        } elif (clicked_element == "zoom fit") {
            broadcast "sys.zoom_extents";
        }
    }
}

# for the VALUE element
proc set_value_element index, val, use_soft_limits {
    # snap
    if (UI_data[$index+9] == 0) {
        UI_data[$index+3] = $val; # no snapping
    } else {
        UI_data[$index+3] = round(($val)*UI_data[$index+9])/UI_data[$index+9]; # multiply then divide is more robust
    }

    # clamp
    if ($use_soft_limits == 1) {
        if (UI_data[$index+3] < UI_data[$index+5]) {
            UI_data[$index+3] = UI_data[$index+5];
        } elif (UI_data[$index+3] > UI_data[$index+6]) {
            UI_data[$index+3] = UI_data[$index+6];
        }
    }
    # clamp hard limits (must run)
    if (UI_data[$index+3] < UI_data[$index+7]) {
        UI_data[$index+3] = UI_data[$index+7];
    } elif (UI_data[$index+3] > UI_data[$index+8]) {
        UI_data[$index+3] = UI_data[$index+8];
    }
}


%define HOVERED_IS_INPUT_ELEM() ((UI_data[UI_last_hovered_element] == "CHECKBOX") or (UI_data[UI_last_hovered_element] == "VALUE") or (UI_data[UI_last_hovered_element] == "COLOR"))

# reset hovered element
onkey "r" {
    if (not mouse_down() and (UI_last_hovered_group == "side bar" or UI_last_hovered_group == "popup")) {
        if (HOVERED_IS_INPUT_ELEM()) {
            UI_data[UI_last_hovered_element+3] = UI_data[UI_last_hovered_element+4];
        }
    }
}

# copy value
onkey "c" {
    if (not mouse_down() and (UI_last_hovered_group == "side bar" or UI_last_hovered_group == "popup")) {
        if (HOVERED_IS_INPUT_ELEM()) {
            UI_clipboard_source = UI_last_hovered_element;
        } else {
            UI_clipboard_source = 0;
        }
    }
}

# paste value
onkey "v" {
    if (not mouse_down() and (UI_last_hovered_group == "side bar" or UI_last_hovered_group == "popup")) {
        if (UI_data[UI_last_hovered_element] == UI_data[UI_clipboard_source]) {
            if (UI_data[UI_last_hovered_element] == "CHECKBOX") {
                UI_data[UI_last_hovered_element+3] = UI_data[UI_clipboard_source+3];

            } elif (UI_data[UI_last_hovered_element] == "VALUE") {
                set_value_element UI_last_hovered_element, UI_data[UI_clipboard_source+3], false;

            } elif (UI_data[UI_last_hovered_element] == "COLOR") {
                UI_data[UI_last_hovered_element+3] = UI_data[UI_clipboard_source+3];

            }
        }
    }
}



################################
#       Text renderers         #
################################

# For more info see: https://scratch.mit.edu/projects/934459716/

list PTE_font = file ```data/5x7 printable ASCII.txt```;

%define CURR_COST_CHAR_INDEX() (costume_number() + 5)


proc plainText x, y, size, text {
    set_pen_size $size;
    x_offset = $x;
    y_offset = $y;
    txt_i = 1;
    switch_costume "large";
    repeat length $text {
        switch_costume $text[txt_i];
        font_char_index = PTE_font[CURR_COST_CHAR_INDEX()];
        switch_costume "large";
        font_i = 3 + font_char_index;
        repeat PTE_font[5 + font_char_index] {
            font_i += 4;
            goto 
                x_offset + $size * PTE_font[font_i + 1],
                y_offset + $size * PTE_font[font_i + 2];
            pen_down;
            repeat PTE_font[font_i] {
                font_i += 2;
                goto 
                    x_offset + $size * PTE_font[font_i + 1],
                    y_offset + $size * PTE_font[font_i + 2];
            }
            pen_up;
        }
        x_offset += $size * (2 + PTE_font[2 + font_char_index]);
        txt_i += 1;
    }
    switch_costume "icon";
}


proc wrappedText x, y, size, text, wrap_width {
    set_pen_size $size;
    x_offset = $x;
    y_offset = $y;
    txt_i = 1;
    switch_costume "large";
    repeat length $text {
        if ($text[txt_i] == " ") {
            # search for the next space to ensure the word fits in the line
            txt_j = txt_i + 1;
            future_x = (x_offset - $x) + $size * 5; # width of space added
            until $text[txt_j] == " " or txt_j > length($text) or future_x >= $wrap_width {
                txt_j += 1;
                switch_costume $text[txt_j];
                future_x += $size * (2 + PTE_font[2 + PTE_font[CURR_COST_CHAR_INDEX()]]);
            }
            if future_x >= $wrap_width {
                x_offset = $x;
                y_offset -= $size * 10;
                txt_i += 1; # skip the space as it was used to go to the next line
            }
        }

        switch_costume $text[txt_i];
        font_char_index = PTE_font[CURR_COST_CHAR_INDEX()];
        switch_costume "large";
        font_i = 3 + font_char_index;
        repeat PTE_font[5 + font_char_index] {
            font_i += 4;
            goto 
                x_offset + $size * PTE_font[font_i + 1],
                y_offset + $size * PTE_font[font_i + 2];
            pen_down;
            repeat PTE_font[font_i] {
                font_i += 2;
                goto 
                    x_offset + $size * PTE_font[font_i + 1],
                    y_offset + $size * PTE_font[font_i + 2];
            }
            pen_up;
        }
        x_offset += $size * (2 + PTE_font[2 + font_char_index]);
        txt_i += 1;
    }
    switch_costume "icon";
}


################################
#             Draw             #
################################

proc draw_triangle x, y, dir {
    # direction is anticlockwise from right

    switch_costume "triangle";
    goto $x, $y;
    point_in_direction 90-$dir;
    stamp;
    point_in_direction 90;
}


proc draw_UI_rect x, y, width, height, radius, outline_col, fill_col {
    # drawn from top-left, unlike draw_rect

    if ($outline_col != $fill_col) {
        # draw outline
        draw_rect $x, ($y-$height), $width, $height, $radius, $outline_col;
        
        # inner fill
        draw_rect $x+1, ($y-$height)+1, $width-2, $height-2, $radius, $fill_col;
    } else {
        draw_rect $x, ($y-$height), $width, $height, $radius, $fill_col;
    }
}


# "natural" rect. for positive width and height only. Radius is clamped to 1.
proc draw_rect x, y, width, height, radius, fill_col {
    
    # find the narrowest axis
    if ($width > $height) {
        local rect_limit = ($height/2);
    } else {
        local rect_limit = ($width/2);
    }
    if ($radius > 1) {
        local radius = $radius;
    } else {
        local radius = 1;
    }
    
    if (rect_limit < 0) { stop_this_script; }

    set_pen_color $fill_col;
    until (radius > rect_limit) {
        set_pen_size (radius * 2);
        goto ($x+radius), ($y+radius);
        pen_down;
        set_x (($x+$width) - radius);
        set_y (($y+$height) - radius);
        set_x ($x+radius);
        set_y ($y+radius);
        pen_up;
        
        if (radius < 1) {
            radius = 1; # prevent infinite loop when radius is 0, ensure that it gets properly filled
        } else {
            radius *= 6; # approximate number to ensure enough overlap
        }
    }
    
    # final inner fill
    if (rect_limit < 1) {
        # special handling for single pixel thick
        set_pen_size 1;
        goto $x, $y;
        pen_down;
        goto $x+($width-1)*($width>1), $y+($height-1)*($height>1);
        pen_up;

    } elif (radius < $radius or radius/rect_limit)%6 <= 3 {
        set_pen_size (rect_limit * 2) - 0.01; # subtract for hq pen fix
        goto ($x+rect_limit), ($y+rect_limit);
        pen_down;
        goto (($x+$width)-rect_limit), (($y+$height)-rect_limit);
        pen_up;
    }
}


# Draw a rectangle from corner point, width and height
proc draw_rectangle_corner_wh x, y, width, height {
    goto $x, $y;
    pen_down;
    goto $x+$width, $y;
    goto $x+$width, $y+$height;
    goto $x, $y+$height;
    goto $x, $y;
    pen_up;
}


################################
#            Utils             #
################################


func rotate_world_space_to_cam_space(x, y, z) XYZ {
    # rotate point around Z
    local XYZ r1 = XYZ {x:$x*cos(-cam_azi)-$y*sin(-cam_azi), y:$x*sin(-cam_azi)+$y*cos(-cam_azi), z:$z};
    # rotate point around X
    return XYZ {x:r1.x, y:r1.y*cos(-cam_elev)-r1.z*sin(-cam_elev), z:r1.y*sin(-cam_elev)+r1.z*cos(-cam_elev)};
}

func rotate_vector_intrinsic_zx(x, y, z, angle_x, angle_z) XYZ {
    # rotate point around X
    local XYZ r1 = XYZ {x:$x, y:$y*cos($angle_x)-$z*sin($angle_x), z:$y*sin($angle_x)+$z*cos($angle_x)};
    # rotate point around Z
    return XYZ {x:r1.x*cos($angle_z)-r1.y*sin($angle_z), y:r1.x*sin($angle_z)+r1.y*cos($angle_z), z:r1.z};
}

proc calculate_sun_vector {
    # the direction the sun rotates is probably unconventional, I don't know much about this subject.
    XYZ sun_direction = rotate_vector_intrinsic_zx(0, 1, 0, PS_sun_elevation, -PS_sun_bearing);
}


proc get_unfenced_mouse {
    if abs(mouse_x()) < stage_max_x {
        unfenced_mouse_x = mouse_x(); # trust the mouse x block in the stage

    } else {
        step_size = 235;
        unfenced_mouse_x = 0;
        switch_costume "blank";
        set_size 400;
        switch_costume "mouse detect";
        goto 0, mouse_y();
        point_in_direction 90+(mouse_x()<0)*180;
        #point_towards_mouse_pointer;
        repeat 40 {
            if (touching_mouse_pointer()) {
                # mouse found, go back and try again with smaller step
                switch_costume "blank";
                set_size "Infinity";
                move -step_size;
                step_size *= 0.5;

                if step_size < 0.5 {
                    unfenced_mouse_x = round(x_position());
                    switch_costume "large";
                    set_size 100;
                    goto 0, 0;
                    point_in_direction 90;
                    stop_this_script;
                }
                switch_costume "large";
                set_size 100;
                
            } else {
                # no mouse, go forwards
                switch_costume "blank";
                set_size "Infinity";
                move step_size;
            }
            set_size 400;
            switch_costume "mouse detect";
            
        }
        #warn "mouse position was not found";
        unfenced_mouse_x = mouse_x();
        switch_costume "large";
        set_size 100;
        goto 0, 0;
        point_in_direction 90;
    }
}




