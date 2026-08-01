# This code is incomplete and is to be included in other sprites.
# It assumes costumes are in this order: "icon", "large", "", "@ascii/".
# The PTE font must be a global list (defined in the stage).


################################
#       Text renderers         #
################################

# For more info see: https://scratch.mit.edu/projects/934459716/


%define CURR_COST_CHAR_INDEX() (costume_number() + 5)


proc plain_text x, y, size, text {
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
        txt_i++;
    }
}



proc wrapped_text x, y, size, text, wrap_width {
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
        txt_i++;
    }
}



proc text_width size, text {
    x_offset = 0;
    txt_i = 1;
    switch_costume "large";
    repeat length $text {
        switch_costume $text[txt_i];
        x_offset += $size * (2 + PTE_font[2 + PTE_font[CURR_COST_CHAR_INDEX()]]);
        switch_costume "large";
        txt_i++;
    }
}
