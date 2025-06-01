# Sample the stage size.
# From testing TurboWarp, it is best to round the stage size up. We never want to see anything beyond the known boundary so thinking the boundary is larger than it is will ensure this. The "max" variables should be positive integers and the entire size should be even numbers.

costumes "costumes/stage_size/icon.svg" as "icon", "costumes/stage_size/probe.png" as "probe";
hide;

on "get_stage_size" { get_stage_size; }
proc get_stage_size {
    switch_costume "probe";
    set_size 100;
    show;

    # find max x
    goto 0, 0;
    step_size = 256;
    stage_max_x = 0;
    until (step_size < 1 or stage_max_x > 65536) {
        set_x stage_max_x;
        if touching_edge() {
            stage_max_x -= step_size;
            step_size /= 2;
        } else {
            stage_max_x += step_size;
        }
    }
    stage_max_x = ceil(stage_max_x);
    if (stage_max_x < 0) { stage_max_x = 0; }
    stage_size_x = stage_max_x * 2;
    stage_min_x = stage_max_x - stage_size_x;

    # find max y
    goto 0, 0;
    step_size = 256;
    stage_max_y = 0;
    until (step_size < 1 or stage_max_y > 65536) {
        set_y stage_max_y;
        if touching_edge() {
            stage_max_y -= step_size;
            step_size /= 2;
        } else {
            stage_max_y += step_size;
        }
    }
    stage_max_y = ceil(stage_max_y);
    if (stage_max_y < 0) { stage_max_y = 0; }
    stage_size_y = stage_max_y * 2;
    stage_min_y = stage_max_y - stage_size_y;

    # done
    goto 0, 0;
    hide;
    switch_costume "icon";
}
    