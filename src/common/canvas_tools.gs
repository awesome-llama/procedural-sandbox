# Utils for generating a canvas.
# Not a valid sprite by iself.

#costumes "costumes/blank.svg";


proc set_base_layer r, g, b {
    i = 1;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        canvas[i] = VOXEL_SOLID($r, $g, $b)
        i++;
    }
}


proc set_voxel x, y, z {
    local set_px_z = floor($z);
    
    if ($z >= 0 and $z < canvas_size_z) { # only set the voxel if z is in range
        local set_px_i = 1 + (((canvas_size_x*canvas_size_y) * set_px_z) + ((canvas_size_x*(floor($y) % canvas_size_y))+(floor($x) % canvas_size_x)));

        canvas[set_px_i] = voxel_brush; # set voxel with brush
    }
}

# , depth
proc draw_rect x, y, z, width, height {
    local px_y = ($y-$height);
    repeat $width {
        local px_x = ($x-$width);
        repeat $height {
            set_voxel px_x, px_y, $z;
            px_x++;
        }
        px_y++;
    }
}


proc draw_filled_circle x, y, z, radius, depth, bevel {
    px_y = (0-$radius);
    repeat (1+(2*$radius)) {
        px_x = (0-$radius);
        repeat (1+(2*$radius)) {
            _dist = sqrt(((px_x*px_x)+(px_y*px_y)));
            if (_dist < $radius) {
                if (_dist > ($radius-$bevel)) {
                    set_voxel ($x+px_x), ($y+px_y), ($z-(_dist-($radius-$bevel)));
                } else {
                    set_voxel ($x+px_x), ($y+px_y), $z;
                }
            }
            px_x += 1;
        }
        px_y += 1;
    }
}

