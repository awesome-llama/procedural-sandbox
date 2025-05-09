%include common/common.gs

costumes "costumes/blank.svg" as "blank";
hide;


# generate a hash from the current canvas for an easy way to verify if a canvas is identical
on "debug.hash_canvas.run" { compute_canvas_hash; }
proc compute_canvas_hash {
    local hash_sum = 0;
    i = 1;
    repeat (length canvas) {
        hash_sum = (hash_sum + (i/47.0459) + (canvas[i].r*13.19) + (canvas[i].g*17.13) + (canvas[i].b*19.09) + (canvas[i].opacity*23.67) + (canvas[i].emission*29)) % 1;
        i++;
    }
    
    hash = "";
    i = 1;
    repeat 4 { # it seems ~4 bytes of precision can be extracted
        hash_sum *= 256;
        hash &= hex_lookup[1+floor(hash_sum%256)];
        hash_sum = hash_sum%1;
    }

    print hash, 5;
}




