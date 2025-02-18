%include common/common.gs
costumes "costumes/blank.svg" as "blank";


on "initalise" {
    hide;
}


on "generate debug pattern" {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 8;

    delete canvas_1_r;
    delete canvas_2_g;
    delete canvas_3_b;
    delete canvas_4_a;

    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add 0.311 to canvas_1_r;
        add 0.611 to canvas_2_g;
        add 0.711 to canvas_3_b;
        add 0 to canvas_4_a;
    }

    i = 0;
    repeat 8 {
        set_voxel i, 0, i, 0, 1, 0, 1;
        set_voxel i, 1, i, 1, 0, 0, 1;
        i++;
    }


    broadcast "composite";
}



proc set_voxel x, y, z, r, g, b, a {
    local set_px_i = (1+(((canvas_size_x*canvas_size_y) * $z)+((canvas_size_x*(floor($y) % canvas_size_y))+(floor($x) % canvas_size_x))));

    canvas_1_r[set_px_i] = ($r+($r == ""));
    canvas_2_g[set_px_i] = ($g+($g == ""));
    canvas_3_b[set_px_i] = ($b+($b == ""));
    canvas_4_a[set_px_i] = ($a+($a == ""));
}