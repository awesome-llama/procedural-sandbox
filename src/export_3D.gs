%include common/common.gs

costumes "costumes/blank.svg" as "",
"costumes/blank.svg" as "@ascii/";
hide;

list BASE64_CHARS = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9","+","/"];

list fragments_ply_point_cloud = file ```data_URL/fragments_ply_point_cloud.txt```;

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

    add "comment Created by awesome-llama's Procedural Sandbox v" & version to text_buffer;
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

    delete copy_this;
    if ($create_data_url) {
        text_buffer_to_byte_buffer;
        delete text_buffer;

        byte_buffer_to_base64;
        delete byte_buffer;

        add fragments_ply_point_cloud[1] & fragments_ply_point_cloud[2] & base64_string & fragments_ply_point_cloud[4] to copy_this;

    } else {
        local i = 1;
        repeat (length text_buffer) {
            add text_buffer[i] to copy_this;
            i++;
        }
        delete text_buffer;
    }

    show copy_this;
}


proc text_buffer_to_byte_buffer {
    local line_index = 1;
    repeat (length text_buffer) {
        local line = text_buffer[line_index];
        local i = 1;
        repeat (length line) {
            switch_costume " "; # fallback
            switch_costume line[i];
            add costume_number()+30 to byte_buffer; # note this counts from 0
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


