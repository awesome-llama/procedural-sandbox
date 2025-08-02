# Sprite-based overlay that does not need to be drawn to the pen layer. Used as a background when displaying lists.

%include lib/common

costumes "costumes/large.svg" as "large", "costumes/blank.svg" as "blank";
hide;

on "initalise" {
    # initial deletion of lists happens in the stage to keep them global

    hide;
    goto 0, 0;
    switch_costume "blank";
    # excessively large sprites won't render on some devices, this tries to remain similar to the stage size for most compatability:
    if ((stage_size_x/stage_size_y) > (4/3)) { # find which side will reach the limit first
        set_size 110*(stage_size_x/480); # x is largest
    } else {
        set_size 110*(stage_size_y/360); # y is largest
    }
    switch_costume "large";
    
    
    delete copy_this;
    delete output;
    broadcast "sys.hide_lists";
}

on "sys.hard_reset" {
    delete copy_this;
    delete output;
    broadcast "sys.hide_lists";
}

on "sys.hide_lists" {
    hide output; # hide the list
    hide copy_this; # hide the list to copy from
    showing_lists = false;
    # as this is sprite-based, the viewport does not need to be refreshed
}

on "sys.show_copy_this" {
    show copy_this;
    hide output;
    showing_lists = true;
    render_overlay;
}

on "sys.show_output" {
    show output;
    hide copy_this;
    showing_lists = true;
    render_overlay;
}

on "sys.render_overlay" {
    if showing_lists {
        render_overlay;
    } else {
        hide;
    }
}

proc render_overlay {
    set_ghost_effect 20;
    UI_hovered_group = "overlay";
    UI_hovered_element = "";
    show;
}

onclick {
    broadcast "sys.hide_lists";
}