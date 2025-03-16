%include common/common.gs

# For more info see: https://scratch.mit.edu/projects/934459716/

costumes 
"costumes/PTE/icon.svg" as "icon", 
"costumes/large.svg" as "large",
"costumes/blank.svg" as "",
"costumes/blank.svg" as "@ascii/";
hide;


%if false
onflag {
    hide;
    erase_all;
    set_pen_color "#ff0000";
    plainText -200, 135, 2, "Hello, world!";
    plainText -200, 110, 1, "This is a preview of the PTE.";
    plainText -200, 90, 1, "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    plainText -200, 80, 1, "abcdefghijklmnopqrstuvwxyz";
    plainText -200, 70, 1, "0123456789";

    wrappedText -200, 0, 1, "The font called \"5x7 printable ASCII\" supports all the printable ASCII characters with glyph dimensions of 5x7px. It's optimised to be visually as small as possible while still being legible. The code is also very simple, designed to be easily backpackable.", 100;
}
%endif

# background panel colour
%define THEME_COL_BG "#404040"

# the darker fill colour inside elements
%define THEME_COL_FILL "#333333"

# the darker fill colour inside elements, highlighted
%define THEME_COL_FILL_HIGHLIGHT "#404040"

# border of elements (not containers)
%define THEME_COL_OUTLINE "#707070"

# outline when hovered
%define THEME_COL_OUTLINE_HIGHLIGHT "#aaaaaa"

# all text colour
%define THEME_COL_TEXT "#ffffff"


%define LINEHIGHT 16
%define TXT_Y_OFFSET 12
%define INPUT_WIDTH 50

%define IS_HOVERED UI_last_hovered_group == "modular elements" and UI_last_hovered_element == $index

%define MODULAR_PANEL_WIDTH 160

on "render ui" {
    # constantly renders, this is because the ui needs to be interactive.
    draw_rect -240+MODULAR_PANEL_WIDTH, 160, 480-MODULAR_PANEL_WIDTH, 20, 1, "#505050"; # top bar
    
    draw_rect -240, -180, MODULAR_PANEL_WIDTH, 360, 0, THEME_COL_BG; # left panel
    render_gen_opt_panel -236, 160, MODULAR_PANEL_WIDTH-8, 360-20; # scroll bar might be needed
    
    set_pen_color "#ffffff";
    plainText -150, 160, 1, compositor_mode;
    
    switch_costume "icon";
}

proc render_gen_opt_panel x, y, width, height {
    local curr_index = (UI_current_panel in UI_data_panels);
    if curr_index > 0 {
        render_element UI_data_panels[curr_index + 1], $x, $y, $width;
    }
}


on "render canvas text" { render_viewport_text; }
proc render_viewport_text {
    set_pen_color "#ffffff";
    plainText -75, 150, 1, ("canvas size: " & ((((canvas_size_x & ", ") & canvas_size_y) & ", ") & canvas_size_z));
    plainText -75, 140, 1, ("timer: " & floor(( 100 *((86400 * days_since_2000()) % 1))));
    
}


proc render_element index, x, y, width {
    # index is to select what part of the list to read from

    UI_y = $y; # used as a return var for container next, required
    local elem_type = UI_data[$index];
    if (elem_type[1] == "#") {
        # spacing or comment, skip
        render_element $index+1, $x, UI_y, $width;

    } elif (elem_type == "LABEL") {
        # [type, text]
        set_pen_color THEME_COL_TEXT;
        plainText $x, $y-TXT_Y_OFFSET, 1, UI_data[$index+1];
        UI_y -= LINEHIGHT;
        render_element $index+2, $x, UI_y, $width;

    } elif (elem_type == "SEPARATOR") {
        # [type, line_width_fac, height]
        if ($width > 0) {
            set_pen_color THEME_COL_FILL;
            set_pen_size 1;
            goto $x, $y-ceil(UI_data[$index+2]/2);
            pen_down;
            change_x $width*UI_data[$index+1];
            pen_up;
        }
        UI_y -= UI_data[$index+2];
        render_element $index+3, $x, UI_y, $width;

    } elif (elem_type == "BUTTON") {
        # [type, label, id, button_clicked]
        UI_check_touching_mouse $x, $y+1, $width, LINEHIGHT, "modular elements", $index;

        if (IS_HOVERED) {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT, 4, THEME_COL_OUTLINE_HIGHLIGHT, "#656565";
        } else {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT, 4, THEME_COL_OUTLINE, "#555555";
        }
        
        set_pen_color THEME_COL_TEXT;
        plainText $x+8, $y-TXT_Y_OFFSET, 1, UI_data[$index+1];
        UI_y -= (LINEHIGHT+2);
        render_element $index+4, $x, UI_y, $width;

    } elif (elem_type == "CHECKBOX") {
        # [type, label, id, checked]
        set_pen_color THEME_COL_TEXT;
        plainText $x, $y-TXT_Y_OFFSET, 1, UI_data[$index+1];
        
        UI_check_touching_mouse (($x+$width)-LINEHIGHT), $y, LINEHIGHT, LINEHIGHT, "modular elements", $index;

        if (IS_HOVERED) {
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
        render_element $index+4, $x, UI_y, $width;

    } elif (elem_type == "VALUE") {
        # [type, label, id, val, soft_min, soft_max, hard_min, hard_max, step]

        UI_check_touching_mouse (($x+$width)-INPUT_WIDTH), $y, INPUT_WIDTH, LINEHIGHT, "modular elements", $index;
        if (IS_HOVERED) {
            draw_UI_rect (($x+$width)-INPUT_WIDTH), ($y-1), INPUT_WIDTH, LINEHIGHT-2, 2, THEME_COL_OUTLINE_HIGHLIGHT, THEME_COL_FILL_HIGHLIGHT;
        } else {
            draw_UI_rect (($x+$width)-INPUT_WIDTH), ($y-1), INPUT_WIDTH, LINEHIGHT-2, 2, THEME_COL_OUTLINE, THEME_COL_FILL;
        }
        
        set_pen_color THEME_COL_TEXT;
        plainText $x, $y-TXT_Y_OFFSET, 1, UI_data[$index+1];
        plainText (($x+$width)-INPUT_WIDTH)+3, $y-TXT_Y_OFFSET, 1, UI_data[$index+3];
        
        UI_y -= LINEHIGHT;
        render_element $index+9, $x, UI_y, $width;

        if (IS_HOVERED) {
            set_pen_color THEME_COL_OUTLINE_HIGHLIGHT;
            draw_triangle $x+$width+1, $y-8, 0;
            draw_triangle $x+$width-INPUT_WIDTH-2, $y-8, 180;
        }
    
    } elif (elem_type == "COLOR") {
        # [type, label, id, color]
        set_pen_color THEME_COL_TEXT;
        plainText $x, $y-TXT_Y_OFFSET, 1, UI_data[$index+1];
        
        UI_check_touching_mouse (($x+$width)-32), $y, 32, LINEHIGHT, "modular elements", $index;

        if (IS_HOVERED) {
            draw_UI_rect (($x+$width)-32), ($y-1), 32, LINEHIGHT-2, 4, THEME_COL_OUTLINE_HIGHLIGHT, UI_data[$index+3];
        } else {
            draw_UI_rect (($x+$width)-32), ($y-1), 32, LINEHIGHT-2, 4, THEME_COL_OUTLINE, UI_data[$index+3];
        }
        UI_y -= LINEHIGHT;
        render_element $index+4, $x, UI_y, $width;

    } elif (elem_type == "EXPANDER") {
        # [type, label, id, opened, height, size_of_self (number of items)]

        if (UI_data[$index+3] == 1) { # open
            UI_y -= (LINEHIGHT+2);
            render_element $index+5, $x+5, UI_y, $width-10; # first child
            
            UI_y -= 3; # line (from bottom of rect) then margin

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

        UI_check_touching_mouse $x, $y-1, $width, LINEHIGHT, "modular elements", $index;
        if (IS_HOVERED) {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT, 3, THEME_COL_OUTLINE_HIGHLIGHT, "#444444";
        } else {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT, 3, THEME_COL_OUTLINE, THEME_COL_FILL;
        }

        set_pen_color THEME_COL_TEXT;
        plainText $x+16, $y-TXT_Y_OFFSET, 1, UI_data[$index+1]; # label

        if (UI_data[$index+3] == 1) { # open
            draw_triangle $x+7, ($y-9), -90;
        } else {
            draw_triangle $x+7, ($y-9), 0;
        }

        render_element $index+UI_data[$index+4], $x, UI_y, $width; # next
    }
}

proc UI_check_touching_mouse x, y, width, height, id1, id2 {
    
    if (not (((mouse_x() < $x) or (mouse_x() > ($x+$width))) or ((mouse_y() > $y) or (mouse_y() < ($y-$height))))) {
        UI_hovered_group = $id1;
        UI_hovered_element = $id2;
    }
}




on "stage clicked" {
    stop_other_scripts; # stop previous ask block
    if (UI_hovered_group == "modular elements") {
        clicked_element = UI_last_hovered_element;
        if (UI_data[clicked_element] == "BUTTON") {
            log clicked_element;

        } elif (UI_data[clicked_element] == "CHECKBOX") {
            UI_data[clicked_element+3] = 1 - UI_data[clicked_element+3];

        } elif (UI_data[clicked_element] == "VALUE") {
            start_value = UI_data[clicked_element+3];
            start_mouse_x = mouse_x();
            mouse_moved = false;
            until not mouse_down() {
                if key_pressed("shift") {
                    set_value_element clicked_element, start_value + abs(UI_data[clicked_element+5]-UI_data[clicked_element+4])*(mouse_x()-start_mouse_x)/1000, 1;
                } else {
                    set_value_element clicked_element, start_value + abs(UI_data[clicked_element+5]-UI_data[clicked_element+4])*(mouse_x()-start_mouse_x)/200, 1;
                }
                if (mouse_x() != start_mouse_x) {
                    mouse_moved = true;
                }
            }
            if not mouse_moved {
                ask "set \"" & UI_data[clicked_element+1] & "\" to number";
                if (answer() != "") {
                    set_value_element clicked_element, answer()+0, 0;
                }
            }

        } elif (UI_data[clicked_element] == "COLOR") {
            UI_data[clicked_element+3] = "0xff0000" + 0; # not typically possible in scratch

        } elif (UI_data[clicked_element] == "EXPANDER") {
            UI_data[clicked_element+3] = 1 - UI_data[clicked_element+3];
        }
    }
}

proc set_value_element index, val, use_soft_limits {
    # snap
    if UI_data[$index+8] == 0 {
        UI_data[$index+3] = $val; # no snapping
    } else {
        UI_data[$index+3] = round(($val)*UI_data[$index+8])/UI_data[$index+8]; # multiply then divide is more robust
    }

    # clamp
    if ($use_soft_limits == 1) {
        if (UI_data[$index+3] < UI_data[$index+4]) {
            UI_data[$index+3] = UI_data[$index+4];
        } elif (UI_data[$index+3] > UI_data[$index+5]) {
            UI_data[$index+3] = UI_data[$index+5];
        }
    }
    # clamp hard limits (must run)
    if (UI_data[$index+3] < UI_data[$index+6]) {
        UI_data[$index+3] = UI_data[$index+6];
    } elif (UI_data[$index+3] > UI_data[$index+7]) {
        UI_data[$index+3] = UI_data[$index+7];
    }
}



################################
#       Text renderers         #
################################

list PTE_font = file ```5x7 printable ASCII.txt```;

%define CURR_COST_CHAR_INDEX costume_number() + 5


proc plainText x, y, size, text {
    set_pen_size $size;
    x_offset = $x;
    y_offset = $y;
    txt_i = 1;
    switch_costume "large";
    repeat length $text {
        switch_costume $text[txt_i];
        font_char_index = PTE_font[CURR_COST_CHAR_INDEX];
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
        if $text[txt_i] == " " {
            # search for the next space to ensure the word fits in the line
            txt_j = txt_i + 1;
            future_x = (x_offset - $x) + $size * 5; # width of space added
            until $text[txt_j] == " " or txt_j > length($text) or future_x >= $wrap_width {
                txt_j += 1;
                switch_costume $text[txt_j];
                future_x += $size * (2 + PTE_font[2 + PTE_font[CURR_COST_CHAR_INDEX]]);
            }
            if future_x >= $wrap_width {
                x_offset = $x;
                y_offset -= $size * 10;
                txt_i += 1; # skip the space as it was used to go to the next line
            }
        }

        switch_costume $text[txt_i];
        font_char_index = PTE_font[CURR_COST_CHAR_INDEX];
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

%define GOTO(DIST, DIR) goto $x+((DIST)*cos($dir+(DIR))), $y+((DIST)*sin($dir+(DIR)));

proc draw_triangle x, y, dir {
    # direction is anticlockwise from right

    GOTO(-1, 0)
    set_pen_size 3;
    pen_down;
    pen_up;

    set_pen_size 1;
    GOTO(3.7, 123)
    pen_down;
    GOTO(3.7, -123)
    GOTO(2, 0)
    GOTO(3.7, 123)
    pen_up;
}


proc draw_UI_rect x, y, width, height, radius, outline_col, fill_col {
    # not tested on all cases, only set up for this use case!
    # drawn from top-left
    if $outline_col != $fill_col {
        # draw outline
        draw_rect $x, ($y-$height), $width, $height, $radius, $outline_col;
        
        # inner fill
        draw_rect $x+1, ($y-$height)+1, $width-2, $height-2, $radius, $fill_col;
    } else {
        draw_rect $x, ($y-$height), $width, $height, $radius, $fill_col;
    }
}


# "natural" rect. for positive width and height only
proc draw_rect x, y, width, height, radius, fill_col {
    
    # find the narrowest axis
    if ($width > $height) {
        local rect_limit = ($height/2);
    } else {
        local rect_limit = ($width/2);
    }
    
    local radius = POSITIVE_CLAMP($radius);
    
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
            # prevent infinite loop when radius is 0, ensure that it gets properly filled
            radius = 1; 
        } else {
            radius *= 6; # approximate number to ensure enough overlap
        }
        
    }

    # final fill
    if (radius < $radius or radius/rect_limit)%6 <= 3 {
        set_pen_size (rect_limit * 2) - 0.01; # subtract for hq pen fix
        goto ($x+rect_limit), ($y+rect_limit);
        pen_down;
        goto (($x+$width)-rect_limit), (($y+$height)-rect_limit);
        pen_up;
    }
}



#onkey "m" {
#    erase_all;
#    draw_rect -100, 100, 15, 40, 0, "#00ff00";
#    draw_rect -100, 0, 50, 25, 1, "#ffff00";
#    draw_rect 0, 0, round(mouse_x()), round(mouse_y()), 10, "#ffff00";
#}
