%include common/common.gs

# For more info see: https://scratch.mit.edu/projects/934459716/

costumes 
"costumes/PTE/icon.svg" as "icon", 
"costumes/large.svg" as "large",
"costumes/blank.svg" as "",
"costumes/blank.svg" as "@ascii/";
hide;

list PTE_font = file ```5x7 printable ASCII.txt```;

%define current_costume_char_index costume_number() + 5

onflag {
    hide;
    erase_all;
    set_pen_color "black";
    plainText -200, 135, 2, "Hello, world!";
    plainText -200, 110, 1, "This is a preview of the PTE.";
    plainText -200, 90, 1, "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    plainText -200, 80, 1, "abcdefghijklmnopqrstuvwxyz";
    plainText -200, 70, 1, "0123456789";

    wrappedText -200, 0, 1, "The font called \"5x7 printable ASCII\" supports all the printable ASCII characters with glyph dimensions of 5x7px. It's optimised to be visually as small as possible while still being legible. The code is also very simple, designed to be easily backpackable.", 100;
}

proc plainText x, y, size, text {
    set_pen_size $size;
    x_offset = $x;
    y_offset = $y;
    txt_i = 1;
    switch_costume "large";
    repeat length $text {
        switch_costume $text[txt_i];
        font_char_index = PTE_font[current_costume_char_index];
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
                future_x += $size * (2 + PTE_font[2 + PTE_font[current_costume_char_index]]);
            }
            if future_x >= $wrap_width {
                x_offset = $x;
                y_offset -= $size * 10;
                txt_i += 1; # skip the space as it was used to go to the next line
            }
        }

        switch_costume $text[txt_i];
        font_char_index = PTE_font[current_costume_char_index];
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


proc draw_UI_rect x, y, width, height, radius, fill_col, outline_col {
    # not tested on all cases, only set up for this use case!
    # drawn from top-left
    if ($radius == "") {
        local radius = 4;
    } else {
        local radius = $radius;
    }
    if (($width > (radius*2)) and ($height > (radius*2))) {
        if ($width > $height) {
            local rect_lim = (($height/2)-1);
        } else {
            local rect_lim = (($width/2)-1);
        }

        # OUTLINE #
        if ($outline_col == "") {
            set_pen_color "#212121";
        } else {
            set_pen_color $outline_col;
        }

        set_pen_size (radius * 2);
        goto ($x+radius), ($y-radius);
        pen_down;
        set_x (($x+$width) - radius);
        set_y (($y-$height) + radius);
        set_x ($x+radius);
        set_y ($y-radius);
        pen_up;
        
        # FILL #
        if ($fill_col == "") {
            set_pen_color "#484848";
        } else {
            set_pen_color $fill_col;
        }
        until (radius > rect_lim) {
            set_pen_size radius * 2;
            goto (($x+radius)+1), (($y-radius)-1);
            pen_down;
            set_x ((($x+$width) - radius)-1);
            set_y ((($y-$height) + radius)+1);
            set_x (($x+radius)+1);
            set_y (($y-radius)-1);
            pen_up;
            radius *= 6; # not sure why 6
        }
        set_pen_size (rect_lim * 2);
        goto (($x+rect_lim)+1), (($y-rect_lim)-1);
        pen_down;
        goto ((($x+$width)-rect_lim)-1), ((($y-$height)+rect_lim)+1);
        pen_up;
    }
}




on "render ui" {
    # constantly renders, this is because the ui needs to be interactive.

    render_viewport_text;
    render_gen_opt_panel -240, 160, 160, 340;
    switch_costume "icon";
}

proc render_viewport_text {
    # TODO
    set_pen_color "#ffffff";
    plainText -230, 160, 1, ("canvas size: " & ((((canvas_size_x & ", ") & canvas_size_y) & ", ") & canvas_size_z));
    plainText -230, 150, 1, ("timer: " & floor(( 100 *((86400 * days_since_2000()) % 1))));
    plainText -230, 140, 1, compositor_mode;
}

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


proc render_gen_opt_panel x, y, width, height {
    UI_x = $x+5;
    UI_y = $y-5;
    draw_UI_rect $x, $y, $width, $height, 1, THEME_COL_BG, ""; # TODO
    render_element 1, UI_x, UI_y, $width-20;
}

proc render_element index, x, y, width {
    # index is the index in the list
    
    if key_pressed("z") {
        draw_UI_rect $x, $y, $width, LINEHIGHT, 1, "#00a050", "#00ffff"; # debug
    }

    local elem_type = gen_opt[$index];
    if (elem_type[1] == "#") {
        # spacing or comment, skip
        render_element $index+1, $x, UI_y, $width;

    } elif (elem_type == "LABEL") {
        # [type, text]
        set_pen_color THEME_COL_TEXT;
        plainText $x, $y-TXT_Y_OFFSET, 1, gen_opt[$index+1];
        UI_y -= LINEHIGHT;
        render_element $index+2, $x, UI_y, $width;

    } elif (elem_type == "BUTTON") {
        # [type, label, id, button_clicked]
        UI_check_touching_mouse $x, $y+1, $width, LINEHIGHT, "modular elements", gen_opt[$index+2];
        if (UI_last_hovered_element == gen_opt[$index+2]) {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT, "", "#656565", THEME_COL_OUTLINE_HIGHLIGHT;
        } else {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT, "", "#555555", THEME_COL_OUTLINE;
        }
        
        set_pen_color THEME_COL_TEXT;
        plainText $x+8, ($y-TXT_Y_OFFSET)+1, 1, gen_opt[$index+1];
        UI_y -= (LINEHIGHT+2);
        render_element $index+4, $x, UI_y, $width;

    } elif (elem_type == "CHECKBOX") {
        # [type, label, id, checked]
        set_pen_color THEME_COL_TEXT;
        plainText $x, ($y-TXT_Y_OFFSET), 1, gen_opt[$index+1];
        
        UI_check_touching_mouse (($x+$width)-LINEHIGHT), $y, LINEHIGHT, LINEHIGHT, "modular elements", gen_opt[$index+2];

        if (UI_last_hovered_element == gen_opt[$index+2]) {
            draw_UI_rect (($x+$width)-12), ($y-2), 12, 12, 2, THEME_COL_FILL_HIGHLIGHT, THEME_COL_OUTLINE_HIGHLIGHT;
        } else {
            draw_UI_rect (($x+$width)-12), ($y-2), 12, 12, 2, THEME_COL_FILL, THEME_COL_OUTLINE;
        }
        if (gen_opt[$index+3] == 1) { # checked is true
            set_pen_color THEME_COL_TEXT;
            set_pen_size 6;
            goto (($x+$width)-6), ($y-8);
            pen_down;
            pen_up;
        }
        UI_y -= LINEHIGHT;
        render_element $index+4, $x, UI_y, $width;

    } elif (elem_type == "COLOR") {
        # [type, label, id, color]
        set_pen_color THEME_COL_TEXT;
        plainText $x, ($y-TXT_Y_OFFSET), 1, gen_opt[$index+1];
        
        UI_check_touching_mouse (($x+$width)-32), $y, 32, LINEHIGHT, "modular elements", gen_opt[$index+2];

        if (UI_last_hovered_element == gen_opt[$index+2]) {
            draw_UI_rect (($x+$width)-32), ($y-1), 32, LINEHIGHT-2, 4, gen_opt[$index+3], THEME_COL_OUTLINE_HIGHLIGHT;
        } else {
            draw_UI_rect (($x+$width)-32), ($y-1), 32, LINEHIGHT-2, 4, gen_opt[$index+3], THEME_COL_OUTLINE;
        }
        UI_y -= LINEHIGHT;
        render_element $index+4, $x, UI_y, $width;

    } elif (elem_type == "VALUE") {
        # [type, label, id, val, soft_min, soft_max, hard_min, hard_max]

        UI_check_touching_mouse (($x+$width)-INPUT_WIDTH), $y, INPUT_WIDTH, LINEHIGHT, "modular elements", gen_opt[$index+2];

        if (UI_last_hovered_element == gen_opt[$index+2]) {
            draw_UI_rect (($x+$width)-INPUT_WIDTH), ($y-1), INPUT_WIDTH, LINEHIGHT-2, 2, THEME_COL_FILL_HIGHLIGHT, THEME_COL_OUTLINE_HIGHLIGHT;
        } else {
            draw_UI_rect (($x+$width)-INPUT_WIDTH), ($y-1), INPUT_WIDTH, LINEHIGHT-2, 2, THEME_COL_FILL, THEME_COL_OUTLINE;
        }
        
        set_pen_color THEME_COL_TEXT;
        plainText $x, ($y-TXT_Y_OFFSET), 1, gen_opt[$index+1];
        plainText (($x+$width)-INPUT_WIDTH)+3, ($y-TXT_Y_OFFSET), 1, gen_opt[$index+3];
        
        UI_y -= LINEHIGHT;
        render_element $index+8, $x, UI_y, $width;
    
    } elif (elem_type == "SEPARATOR") {
        # [type, line_width_fac, height]
        set_pen_color THEME_COL_FILL;
        set_pen_size 1;
        goto $x, $y-gen_opt[$index+2]//2;
        pen_down;
        change_x $width*gen_opt[$index+1];
        pen_up;
        
        UI_y -= gen_opt[$index+2];
        render_element $index+3, $x, UI_y, $width;

    } elif (elem_type == "EXPANDER") {
        # [type, label, id, opened, height, size_of_self (number of items)]
        # todo add label_colour?

        draw_UI_rect $x, $y-1, $width, gen_opt[$index+4], 3, THEME_COL_BG, THEME_COL_OUTLINE;

        UI_check_touching_mouse $x, $y-1, $width, LINEHIGHT-2, "modular elements", gen_opt[$index+2];
        if (UI_last_hovered_element == gen_opt[$index+2]) {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT-2, 3, "#444444", THEME_COL_OUTLINE_HIGHLIGHT;
        } else {
            draw_UI_rect $x, $y-1, $width, LINEHIGHT-2, 3, THEME_COL_FILL, THEME_COL_OUTLINE;
        }
        # maybe draw a separator?

        set_pen_color THEME_COL_TEXT;
        draw_triangle ($x+$width)-10, ($y-9), 0;
        plainText $x+5, ($y-TXT_Y_OFFSET), 1, gen_opt[$index+1]; # label
        
        UI_y -= LINEHIGHT;
        render_element $index+6, $x+5, UI_y, $width-10; # first child

        UI_y -= 2; # line (from bottom of rect) then margin
        render_element $index+gen_opt[$index+5], $x, UI_y, $width; # next

    }
}


on "stage clicked" {
    if (UI_hovered_group == "modular elements") {

    }
}



################################
#             Draw             #
################################


proc draw_triangle x, y, dir {
    # TODO, add direction
    goto $x, ($y+1);
    set_pen_size 3;
    pen_down;
    pen_up;
    set_pen_size 1;
    goto ($x-3), ($y+2);
    pen_down;
    goto ($x+3), ($y+2);
    goto ($x+0), ($y-2);
    goto ($x-3), ($y+2);
    pen_up;
}


################################
#            Utils             #
################################

proc UI_check_touching_mouse x, y, width, height, id1, id2 {
    if (not (((mouse_x() < $x) or (mouse_x() > ($x+$width))) or ((mouse_y() > $y) or (mouse_y() < ($y-$height))))) {
        UI_hovered_group = $id1;
        UI_hovered_element = $id2;
    }
}

