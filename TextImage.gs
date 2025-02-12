# Converted from sb3 file

list hash_table;

list volumes = file```TextImage_volumes.txt```;
list op_sizes = file```TextImage_operation_sizes.txt```;

list layers;
list image_buffer;
list data_stream_list;
list temp;

costumes "costumes/TextImage/icon.svg" as "icon", "costumes/blank.svg" as "@ascii/";

# script dC (660,250)
proc _image_buffer____decompress_RGB8__s_width__s data_stream, width {
    _data_stream____get_character_codes_from_data_stream__s $data_stream;
    delete image_buffer;
    delete hash_table;
    repeat 94 {
        add "0" to hash_table;
    }
    # comment "repeat is a counter for how many times an op should be run (RLE)";
    _repeat = "0";
    op_size = "0";
    i = "1";
    until (i > (length data_stream_list)) {
        if (_repeat > "0") {
            # comment "RLE uses the previously found op and decrements repeat";
            _repeat += "-1";
        } else {
            op_index = data_stream_list[i];
        }
        if (op_index < "21") {
            # comment "raw";
            dec = (("830584"*op_index)+(("8836"*data_stream_list[(i+"1")])+(("94"*data_stream_list[(i+"2")])+data_stream_list[(i+"3")])));
            _add_RGB__s__s__s floor((dec/"65536")), (floor((dec/"256"))%"256"), (dec%"256");
            op_size = "3";
        } else {
            if (op_index == "22") {
                # comment "prev";
                _add_RGB__s__s__s round(image_buffer[((length image_buffer)-"2")]), round(image_buffer[((length image_buffer)-"1")]), round(image_buffer["last"]);
                op_size = "0";
            } else {
                if (op_index < "26") {
                    # comment "copy vert fwd/mid/back";
                    _add_RGB__s__s__s round(image_buffer[(("3"*((((length image_buffer)/"3")-$width)+("25"-op_index)))-"2")]), round(image_buffer[(("3"*((((length image_buffer)/"3")-$width)+("25"-op_index)))-"1")]), round(image_buffer[(("3"*((((length image_buffer)/"3")-$width)+("25"-op_index)))-"0")]);
                    op_size = "0";
                } else {
                    if (op_index == "26") {
                        # comment "hash";
                        dec = hash_table[("1"+data_stream_list[(i+"1")])];
                        _add_RGB__s__s__s floor((dec/"65536")), (floor((dec/"256"))%"256"), (dec%"256");
                        op_size = "1";
                    } else {
                        if (op_index == "27") {
                            # comment "RLE";
                            op_index = data_stream_list[(i+"1")];
                            _repeat = data_stream_list[(i+"2")];
                            op_size = "2";
                        } else {
                            if (op_index < "91") {
                                # comment "vol";
                                vol_index = ("1"+((op_index-"28")*"8"));
                                if (op_index < "73") {
                                    _vol_index_to_col__index___s_origin___s__s__s_dim___s__s__s data_stream_list[(i+"1")], volumes[("1"+vol_index)], volumes[("2"+vol_index)], volumes[("3"+vol_index)], "5", "4", "4";
                                    op_size = "1";
                                } else {
                                    _vol_index_to_col__index___s_origin___s__s__s_dim___s__s__s (("94"*data_stream_list[(i+"1")])+data_stream_list[(i+"2")]), volumes[("1"+vol_index)], volumes[("2"+vol_index)], volumes[("3"+vol_index)], "21", "20", "20";
                                    op_size = "2";
                                }
                                _add_RGB__s__s__s (image_buffer[((length image_buffer)-"2")]+(return_v+return_Y_)), (image_buffer[((length image_buffer)-"1")]+return_Y_), (image_buffer["last"]+(return_u+return_Y_));
                            } else {
                                # error "unknown chunk";
                                stop_this_script;
                            }
                        }
                    }
                }
            }
        }
        i += ((_repeat == "0")+op_size);
    }
    delete data_stream_list;
    delete hash_table;
}


# script l! (4012,1637)
proc _add_RGB__s__s__s r, g, b {
    add $r to image_buffer;
    add $g to image_buffer;
    add $b to image_buffer;
    hash_table[("1"+(((("3"*$r)+("5"*$g))+("7"*$b))%"94"))] = ((("65536"*$r)+("256"*$g))+$b);
}

# script l+ (4004,1244)
proc _vol_index_to_col__index___s_origin___s__s__s_dim___s__s__s index, o0, o1, o2, d0, d1, d2 {
    return_Y_ = ($o0+(floor(($index/($d2*$d1)))%$d0));
    return_u = ($o1+(floor(($index/$d2))%$d1));
    return_v = ($o2+($index%$d2));
}

# script l? (2499,240)
proc _image_buffer____decompress_A8__s_width__s data_stream, width {
    _data_stream____get_character_codes_from_data_stream__s $data_stream;
    delete image_buffer;
    # comment "repeat is a counter for how many times an op should be run (RLE)";
    _repeat = "0";
    op_size = "0";
    i = "1";
    until (i > (length data_stream_list)) {
        if (_repeat > "0") {
            # comment "RLE uses the previously found op and decrements repeat";
            _repeat += "-1";
        } else {
            op_index = data_stream_list[i];
        }
        if (op_index < "3") {
            # comment "raw";
            add (("94"*op_index)+data_stream_list[(i+"1")]) to image_buffer;
            op_size = "1";
        } else {
            if (op_index == "3") {
                # comment "prev";
                add round(image_buffer["last"]) to image_buffer;
                op_size = "0";
            } else {
                if (op_index < "7") {
                    # comment "copy vert fwd/mid/back";
                    add round(image_buffer[(((length image_buffer)-$width)+("6"-op_index))]) to image_buffer;
                    op_size = "0";
                } else {
                    if (op_index == "7") {
                        # comment "RLE";
                        op_index = data_stream_list[(i+"1")];
                        _repeat = data_stream_list[(i+"2")];
                        op_size = "2";
                    } else {
                        # comment "diff";
                        if (op_index < "51") {
                            add ((image_buffer["last"]+(op_index-"7"))%"256") to image_buffer;
                        } else {
                            add ((image_buffer["last"]+("50"-op_index))%"256") to image_buffer;
                        }
                        op_size = "0";
                    }
                }
            }
        }
        i += ((_repeat == "0")+op_size);
    }
    delete data_stream_list;
}

# script mR (-546,189)
proc read_TextImage__s TextImage {
    # comment "github.com/awesome-llama/TextImage";
    delete TI__header;
    add "" to TI__header;
    delete layers;
    i = "1";
    repeat length($TextImage) {
        if ($TextImage[i] == ",") {
            add str to TI__header;
            str = "";
        } else {
            if ($TextImage[i] == ":") {
                add ("!" & str) to TI__header;
                str = "";
            } else {
                if ($TextImage[i] == "|") {
                    add str to TI__header;
                    str = "";
                    if (TI__header["2"] == "txtimg") {
                        if (TI__header[("1"+("!v" in TI__header))] == "0") {
                            # comment "read header";
                            TI__image_size_x = floor(TI__header[("1"+("!x" in TI__header))]);
                            TI__image_size_y = floor(TI__header[("1"+("!y" in TI__header))]);
                            # comment "convert header and data streams into a list of layers";
                            i += "1";
                            j = ("1"+("!p" in TI__header));
                            repeat (TI__header[j]/"4") {
                                # comment "sets of 6 items... !purpose, purpose, type, version, length, index_start";
                                add ("!" & TI__header[(j+"1")]) to layers;
                                add TI__header[(j+"1")] to layers;
                                add TI__header[(j+"2")] to layers;
                                add TI__header[(j+"3")] to layers;
                                add TI__header[(j+"4")] to layers;
                                add i to layers;
                                i += TI__header[(j+"4")];
                                j += "4";
                            }
                            # comment "now load data streams based on purpose";
                            # comment "this part is for the user to modify for their use case";
                            read_layer_from_TextImage___s_purpose___s_add_to_list___s $TextImage, "main", "RGB";
                            read_layer_from_TextImage___s_purpose___s_add_to_list___s $TextImage, "alpha", "A";
                            delete layers;
                            data_stream = "";
                        } else {
                            # error "unknown version";
                        }
                    } else {
                        # error "invalid magic number";
                    }
                    switch_costume "icon";
                    stop_this_script;
                } else {
                    str = (str & $TextImage[i]);
                }
            }
        }
        i += "1";
    }
    # error "datastream not found";
}

# script nw (-557,3291)
proc read_layer_from_TextImage___s_purpose___s_add_to_list___s TextImage, purpose, buffer_target_list {
    # comment "REQUIRES (image size x) (image size y) [layers]";
    # comment "Takes the layer data (sets of 5 items) and decodes them.";
    # comment "Decoded result stored in the temporary buffer is then outputted into desired lists.";
    # comment "If the desired lists are something else, you may want to modify the script(s).";
    i = (("!" & $purpose) in layers);
    if (i > "0") {
        # comment "get data stream from TextImage";
        data_stream = "";
        j = layers[(i+"5")];
        repeat layers[(i+"4")] {
            data_stream = (data_stream & $TextImage[j]);
            j += "1";
        }
        # comment "process data stream";
        if ((layers[(i+"2")] == "RGB8") and (layers[(i+"3")] == "0")) {
            _image_buffer____decompress_RGB8__s_width__s data_stream, TI__image_size_x;
            if ($buffer_target_list == "RGB") {
                _r___g___b____unpack_from__image_buffer___step___s_indices___s__s__s "3", "1", "2", "3";
            } else {
                if ($buffer_target_list == "A") {
                    _a____unpack_from__image_buffer___step___s_index___s "3", "2";
                } else {
                    # error "buffer target list does not exist";
                }
            }
            delete image_buffer;
            stop_this_script;
        } else {
            if ((layers[(i+"2")] == "A8") and (layers[(i+"3")] == "0")) {
                _image_buffer____decompress_A8__s_width__s data_stream, TI__image_size_x;
                if ($buffer_target_list == "RGB") {
                    _r___g___b____unpack_from__image_buffer___step___s_indices___s__s__s "1", "1", "1", "1";
                } else {
                    if ($buffer_target_list == "A") {
                        _a____unpack_from__image_buffer___step___s_index___s "1", "1";
                    } else {
                        # error "buffer target list does not exist";
                    }
                }
                delete image_buffer;
                stop_this_script;
            } else {
                # warn "unknown data stream type and/or version";
            }
        }
    }
    # comment "defaults";
    if ($buffer_target_list == "RGB") {
        _r___g___b____unpack_from__image_buffer___step___s_indices___s__s__s "1", "1", "1", "1";
    } else {
        if ($buffer_target_list == "A") {
            _a____unpack_from__image_buffer___step___s_index___s "1", "1";
        }
    }
}

# script n( (673,4005)
proc _r___g___b____unpack_from__image_buffer___step___s_indices___s__s__s step, ri, gi, bi {
    # comment "REQUIRES (image size x) (image size y) [1 r] [2 g] [3 b]";
    delete TI__1_r;
    delete TI__2_g;
    delete TI__3_b;
    i = "0";
    repeat (TI__image_size_x*TI__image_size_y) {
        add round(image_buffer[(i+$ri)]) to TI__1_r;
        add round(image_buffer[(i+$gi)]) to TI__2_g;
        add round(image_buffer[(i+$bi)]) to TI__3_b;
        i += $step;
    }
}

# script n- (684,4748)
proc _a____unpack_from__image_buffer___step___s_index___s step, i {
    # comment "REQUIRES (image size x) (image size y) [4 a]";
    delete TI__4_a;
    i = "0";
    repeat (TI__image_size_x*TI__image_size_y) {
        if (image_buffer[(i+$i)] == "") {
            add "255" to TI__4_a;
        } else {
            add round(image_buffer[(i+$i)]) to TI__4_a;
        }
        i += $step;
    }
}

# script n{ (6572,339)
proc write_TextImage  {
    # comment "REQUIRES (image size x) (image size y)";
    TI__image_size_x = floor(TI__image_size_x);
    TI__image_size_y = floor(TI__image_size_y);
    delete layers;
    # comment "encode layers, this can be modified to suit the use case";
    # comment "RGB8:";
    delete image_buffer;
    i = 1;
    repeat (TI__image_size_x*TI__image_size_y) {
        add round(("255"-(("255"-(TI__1_r[i]*(TI__1_r[i] > "0")))*(TI__1_r[i] < "255")))) to image_buffer;
        add round(("255"-(("255"-(TI__2_g[i]*(TI__2_g[i] > "0")))*(TI__2_g[i] < "255")))) to image_buffer;
        add round(("255"-(("255"-(TI__3_b[i]*(TI__3_b[i] > "0")))*(TI__3_b[i] < "255")))) to image_buffer;
        i++;
    }
    _data_stream____compress_RGB8_from_buffer__width___s TI__image_size_x;
    add_layer__purpose___s_type___s_version___s_data_stream___s "main", "RGB8", "0", data_stream;
    # comment "A8:";
    delete image_buffer;
    i = 1;
    repeat (TI__image_size_x*TI__image_size_y) {
        add round(("255"-(("255"-(TI__4_a[i]*(TI__4_a[i] > "0")))*(TI__4_a[i] < "255")))) to image_buffer;
        i++;
    }
    _data_stream____compress_A8_from_buffer__width___s TI__image_size_x;
    add_layer__purpose___s_type___s_version___s_data_stream___s "alpha", "A8", "0", data_stream;
    # comment "create file";
    TextImage = ("txtimg,v:0," & ((("x:" & TI__image_size_x) & (",y:" & TI__image_size_y)) & ","));
    # CUSTOM
    TextImage = (TextImage & (("_z:" & canvas_size_z) & ","));
    # comment "layers (sets of 6 items)";
    TextImage = (TextImage & ("p:" & ("4"*((length layers)/"6"))));
    data_stream = "";
    i = "0";
    repeat ((length layers)/"6") {
        TextImage = (TextImage & ("," & layers[(i+"2")]));
        TextImage = (TextImage & ("," & layers[(i+"3")]));
        TextImage = (TextImage & ("," & layers[(i+"4")]));
        TextImage = (TextImage & ("," & layers[(i+"5")]));
        data_stream = (data_stream & layers[(i+"6")]);
        i += "6";
    }
    TextImage = (TextImage & ("|" & data_stream));
    switch_costume "icon";
}

# script oE (3987,327)
proc _data_stream____get_character_codes_from_data_stream__s data_stream {
    # comment "iterate over inputted text, convert each to character indices. ! should be index 0.";
    delete data_stream_list;
    i = 1;
    repeat length($data_stream) {
        switch_costume $data_stream[i];
        add (costume_number()-"3") to data_stream_list;
        i++;
    }
}

# script oN (8181,812)
proc _data_stream____compress_RGB8_from_buffer__width___s width {
    # comment "REQUIRES [image buffer]";
    delete data_stream_list;
    delete hash_table;
    repeat "94" {
        add "0" to hash_table;
    }
    i = "0";
    repeat ((length image_buffer)/"3") {
        # comment "get current pixel as a single decimal value for faster comparisons";
        dec = (("65536"*image_buffer[(i+"1")])+(("256"*image_buffer[(i+"2")])+image_buffer[(i+"3")]));
        if (dec == (("65536"*image_buffer[(i+"-2")])+(("256"*image_buffer[(i+"-1")])+image_buffer[(i+"0")]))) {
            # comment "prev";
            add "22" to data_stream_list;
        } else {
            if (dec == (("65536"*image_buffer[((i-("3"*$width))+"4")])+(("256"*image_buffer[((i-("3"*$width))+"5")])+image_buffer[((i-("3"*$width))+"6")]))) {
                # comment "copy vert fwd";
                add "23" to data_stream_list;
            } else {
                if (dec == (("65536"*image_buffer[((i-("3"*$width))+"1")])+(("256"*image_buffer[((i-("3"*$width))+"2")])+image_buffer[((i-("3"*$width))+"3")]))) {
                    # comment "copy vert";
                    add "24" to data_stream_list;
                } else {
                    if (dec == (("65536"*image_buffer[((i-("3"*$width))+"-2")])+(("256"*image_buffer[((i-("3"*$width))+"-1")])+image_buffer[((i-("3"*$width))+"0")]))) {
                        # comment "copy vert back";
                        add "25" to data_stream_list;
                    } else {
                        if contains(hash_table, dec) {
                            # comment "hash table";
                            add "26" to data_stream_list;
                            add ((dec in hash_table)-"1") to data_stream_list;
                        } else {
                            return_Y_ = (image_buffer[(i+"2")]-image_buffer[(i+"-1")]);
                            return_u = ((image_buffer[(i+"3")]-image_buffer[(i+"0")])-return_Y_);
                            return_v = ((image_buffer[(i+"1")]-image_buffer[(i+"-2")])-return_Y_);
                            # comment "convert to vol index for each vol. This is mostly hard-coded, modification required if the volumes list is changed";
                            vol_index = "";
                            j = "-8";
                            until not ((vol_index == "") and (j < "352")) {
                                j += "8";
                                _col_to_vol_index__col___s__s__s_origin___s__s__s_dim___s__s__s return_Y_, return_u, return_v, volumes[(j+"2")], volumes[(j+"3")], volumes[(j+"4")], "5", "4", "4";
                            }
                            if (vol_index == "") {
                                until not ((vol_index == "") and (j < "496")) {
                                    j += "8";
                                    _col_to_vol_index__col___s__s__s_origin___s__s__s_dim___s__s__s return_Y_, return_u, return_v, volumes[(j+"2")], volumes[(j+"3")], volumes[(j+"4")], "21", "20", "20";
                                }
                                if (vol_index == "") {
                                    # comment "FALLBACK raw 4-tuple";
                                    add (floor((dec/"830584"))%"21") to data_stream_list;
                                    add (floor((dec/"8836"))%"94") to data_stream_list;
                                    add (floor((dec/"94"))%"94") to data_stream_list;
                                    add (dec%"94") to data_stream_list;
                                } else {
                                    add ("28"+(j/"8")) to data_stream_list;
                                    add floor((vol_index/"94")) to data_stream_list;
                                    add (vol_index%"94") to data_stream_list;
                                }
                            } else {
                                add ("28"+(j/"8")) to data_stream_list;
                                add vol_index to data_stream_list;
                            }
                        }
                    }
                }
            }
        }
        hash_table[("1"+(((("3"*image_buffer[(i+"1")])+("5"*image_buffer[(i+"2")]))+("7"*image_buffer[(i+"3")]))%"94"))] = dec;
        i += "3";
    }
    # comment "RLE";
    _data_stream__process_RLE_using_index__s_op_size_start_index__s "27", "0";
    # comment "convert to data stream";
    _data_stream____chars_from__data_stream_;
    delete data_stream_list;
    delete hash_table;
}

# script c+ (10455,348)
proc _data_stream____compress_A8_from_buffer__width___s width {
    # comment "REQUIRES [image buffer]";
    delete data_stream_list;
    i = "1";
    repeat (length image_buffer) {
        dec = image_buffer[i];
        if (dec == image_buffer[(i-"1")]) {
            # comment "prev";
            add "3" to data_stream_list;
        } else {
            if (dec == image_buffer[(i-($width-"1"))]) {
                # comment "copy vert fwd";
                add "4" to data_stream_list;
            } else {
                if (dec == image_buffer[(i-$width)]) {
                    # comment "copy vert";
                    add "5" to data_stream_list;
                } else {
                    if (dec == image_buffer[(i-($width+"1"))]) {
                        # comment "copy vert back";
                        add "6" to data_stream_list;
                    } else {
                        diff = ((((dec-image_buffer[(i-"1")])+"128")%"256")-"128");
                        if (("0" < diff) and (diff < "42")) {
                            # comment "inc";
                            add (diff+"7") to data_stream_list;
                        } else {
                            if (("-42" < diff) and (diff < "0")) {
                                # comment "dec";
                                add ("50"-diff) to data_stream_list;
                            } else {
                                # comment "raw 2-tuple";
                                add (floor((dec/"94"))%"94") to data_stream_list;
                                add (dec%"94") to data_stream_list;
                            }
                        }
                    }
                }
            }
        }
        i += "1";
    }
    # comment "RLE";
    _data_stream__process_RLE_using_index__s_op_size_start_index__s "7", "94";
    # comment "convert to data stream";
    _data_stream____chars_from__data_stream_;
    delete data_stream_list;
}

# script h[ (6580,2825)
proc add_layer__purpose___s_type___s_version___s_data_stream___s purpose, type, version, data_stream {
    # comment "sets of 6 items... !purpose, purpose, type, version, length, index_start";
    add ("!" & $purpose) to layers;
    add $purpose to layers;
    add $type to layers;
    add $version to layers;
    add length($data_stream) to layers;
    add $data_stream to layers;
}

# script h{ (3997,787)
proc _data_stream____chars_from__data_stream_  {
    # comment "iterate over [data stream] list, convert each to chars";
    data_stream = "";
    i = 1;
    repeat (length data_stream_list) {
        switch_costume (data_stream_list[i]+"3");
        data_stream = (data_stream & costume_name());
        i++;
    }
}

# script id (11426,360)
proc _data_stream__process_RLE_using_index__s_op_size_start_index__s RLE_index, op_size_start_index {
    # comment "RLE index: the index for `repeat_op`  |  op size start index: the index into the [op sizes] list, 0-indexed";
    # comment "load [data stream] into temp list";
    delete temp;
    i = 1;
    repeat (length data_stream_list) {
        add data_stream_list[i] to temp;
        i++;
    }
    delete data_stream_list;
    # comment "[image buffer] now will be repurposed to store op data. buffer size is the number of ops in the buffer, buffer op is the op code used by all buffer items. (op size) is repurposed.";
    i = "1";
    delete image_buffer;
    buffer_size = "0";
    buffer_op = temp[i];
    # comment "iterate over temp, adding repeat_op when needed";
    until (i > ("1"+(length temp))) {
        if (not ((buffer_op == temp[i]) and (buffer_size < "93"))) {
            # comment "check that the buffer is compressible with RLE";
            if (("3"+(buffer_size*op_size)) < (buffer_size*("1"+op_size))) {
                # comment "use RLE";
                add $RLE_index to data_stream_list;
                add buffer_op to data_stream_list;
                add buffer_size to data_stream_list;
                j = 1;
                repeat (length image_buffer) {
                    add image_buffer[j] to data_stream_list;
                    j++;
                }
            } else {
                # comment "dump the buffer contents back into the data stream with unaltered chunks";
                j = "1";
                repeat buffer_size {
                    add buffer_op to data_stream_list;
                    repeat op_size {
                        add image_buffer[j] to data_stream_list;
                        j += "1";
                    }
                }
            }
            # comment "next chunk";
            delete image_buffer;
            buffer_size = "0";
            buffer_op = temp[i];
        }
        # comment "add current chunk to buffer";
        op_size = op_sizes[(("1"+$op_size_start_index)+buffer_op)];
        i += "1";
        repeat op_size {
            add temp[i] to image_buffer;
            i += "1";
        }
        buffer_size += "1";
    }
    delete temp;
}

# script ip (8175,311)
proc _col_to_vol_index__col___s__s__s_origin___s__s__s_dim___s__s__s c0, c1, c2, o0, o1, o2, d0, d1, d2 {
    if (((not (($c0-$o0) < "0")) and (($c0-$o0) < $d0)) and (((not (($c1-$o1) < "0")) and (($c1-$o1) < $d1)) and ((not (($c2-$o2) < "0")) and (($c2-$o2) < $d2)))) {
        vol_index = ((($d1*$d2)*($c0-$o0))+(($d2*($c1-$o1))+($c2-$o2)));
    } else {
        vol_index = "";
    }
}

# script D* (-962,-354)
on "write TextImage" {
    write_TextImage;
}


# script D= (-604,-346)
on "read TextImage" {
    # comment "the expectation is TextImage gets written to";
    read_TextImage__s TextImage;
}

# script D] (-971,-175)
on "reset" {
    TextImage = "";
    delete TI__1_r;
    delete TI__2_g;
    delete TI__3_b;
    delete TI__4_a;
    delete TI__header;
}
