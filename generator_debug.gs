%include common/common.gs

costumes "costumes/blank.svg" as "blank";
hide;

on "initalise" {
    hide;
}


on "generate debug pattern" {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 8;

    delete canvas;

    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add voxel {opacity:0, r:0.311, g:0.611, b:0.711, emission:0} to canvas;
    }

    i = 0;
    repeat 8 {
        set_voxel i, 0, i, 0, 1, 0, 1;
        set_voxel i, 1, i, 1, 0, 0, 1;
        i++;
    }


    require_composite = true;
}



proc set_voxel x, y, z, r, g, b, a {
    local set_px_i = (1+(((canvas_size_x*canvas_size_y) * $z)+((canvas_size_x*(floor($y) % canvas_size_y))+(floor($x) % canvas_size_x))));

    canvas[set_px_i].r = ($r+($r == ""));
    canvas[set_px_i].g = ($g+($g == ""));
    canvas[set_px_i].b = ($b+($b == ""));
    canvas[set_px_i].opacity = ($a+($a == ""));
}