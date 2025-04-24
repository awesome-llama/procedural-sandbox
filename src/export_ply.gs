%include common/common.gs

costumes "costumes/blank.svg" as "blank";
hide;


# round a double float channel to something shorter
%define RC(NUM) (round((NUM)*10000)/10000)


on "io.export_ply.run" { export_ply; }
proc export_ply {
    delete copy_this;
    add "ply" to copy_this;
    add "format ascii 1.0" to copy_this;
    add "comment created by awesome-llama's Procedural Sandbox" to copy_this;
    add "element vertex 0" to copy_this; # number of elements
    add "property float x" to copy_this;
    add "property float y" to copy_this;
    add "property float z" to copy_this;
    add "property float opacity" to copy_this;
    add "property float red" to copy_this;
    add "property float green" to copy_this;
    add "property float blue" to copy_this;
    add "property float emission" to copy_this;
    add "end_header" to copy_this;

    local vertex_count = 0;
    local i = 1;
    local iz = 0;
    repeat canvas_size_z {
        local iy = 0;
        repeat canvas_size_y {
            local ix = 0;
            repeat canvas_size_x {
                if (canvas[i].opacity > 0) {
                    add ix &" "& iy &" "& iz &" "& RC(canvas[i].opacity) &" "& RC(canvas[i].r) &" "& RC(canvas[i].g) &" "& RC(canvas[i].b) &" "& RC(canvas[i].emission) to copy_this;
                    vertex_count++;
                }
                i++;
                ix++;
            }
            iy++;
        }
        iz++;
    }

    copy_this[4] = "element vertex " & vertex_count;

    show copy_this;
}


