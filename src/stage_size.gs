# Sample the stage size. See https://scratch.mit.edu/projects/560529322/

costumes "costumes/stage_size/icon.svg" as "icon", "costumes/blank.svg" as "blank";
hide;


on "sys.hard_reset" {
    stage_max_x = 240;
    stage_max_y = 180;
    stage_size_x = stage_max_x * 2;
    stage_size_y = stage_max_y * 2;
    stage_min_x = stage_size_x - stage_max_x;
    stage_min_y = stage_size_y - stage_max_y;
}


on "sys.get_stage_size" { get_stage_size; }
proc get_stage_size {
    switch_costume "blank";
    set_size 100;
    goto 10000000, 10000000;
    if_on_edge_bounce;

    stage_max_x = ceil(x_position()); # it's better to think the stage is larger than it is so round up
    stage_max_y = ceil(y_position());

    stage_size_x = stage_max_x * 2;
    stage_size_y = stage_max_y * 2;

    stage_min_x = stage_max_x - stage_size_x;
    stage_min_y = stage_max_y - stage_size_y;

    # done
    goto 0, 0;
    point_in_direction 90;
    switch_costume "icon";
}
    