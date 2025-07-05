%include lib/common

costumes 
"costumes/export_3D/icon.svg" as "icon",
"costumes/blank.svg" as "",
"costumes/blank.svg" as "@ascii/";
hide;

list BASE64_CHARS = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9","+","/"];

list fragments = file ```data_URL/fragments.txt```;

# lines of text
list text_buffer;

# stores numbers 0-255 representing bytes
list byte_buffer;

# round a double float channel to something shorter
%define RC(NUM) (round((NUM)*1000)/1000)

# separate with space
%define SEP &" "&

on "io.export_ply_point_cloud.run" {
    delete UI_return;
    setting_from_id "io.export_ply_point_cloud.include_air";
    setting_from_id "io.export_ply_point_cloud.create_data_url";
    export_ply_point_cloud UI_return[1], UI_return[2];
}
proc export_ply_point_cloud include_air, create_data_url {
    delete text_buffer;
    add "ply" to text_buffer;
    add "format ascii 1.0" to text_buffer;

    add "comment Created with awesome-llama's Procedural Sandbox" to text_buffer;
    add "comment x:" & canvas_size_x & ", y:" & canvas_size_y & ", z:" & canvas_size_z to text_buffer;

    add "element vertex 0" to text_buffer; # number of elements
    add "property float x" to text_buffer;
    add "property float y" to text_buffer;
    add "property float z" to text_buffer;
    add "property float red" to text_buffer;
    add "property float green" to text_buffer;
    add "property float blue" to text_buffer;
    add "property float opacity" to text_buffer;
    add "property float emission" to text_buffer;
    add "end_header" to text_buffer;

    local vertex_count = 0;
    local i = 1;
    local iz = 0;
    repeat canvas_size_z {
        local iy = 0;
        repeat canvas_size_y {
            local ix = 0;
            repeat canvas_size_x {
                if ($include_air or canvas[i].opacity > 0) {
                    add ix SEP iy SEP iz SEP \
                        RC(canvas[i].r) SEP \
                        RC(canvas[i].g) SEP \
                        RC(canvas[i].b) SEP \
                        RC(canvas[i].opacity) SEP \
                        RC(canvas[i].emission) \
                        to text_buffer;
                    vertex_count++;
                }
                i++;
                ix++;
            }
            iy++;
        }
        iz++;
    }

    text_buffer[5] = "element vertex " & vertex_count; # update vertex count

    output_list_or_URL $create_data_url, 1, 2;
}


list verts;
list vertex_ptrs;
list quads;

%define _DX 1
%define _DY vertex_count_x
%define _DZ vertex_count_xy

on "io.export_obj_surface.run" {
    delete UI_return;
    setting_from_id "io.export_obj_surface.right_handed_z_up";
    setting_from_id "io.export_obj_surface.create_data_url";
    export_obj_surface UI_return[1], UI_return[2];
}
proc export_obj_surface right_handed_z_up, create_data_url {
    delete verts;
    delete vertex_ptrs;
    delete quads;

    vertex_count_x = canvas_size_x + 1;
    vertex_count_y = canvas_size_y + 1;
    vertex_count_xy = vertex_count_x * vertex_count_y;

    repeat (vertex_count_xy * (canvas_size_z+1)) {
        add 0 to vertex_ptrs;
    }

    local i = 1; # voxel index
    local vi = 1; # vertex index
    local iz = 0;
    repeat canvas_size_z {
        local iy = 0;
        repeat canvas_size_y {
            local ix = 0;
            repeat canvas_size_x {
                if (canvas[i].opacity > 0) {
                    # check adj 6 voxels for air
                    
                    # -X
                    if (canvas[INDEX_FROM_3D_CANVAS_INTS(ix-1, iy, iz, canvas_size_x, canvas_size_y)].opacity == 0) {
                        _add_quad vi, vi+_DZ, vi+_DZ+_DY, vi+_DY;
                    }
                    # -Y
                    if (canvas[INDEX_FROM_3D_CANVAS_INTS(ix, iy-1, iz, canvas_size_x, canvas_size_y)].opacity == 0) {
                        _add_quad vi, vi+_DX, vi+_DX+_DZ, vi+_DZ;
                    }
                    # -Z
                    if (canvas[INDEX_FROM_3D_CANVAS_INTS(ix, iy, iz-1, canvas_size_x, canvas_size_y)].opacity+0 == 0) { # add 0 to convert empty string
                        _add_quad vi, vi+_DY, vi+_DY+_DX, vi+_DX;
                    }

                    # +X
                    if (canvas[INDEX_FROM_3D_CANVAS_INTS(ix+1, iy, iz, canvas_size_x, canvas_size_y)].opacity == 0) {
                        _add_quad vi+_DX, vi+_DX+_DY, vi+_DX+_DY+_DZ, vi+_DX+_DZ;
                    }
                    # +Y
                    if (canvas[INDEX_FROM_3D_CANVAS_INTS(ix, iy+1, iz, canvas_size_x, canvas_size_y)].opacity == 0) {
                        _add_quad vi+_DY, vi+_DY+_DZ, vi+_DY+_DZ+_DX, vi+_DY+_DX;
                    }
                    # +Z
                    if (canvas[INDEX_FROM_3D_CANVAS_INTS(ix, iy, iz+1, canvas_size_x, canvas_size_y)].opacity+0 == 0) { # add 0 to convert empty string
                        _add_quad vi+_DZ, vi+_DZ+_DX, vi+_DZ+_DX+_DY, vi+_DZ+_DY;
                    }
                }
                i++;
                vi++;
                ix++;
            }
            vi += _DX; # fix alignment x axis
            iy++;
        }
        vi += _DY; # fix alignment y axis
        iz++;
    }

    # create file
    delete text_buffer;
    add "# Created with awesome-llama's Procedural Sandbox" to text_buffer;
    add "# x:" & canvas_size_x & ", y:" & canvas_size_y & ", z:" & canvas_size_z to text_buffer;
    add "o canvas" to text_buffer;

    # resolve vertex indices to coords
    i = 1;
    if ($right_handed_z_up) {
        # right-handed z-up y-fwd (same as project)
        add "# coordinates are right-handed z-up y-fwd" to text_buffer;
        repeat (length verts) {
            add "v " & (verts[i]-1)%vertex_count_x & " " & ((verts[i]-1)//vertex_count_x)%vertex_count_y & " " & (verts[i]-1)//vertex_count_xy to text_buffer;
            i++;
        }
    } else {
        # right-handed y-up -z-fwd (an unwritten obj convention?)
        # just requires rotating 90d around the x axis
        repeat (length verts) {
            add "v " & ((verts[i]-1)%vertex_count_x) & " " & (verts[i]-1)//vertex_count_xy & " " & -(((verts[i]-1)//vertex_count_x)%vertex_count_y) to text_buffer;
            i++;
        }
    }

    # faces
    i = 1;
    repeat (length quads / 4) {
        add "f " & quads[i] & " " & quads[i+1] & " " & quads[i+2] & " " & quads[i+3] to text_buffer;
        i += 4;
    }

    delete verts;
    delete vertex_ptrs;
    delete quads;

    output_list_or_URL $create_data_url, 3, 4;
}

proc _add_quad a, b, c, d {
    if (vertex_ptrs[$a] == 0) {
        add $a to verts;
        vertex_ptrs[$a] = length verts;
    }
    add vertex_ptrs[$a] to quads;

    if (vertex_ptrs[$b] == 0) {
        add $b to verts;
        vertex_ptrs[$b] = length verts;
    }
    add vertex_ptrs[$b] to quads;

    if (vertex_ptrs[$c] == 0) {
        add $c to verts;
        vertex_ptrs[$c] = length verts;
    }
    add vertex_ptrs[$c] to quads;

    if (vertex_ptrs[$d] == 0) {
        add $d to verts;
        vertex_ptrs[$d] = length verts;
    }
    add vertex_ptrs[$d] to quads;
}


################################
#            Utils             #
################################


# Convert text buffer into base64 and output a data URL or output the text buffer as-is.
# For text-based file formats such as obj or ply.
proc output_list_or_URL generate_URL, frag1, frag2 {
    delete copy_this;
    if ($generate_URL) {
        text_buffer_to_byte_buffer;
        delete text_buffer;

        byte_buffer_to_base64;
        delete byte_buffer;

        add fragments[$frag1] & base64_string & fragments[$frag2] to copy_this;

    } else {
        local i = 1;
        repeat (length text_buffer) {
            add text_buffer[i] to copy_this;
            i++;
        }
        delete text_buffer;
    }
    broadcast "sys.show_copy_this";
}


proc text_buffer_to_byte_buffer {
    local line_index = 1;
    repeat (length text_buffer) {
        local line = text_buffer[line_index];
        local i = 1;
        repeat (length line) {
            switch_costume " "; # fallback
            switch_costume line[i];
            add costume_number()+29 to byte_buffer; # note this counts from 0
            i++;
        }
        add 10 to byte_buffer; # Line feed
        line_index++;
    }
    delete byte_buffer[length byte_buffer]; # remove last line feed
}


proc byte_buffer_to_base64 {
    base64_string = "";
    local i = 1;
    repeat (length byte_buffer // 3) {
        base64_string &= BASE64_CHARS[1 + (byte_buffer[i] // 4)]; # bit shift >>2
        
        base64_string &= BASE64_CHARS[1 + \
            ((byte_buffer[i] % 4) * 16) + \ # keep last 2 bits of input and shift them to most significant <<4 (6-bit number)
            (byte_buffer[i+1] // 16)\ # bit shift >>4
        ];

        base64_string &= BASE64_CHARS[1 + \
            ((byte_buffer[i+1] % 16) * 4) + \ # keep last 4 bits of input and shift them to most significant <<2 (6-bit number)
            (byte_buffer[i+2] // 64)\ # bit shift >>6
        ];
        
        base64_string &= BASE64_CHARS[1 + \
            (byte_buffer[i+2] % 64)\ # bit shift <<2
        ];
        
        i += 3;
    }

    # add final chars and padding
    if (length byte_buffer % 3 > 0) {
        base64_string &= BASE64_CHARS[1 + (byte_buffer[i] // 4)]; # bit shift >>2

        if (length byte_buffer % 3 == 1) {
            base64_string &= BASE64_CHARS[1 + \
                ((byte_buffer[i] % 4) * 16)\ # keep last 2 bits of input and shift them to most significant <<4 (6-bit number)
            ] & "=="; # padding
        } else {
            base64_string &= BASE64_CHARS[1 + \
                ((byte_buffer[i] % 4) * 16) + \ # keep last 2 bits of input and shift them to most significant <<4 (6-bit number)
                (byte_buffer[i+1] // 16)\ # bit shift >>4
            ];

            base64_string &= BASE64_CHARS[1 + \
                ((byte_buffer[i+1] % 16) * 4)\ # keep last 4 bits of input and shift them to most significant <<2 (6-bit number)
            ] & "="; # padding
        }
    }
}


