%include common/common.gs;

costumes "costumes/blank.svg" as "blank";
hide;

list maze_graph;
list custom_grid;
list eca_lut;

list voxel temp_canvas; # list used to store the canvas temporarily

on "initalise" {
    hide;
}

on "hard reset" {
    delete maze_graph;
    delete custom_grid;
    delete eca_lut;
    delete temp_canvas;
}

on "*" {
    delete_all_templates;
    add_canvas_as_template;
    load_template_to_canvas 0;
    stamp_template 0, 0, 0, 0;
}


on "io.new_canvas.run"{
    delete UI_return;
    setting_from_id "io.new_canvas.size_x";
    setting_from_id "io.new_canvas.size_y";
    setting_from_id "io.new_canvas.size_z";
    setting_from_id "io.new_canvas.include_base";
    setting_from_id "io.new_canvas.base_col";
    
    # no custom block needed
    canvas_size_x = UI_return[1];
    canvas_size_y = UI_return[2];
    canvas_size_z = UI_return[3];
    clear_canvas;
    reset_depositor;
    if UI_return[4] {
        set_depositor_from_number UI_return[5];
        draw_base_layer;
    }
}


on "gen.eca.run" {
    delete UI_return;
    setting_from_id "gen.eca.size_x";
    setting_from_id "gen.eca.size_y";
    setting_from_id "gen.eca.extrude_z";
    setting_from_id "gen.eca.rule";
    setting_from_id "gen.eca.random_initial_condition";
    setting_from_id "gen.eca.state_0_col";
    setting_from_id "gen.eca.state_1_col";
    generate_elementary_cellular_automata UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6], UI_return[7];
}
proc generate_elementary_cellular_automata size_x, size_y, extrude_z, rule, random_start, state_0_col, state_1_col {
    # generate the canvas
    canvas_size_x = $size_x;
    canvas_size_y = $size_y;
    canvas_size_z = 1 + $extrude_z;
    clear_canvas;
    reset_depositor;
    set_depositor_from_number $state_0_col;
    draw_base_layer;
    set_depositor_from_number $state_1_col;

    # generate the lookup table (convert rule to binary)
    delete eca_lut;
    local remaining = floor($rule);
    repeat 8 {
        add 1-((remaining % 2)<1) to eca_lut;
        remaining /= 2;
    }

    # generate the initial state
    delete custom_grid;
    ix = 0;
    if $random_start {
        repeat canvas_size_x {
            if random(0,1) {
                add 1 to custom_grid;
                set_voxel ix, (canvas_size_y-1), 0;
            } else {
                add 0 to custom_grid;
            }
            ix++;
        }
    } else {
        repeat canvas_size_x {
            add 0 to custom_grid;
        }
        custom_grid[1+canvas_size_x//2] = 1;
        set_voxel canvas_size_x//2, (canvas_size_y-1), 0;
    }

    # iterate and set voxels
    iy = 0;
    repeat (canvas_size_y-1) {
        ix = 0;
        repeat canvas_size_x {
            # get the adj
            if eca_lut[1 + \
            custom_grid[iy*canvas_size_x + (ix-1)%canvas_size_x + 1]*4 + \
            custom_grid[iy*canvas_size_x + ix + 1]*2 + \
            custom_grid[iy*canvas_size_x + (ix+1)%canvas_size_x + 1]] {
                add 1 to custom_grid;
                #set_voxel ix, (canvas_size_y-2)-iy, 0;
                draw_column ix, (canvas_size_y-2)-iy, 0, canvas_size_z;
            } else {
                add 0 to custom_grid;
            }
            ix++;
        }
        iy++;
    }

    delete custom_grid;
    delete eca_lut;
    require_composite = true;
}


on "gen.extruded_grid.run" {
    delete UI_return;
    setting_from_id "gen.extruded_grid.cell_count";
    setting_from_id "gen.extruded_grid.cell_size";
    setting_from_id "gen.extruded_grid.cell_spacing";
    setting_from_id "gen.extruded_grid.max_height";
    setting_from_id "gen.extruded_grid.jitter_fac";
    setting_from_id "gen.extruded_grid.col1";
    setting_from_id "gen.extruded_grid.col2";
    setting_from_id "gen.extruded_grid.glow";
    generate_extruded_grid UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6], UI_return[7], UI_return[8];
}
proc generate_extruded_grid cell_count, cell_size, cell_spacing, max_height, jitter_fac, col1, col2, glow {
    local total_cell_size = ($cell_size+$cell_spacing);
    
    canvas_size_x = $cell_count*total_cell_size;
    canvas_size_y = $cell_count*total_cell_size;
    canvas_size_z = $max_height;
    clear_canvas;
    reset_depositor;
    set_depositor_from_number $col1;
    draw_base_layer;

    iy = 0;
    repeat $cell_count {
        ix = 0;
        repeat $cell_count {
            set_depositor_from_sRGB_value RANDOM_0_1();
            if (random("0.0", "0.5") < $glow) {
                depositor_voxel.emission = random("0.0", random($glow, "1.0")); # shouldn't be linear
            }
            draw_cuboid_corner_size ix+($jitter_fac*total_cell_size*RANDOM_0_1()), iy+($jitter_fac*total_cell_size*RANDOM_0_1()), 0, $cell_size, $cell_size, random(1,$max_height);
            ix += total_cell_size;
        }
        iy += total_cell_size;
    }

    glbfx_recolor 0.25, 0.5, 0.25, 0, 1, $col1, $col2, true;
    require_composite = true;
}


on "gen.maze.run" {
    delete UI_return;
    setting_from_id "gen.maze.cell_count";
    setting_from_id "gen.maze.cell_size";
    setting_from_id "gen.maze.wall_thickness";
    setting_from_id "gen.maze.wall_height";
    setting_from_id "gen.maze.pertubation";

    setting_from_id "gen.maze.ground_col";
    setting_from_id "gen.maze.wall_col";
    generate_maze UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6], UI_return[7]; 
}

%define MGSOFFSET(DX,DY,SIDE) (maze_graph[(((edit_x+(DX))%$cell_count) + ((edit_y+(DY))%$cell_count)*$cell_count)*2+(SIDE)])
%define MGSOFFSETX(DX,SIDE) (maze_graph[(((edit_x+(DX))%$cell_count) + (edit_y*$cell_count))*2+(SIDE)])
%define MGSOFFSETY(DY,SIDE) (maze_graph[(edit_x + ((edit_y+(DY))%$cell_count)*$cell_count)*2+(SIDE)])
%define MGS(SIDE) (maze_graph[(edit_x + (edit_y*$cell_count))*2+(SIDE)])

proc generate_maze cell_count, cell_size, wall_thickness, wall_height, pertubation, ground_col, wall_col {
    local total_cell_size = ($cell_size+$wall_thickness);

    # first generate the maze graph, 2 items per cell for the 2 walls (they make an L shape in the cell)
    delete maze_graph;
    repeat ($cell_count*$cell_count) {
        if random(0, 1) {
            add 0 to maze_graph;
            add 1 to maze_graph;
        } else {
            add 1 to maze_graph;
            add 0 to maze_graph;
        }
    }

    # randomise by swapping walls
    # take a random cell and swap any 2 of its 4 adj walls
    repeat ($cell_count*$cell_count*$pertubation) {
        local edit_x = random(1,$cell_count);
        local edit_y = random(1,$cell_count);

        if random(0,1) {
            # vertical toggle
            local index_to_edit = (edit_x + (edit_y*$cell_count))*2+2;
            local req_state = maze_graph[index_to_edit];
            # check if there is still another of the same state as the original
            if req_state == MGSOFFSETY(1,1) or req_state == MGSOFFSETY(1,2) or MGSOFFSET(-1,1,1) {
                if req_state == MGS(1) or req_state == MGSOFFSETX(-1,1) or req_state == MGSOFFSETY(-1,2) {
                    maze_graph[index_to_edit] = 1 - maze_graph[index_to_edit];
                }
            }
        } else {
            # horizontal
            local index_to_edit = (edit_x + (edit_y*$cell_count))*2+1;
            local req_state = maze_graph[index_to_edit];
            # check if there is still another of the same state as the original
            if req_state == MGSOFFSETX(1,1) or req_state == MGSOFFSETX(1,2) or MGSOFFSET(1,-1,2) {
                if req_state == MGS(2) or req_state == MGSOFFSETY(-1,2) or req_state == MGSOFFSETX(-1,1) {
                    maze_graph[index_to_edit] = 1 - maze_graph[index_to_edit];
                }
            }
        }
    }

    # generate the canvas
    canvas_size_x = $cell_count*total_cell_size;
    canvas_size_y = $cell_count*total_cell_size;
    canvas_size_z = $wall_height+1;
    clear_canvas;
    reset_depositor;
    set_depositor_from_number $ground_col;
    draw_base_layer;

    set_depositor_from_number $wall_col;
    iy = 0;
    repeat $cell_count {
        ix = 0;
        repeat $cell_count {
            if maze_graph[2*(ix+iy*$cell_count)+1] {
                # horz
                draw_cuboid_corner_size ix*total_cell_size, iy*total_cell_size, 0, -1-total_cell_size, $wall_thickness, canvas_size_z;
            }
            if maze_graph[2*(ix+iy*$cell_count)+2] {
                # vert
                draw_cuboid_corner_size ix*total_cell_size, iy*total_cell_size, 0, $wall_thickness, -1-total_cell_size, canvas_size_z;
            }
            ix++;
        }
        iy++;
    }

    delete maze_graph;
    require_composite = true;
}


on "gen.pipes.run" {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 8;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.7, 0.7, 0.6;
    draw_base_layer;

    repeat 100 {
        set_depositor_from_sRGB RANDOM_0_1(), RANDOM_0_1(), RANDOM_0_1();
        depositor_voxel.opacity = random(0.5, "1.0");

        random_walk_taxicab RANDOM_X, RANDOM_Y, RANDOM_Z, 20, 5;
    }

    require_composite = true;
}


on "gen.refinery.run" {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 16;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.7, 0.7, 0.6;
    draw_base_layer;

    tank_rad = 8;
    # spherical tanks
    repeat 3 {
        set_depositor_from_sRGB_value random(0.9, 1);
        
        tank_x = floor(RANDOM_X * 16)/16;
        tank_y = floor(RANDOM_Y * 16)/16;

        draw_sphere tank_x, tank_y, tank_rad/2, tank_rad;

        set_depositor_from_sRGB_value random(0.5, 1);

        random_walk_taxicab tank_x+tank_rad, tank_y, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x-tank_rad, tank_y, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x, tank_y+tank_rad, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x, tank_y-tank_rad, random(1, tank_rad/2), 12, 16;
    }
    
    require_composite = true;
}


on "gen.city.run" {
    delete UI_return;
    setting_from_id "gen.city.size_x";
    setting_from_id "gen.city.size_y";
    setting_from_id "gen.city.size_z";
    generate_city UI_return[1], UI_return[2], UI_return[3]; 
}
proc generate_city size_x, size_y, size_z {
    canvas_size_x = $size_x;
    canvas_size_y = $size_y;
    canvas_size_z = $size_z;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.7, 0.7, 0.6;
    draw_base_layer;

    local placement_fac = 1 * (canvas_size_x * canvas_size_y / 16384);

    repeat (300*placement_fac) { # cuboids and low pipes
        brightness = random(0.5, 0.9);
        set_depositor_from_sRGB brightness, brightness, brightness;

        local c1x = RANDOM_X;
        local c1y = RANDOM_Y;
        local cube_x = random(2,16);
        local cube_y = random(2,16);
        local cube_z = random(1, 15);

        draw_cuboid_corner_size c1x, c1y, 0, cube_x, cube_y, cube_z-1;
        draw_cuboid_corner_size c1x+1, c1y+1, 0, cube_x-2, cube_y-2, cube_z;
    }
    repeat (90*placement_fac) { # pipes, grey
        brightness = random(0.5, 0.7);
        set_depositor_from_sRGB brightness+random(-0.1, 0.1), brightness+random(-0.1, 0.1), brightness+random(-0.1, 0.1);
        random_walk_taxicab RANDOM_X, RANDOM_Y, random(1, 12), 16, 20;
    }
    repeat (10*placement_fac) { # pipes multicolor
        set_depositor_from_sRGB random(0.4, 0.9), random(0.4, 0.9), random(0.4, 0.9);
        random_walk_taxicab RANDOM_X, RANDOM_Y, random(1, 16), 16, 20;
    }
    repeat (10*placement_fac) { # high pipes
        set_depositor_from_sRGB random(0.4, 0.8), random(0.4, 0.8), random(0.4, 0.8);
        random_walk_taxicab RANDOM_X, RANDOM_Y, random(1, 16), 16, 20;
    }
    
    require_composite = true;
}




on "gen.wheel.run" { 
    delete UI_return;
    #setting_from_id "gen.wheel.rim_radius";
    generate_wheel 25, 9, 8; 
}
proc generate_wheel rim_radius, sidewall_height, tire_width {
    canvas_size_x = round($rim_radius + 2*$sidewall_height);
    canvas_size_y = 1;
    canvas_size_z = round($tire_width);
    clear_canvas;
    reset_depositor;
    
    # rim
    set_depositor_from_sRGB 0.7, 0.9, 0.6;
    draw_line_DDA 0, 0, 1, 1, 0, 0, $rim_radius*0.5;
    #set_depositor_from_sRGB 0.4, 0.9, 0.6;
    draw_line_DDA $rim_radius*0.5, 0, 2, $rim_radius, 0, $tire_width, $rim_radius*0.5+2; # WIP
    #set_depositor_from_sRGB 0.9, 0.9, 0.6;
    draw_column $rim_radius, 0, 0, $tire_width;

    # tire
    set_depositor_from_HSV 0.2, 0.02, 0.2;
    draw_cuboid_corner_size $rim_radius+1, 0, 0, $sidewall_height-1, 1, $tire_width;
    draw_cuboid_corner_size $rim_radius+$sidewall_height, 0, 1, 1, 1, $tire_width-2;

    glbfx_revolve 0;

    require_composite = true;
}



on "gen.carpet.run" { generate_carpet; }
proc generate_carpet {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 12;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.9, 0.9, 0.9;
    draw_base_layer;

    glbfx_color_noise "0.9", "1.1";

    repeat 100 {
        set_depositor_from_sRGB random(0, "0.2"), random(0.2, 0.9), random(0.2, 0.9);
        repeat 10 {
            draw_line_DDA RANDOM_X, RANDOM_Y, RANDOM_Z, random("-1.0","1.0"), random("-1.0","1.0"), 0, random(1, 20);
        }
        glbfx_jitter 0.003;
    }
    
    require_composite = true;
}


on "gen.weave.run" { generate_gw; }
proc generate_gw {
    canvas_size_x = 128;
    canvas_size_y = 128;
    canvas_size_z = 12;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.3, 0.6, 0.3;
    draw_base_layer;
    glbfx_color_noise 0.5, 1;

    repeat 600 {
        set_depositor_from_sRGB 0.2, random(0.2, 0.5), 0.2;
        random_walk_any RANDOM_X, RANDOM_Y, RANDOM_Z, 0, 20, 5, 45;
    }
    
    repeat 15 {
    set_depositor_from_sRGB 0.7, random(0.9, 1.0), 0.7;
        random_walk_any RANDOM_X, RANDOM_Y, RANDOM_Z, 0, 20, 5, 45;
    }
    
    require_composite = true;
}


on "gen.grad.run" { generate_grad; }
proc generate_grad {
    canvas_size_x = 101;
    canvas_size_y = 101;
    canvas_size_z = 2;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.5, 0.5, 0.5;
    draw_base_layer;

    local px_y = 0;
    repeat 101 {
        local px_x = 0;
        repeat 101 {
            set_depositor_from_HSV px_x/100, px_y/100, 1;
            set_voxel px_x, px_y, 0;
            px_x++;
        }
        px_y++;
    }
    
    require_composite = true;
}


on "fx.recolor.run" {
    delete UI_return;
    setting_from_id "fx.recolor.weight_r";
    setting_from_id "fx.recolor.weight_g";
    setting_from_id "fx.recolor.weight_b";
    setting_from_id "fx.recolor.map_0";
    setting_from_id "fx.recolor.map_1";
    setting_from_id "fx.recolor.col_0";
    setting_from_id "fx.recolor.col_1";
    setting_from_id "fx.recolor.use_sRGB";
    glbfx_recolor UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6], UI_return[7], UI_return[8];
}
# remaps colors
proc glbfx_recolor weight_r, weight_g, weight_b, map_0, map_1, col_0, col_1, use_sRGB {
    if $use_sRGB {
        # interpolate in sRGB. Assumes the map values are also sRGB values.
        local c0r = ((($col_0//65536)%256)/255);
        local c0g = ((($col_0//256)%256)/255);
        local c0b = (($col_0%256)/255);
        local c1r = ((($col_1//65536)%256)/255);
        local c1g = ((($col_1//256)%256)/255);
        local c1b = (($col_1%256)/255);
        
        i = 1;
        repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
            # get RGB converted to value

            t = canvas[i].r*$weight_r + canvas[i].g*$weight_g + canvas[i].b*$weight_b;
            t = UNLERP($map_0, $map_1, t);
            
            # clamp
            if t < 0 {
                t = 0;
            } elif t > 1 {
                t = 1;
            }

            # use fac to interpolate colours
            canvas[i].r = (LERP(c0r,c1r,t));
            canvas[i].g = (LERP(c0g,c1g,t));
            canvas[i].b = (LERP(c0b,c1b,t));
            i++;
        }
    } else {
        # interpolate in linear space. This probably isn't very useful.

        local c0r = TO_LINEAR((($col_0//65536)%256)/255);
        local c0g = TO_LINEAR((($col_0//256)%256)/255);
        local c0b = TO_LINEAR(($col_0%256)/255);
        local c1r = TO_LINEAR((($col_1//65536)%256)/255);
        local c1g = TO_LINEAR((($col_1//256)%256)/255);
        local c1b = TO_LINEAR(($col_1%256)/255);
        
        i = 1;
        repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
            # get RGB converted to value

            t = canvas[i].r*$weight_r + canvas[i].g*$weight_g + canvas[i].b*$weight_b;
            t = UNLERP($map_0, $map_1, t);
            
            # clamp
            if t < 0 {
                t = 0;
            } elif t > 1 {
                t = 1;
            }

            # use fac to interpolate colours
            canvas[i].r = FROM_LINEAR(LERP(c0r,c1r,t));
            canvas[i].g = FROM_LINEAR(LERP(c0g,c1g,t));
            canvas[i].b = FROM_LINEAR(LERP(c0b,c1b,t));
            i++;
        }
    }
    
    require_composite = true;
}




################################
#          Templates           #
################################
# Templates are used to temporarily store canvases to be loaded later or drawn by the depositor. They may be used for storing textures, shapes, etc.

proc delete_all_templates {
    delete depositor_template_metadata;
    delete depositor_template_voxels;
}

proc add_canvas_as_template {
    # TODO check if scratch and list limit reached

    # metadata
    add template_metadata { ptr:(1+length depositor_template_voxels), sx:canvas_size_x, sy:canvas_size_y, sz:canvas_size_z } to depositor_template_metadata;
    
    # copy canvas
    template_i = 1;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add canvas[template_i] to depositor_template_voxels;
        template_i++;
    }
}

proc load_template_to_canvas index {
    template_i = depositor_template_metadata[$index].ptr;

    if (template_i != "") {
        # read metadata
        canvas_size_x = depositor_template_metadata[$index].sx;
        canvas_size_y = depositor_template_metadata[$index].sy;
        canvas_size_z = depositor_template_metadata[$index].sz;

        # copy template
        delete canvas;
        repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
            add depositor_template_voxels[template_i] to canvas;
            template_i++;
        }
    }
}

# place the entire template in the canvas, intended for a small template. Uses the depositor.
proc stamp_template index, x, y, z {
    template_i = depositor_template_metadata[$index].ptr;

    if (template_i != "") {
        # read metadata
        local template_size_x = depositor_template_metadata[$index].sx;
        local template_size_y = depositor_template_metadata[$index].sy;
        local template_size_z = depositor_template_metadata[$index].sz;

        # copy template
        local px_z = floor($z);
        repeat template_size_x {
            local px_y = floor($y);
            repeat template_size_y {
                local px_x = floor($x);
                repeat template_size_z {
                    # remember that wrapping is needed:
                    local set_canvas_index = INDEX_FROM_3D_CANVAS_INTS(px_x, px_y, px_z, canvas_size_x, canvas_size_y); 
                    if (depositor_replace == true or canvas[set_canvas_index].opacity == 0) { 
                        canvas[set_canvas_index] = depositor_template_voxels[template_i];
                    }
                    px_x++;
                }
                px_y++;
            }
            px_z++;
        }
    }
}




################################
#        Set depositor         #
################################


proc reset_depositor {
    depositor_mode = DepositorMode.DRAW;
    depositor_replace = true;
    depositor_voxel = VOXEL_SOLID_GREY(1);
    depositor_template_index = 0;
    depositor_template_origin = XYZ {x:0, y:0, z:0};
}

proc set_depositor_to_air {
    depositor_mode = DepositorMode.DRAW;
    depositor_replace = true; # assumes that the user wants to erase voxels
    depositor_voxel = VOXEL_NONE;
}

proc set_depositor_from_number number {
    # number assumed to be 0-16777215
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = VOXEL_SOLID((($number//65536)%256/255), (($number//256)%256/255), ($number%256/255));
}

proc set_depositor_from_sRGB r, g, b {
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = VOXEL_SOLID($r, $g, $b);
}

proc set_depositor_from_sRGB_value value {
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = VOXEL_SOLID($value, $value, $value);
}

proc set_depositor_from_HSV h, s, v {
    local RGB col = HSV_to_RGB($h, $s, $v); 
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = VOXEL_SOLID(col.r, col.g, col.b);
}

proc set_depositor_to_template slot_index, ox, oy, oz {
    depositor_mode = DepositorMode.TEMPLATE;
    depositor_template_index = $slot_index;
    depositor_template_origin = XYZ {x:$ox, y:$oy, z:$oz};
}




# some of these may be better moved to a separate file, import them in (if the lists allow this)

################################
#             Misc             #
################################


# set a canvas voxel at a given position using the current depositor. Accounts for wrapping on X, Y
proc set_voxel x, y, z {
    if ($z >= 0 and $z < canvas_size_z) { # only set the voxel if z is in range
        local set_canvas_index = INDEX_FROM_3D_CANVAS($x, $y, $z, canvas_size_x, canvas_size_y); 

        if (depositor_replace == true or canvas[set_canvas_index].opacity == 0) { # only place if replace OR the canvas is air
            if (depositor_mode == DepositorMode.DRAW) {
                canvas[set_canvas_index] = depositor_voxel; # set voxel with brush
            } else {
                local template_sx = depositor_template_metadata[depositor_template_index].sx; # this is read multiple times so should be faster when stored in a var
                local template_sy = depositor_template_metadata[depositor_template_index].sy;
                # get the template index which is ptr + 3D index
                local tex_idx = depositor_template_metadata[depositor_template_index].ptr + INDEX_FROM_3D($x-depositor_template_origin.x, $y-depositor_template_origin.y, $z-depositor_template_origin.z, template_sx, template_sy, depositor_template_metadata[depositor_template_index].sz);
                
                canvas[set_canvas_index] = depositor_template_voxels[tex_idx];
            }
        }
    }
}


################################
#            Shapes            #
################################


on "clear canvas" { clear_canvas; } # not the same as io.new_canvas.run
proc clear_canvas  {
    delete canvas;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add VOXEL_NONE to canvas;
    }

    require_composite = true;
}


proc draw_base_layer {
    local px_y = 0;
    repeat canvas_size_y {
        local px_x = 0;
        repeat canvas_size_x {
            set_voxel px_x, px_y, 0;
            px_x++;
        }
        px_y++;
    }
    require_composite = true;
}


# draw a column of voxels either upwards or downwards (negative height allowed)
proc draw_column x, y, z, height {
    local px_z = $z;
    if $height > 0 {
        repeat $height {
            set_voxel $x, $y, px_z;
            px_z++;
        }
    } else {
        repeat abs($height) {
            set_voxel $x, $y, px_z;
            px_z += -1;
        }
    }
    
}


# draw a cylinder on the XY plane, extruded along Z. Negative height allowed.
proc draw_cylinder x, y, z, radius, height {
    local bb_width = round(2 * $radius); # bounding box width
    local bb_min = 0.5 + (bb_width * -0.5); # bounding box local minima

    local px_z = $z - (($height < 0)*round($height)); # handled differently, always start from base
    repeat round($height) {
        local px_y = bb_min;
        repeat bb_width {
            local px_x = bb_min;
            repeat bb_width {
                if VEC2_LEN(px_x, px_y) <= $radius { 
                    # the distance calculation prevents px from being stored as canvas space coordinates
                    set_voxel $x+px_x, $y+px_y, px_z;
                }
                px_x++;
            }
            px_y++;
        }
        px_z++;
    }
}



# sphere centered exactly at the given coordinates (not voxel counts)
proc draw_sphere x, y, z, radius {
    local bb_width = round(2 * $radius); # bounding box width
    local bb_min = 0.5 + (bb_width * -0.5); # bounding box local minima
    
    local px_z = bb_min;
    repeat bb_width {
        local px_y = bb_min;
        repeat bb_width {
            local px_x = bb_min;
            repeat bb_width {
                if VEC3_LEN(px_x, px_y, px_z) <= $radius { 
                    # the distance calculation prevents px from being stored as canvas space coordinates
                    set_voxel $x+px_x, $y+px_y, $z+px_z;
                }
                px_x++;
            }
            px_y++;
        }
        px_z++;
    }
}



# rectangular prism between from a corner
proc draw_cuboid_corner_size x, y, z, size_x, size_y, size_z {
    local px_z = $z;
    repeat abs(round($size_z)) {
        local px_y = $y;
        repeat abs(round($size_y)) {
            local px_x = $x;
            repeat abs(round($size_x)) {
                set_voxel px_x, px_y, px_z;
                px_x++;
            }
            px_y++;
        }
        px_z++;
    }
}


# rectangular prism centered at x,y,z
proc draw_cuboid_centered x, y, z, size_x, size_y, size_z {
    draw_cuboid_corner_size 0.5-(round($size_x)/2), 0.5-(round($size_y)/2), 0.5-(round($size_z)/2), round($size_x), round($size_y), round($size_z);
}



# randomly deposit molecules through breadth-first search
proc crystal_growth x, y, z, size_x, size_y, size_z {
    # TODO
    # store list of voxels to explore
}



# random walk in a 2D plane using taxicab movement (X and Y axis only)
proc random_walk_taxicab x, y, z, turns, steps {
    local agent_x = $x;
    local agent_y = $y;

    repeat $turns {
        if (random(0, 1) == 0) {
            if (random(0, 1) == 0) {
                repeat random(1, $steps) {
                    agent_x += 1;
                    set_voxel agent_x, agent_y, $z;
                }
            } else {
                repeat random(1, $steps) {
                    agent_x += -1;
                    set_voxel agent_x, agent_y, $z;
                }
            }
        } else {
            if (random(0, 1) == 0) {
                repeat random(1, $steps) {
                    agent_y += 1;
                    set_voxel agent_x, agent_y, $z;
                }
            } else {
                repeat random(1, $steps) {
                    agent_y += -1;
                    set_voxel agent_x, agent_y, $z;
                }
            }
        }
    }
}



# random XY walk, snapping to particular angles
proc random_walk_any x, y, z, start_dir, turns, steps, angle {
    local agent_x = $x;
    local agent_y = $y;
    local agent_dir = $start_dir;

    repeat $turns {
        local dist = random(1, $steps);
        draw_line_DDA agent_x, agent_y, $z, cos(agent_dir), sin(agent_dir), 0, dist;
        agent_x += dist * cos(agent_dir);
        agent_y += dist * sin(agent_dir);
        agent_dir += random(-1,1)*$angle;
    }
}



# 3D DDA
proc draw_line_DDA x, y, z, dx, dy, dz, r {
    local vec_len = VEC3_LEN($dx, $dy, $dz);
    local scale_x = abs(vec_len/$dx);
    local scale_y = abs(vec_len/$dy);
    local scale_z = abs(vec_len/$dz);
    local raycast_ix = floor($x);
    local raycast_iy = floor($y);
    local raycast_iz = floor($z);
    if ($dx < 0) {
        local step_x = -1;
        local len_x = (($x%1)*scale_x);
    } else {
        local step_x = 1;
        local len_x = ((1-($x%1))*scale_x);
    }
    if ($dy < 0) {
        local step_y = -1;
        local len_y = (($y%1)*scale_y);
    } else {
        local step_y = 1;
        local len_y = ((1-($y%1))*scale_y);
    }
    if ($dz < 0) {
        local step_z = -1;
        local len_z = (($z%1)*scale_z);
    } else {
        local step_z = 1;
        local len_z = ((1-($z%1))*scale_z);
    }

    until (len_x > $r and len_y > $r and len_z > $r) {
        
        set_voxel raycast_ix, raycast_iy, raycast_iz; # set voxel at current location

        # find the shortest len variable and increase it:
        if (len_x < len_z) {
            if (len_x < len_y) {
                len_x += scale_x;
                raycast_ix += step_x;
            } else {
                len_y += scale_y;
                raycast_iy += step_y;
            }
        } else {
            if (len_y < len_z) {
                len_y += scale_y;
                raycast_iy += step_y;
            } else {
                len_z += scale_z;
                raycast_iz += step_z;
            }
        }

        if (raycast_iz > canvas_size_z or raycast_iz < 0) {
            stop_this_script; # reached canvas height limits
        }
    }
}


################################
#        Global effects        #
################################
# (glbfx)


# replace exposed surfaces randomly
proc glbfx_surface_replace probability {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $probability) {
        local px_x = random(0, canvas_size_x-1);
        local px_y = random(0, canvas_size_y-1);
        local px_z = random(0, canvas_size_z-1);

        if (canvas[INDEX_FROM_3D_NOWRAP_INTS(px_x, px_y, px_z, canvas_size_x, canvas_size_y)].opacity > 0) {
            
            if (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x+1, px_y, px_z, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x-1, px_y, px_z, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y+1, px_z, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y-1, px_z, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y, px_z+1, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y, px_z-1, canvas_size_x, canvas_size_y)].opacity == 0) {
                set_voxel px_x, px_y, px_z;
            }
        }
    }
}


# deposit voxels adjacent to any non-air surface randomly
proc glbfx_spatter probability {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $probability) {
        local px_x = random(0, canvas_size_x-1);
        local px_y = random(0, canvas_size_y-1);
        local px_z = random(0, canvas_size_z-1);

        if (canvas[INDEX_FROM_3D_NOWRAP_INTS(px_x, px_y, px_z, canvas_size_x, canvas_size_y)].opacity == 0) {
            if (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x+1, px_y, px_z, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x-1, px_y, px_z, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y+1, px_z, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y-1, px_z, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y, px_z+1, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            } elif (canvas[INDEX_FROM_3D_CANVAS_INTS(px_x, px_y, px_z-1, canvas_size_x, canvas_size_y)].opacity > 0) {
                set_voxel px_x, px_y, px_z;
            }
        }
    }
}


# randomly shift voxels, swapping with neighbours
proc glbfx_jitter probability {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $probability) {
        local jitter_x = random(0, canvas_size_x-1);
        local jitter_y = random(0, canvas_size_y-1);
        local jitter_z = random(0, canvas_size_z-2); # do not cross upper boundary

        local jitter_i1 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y, jitter_z, canvas_size_x, canvas_size_y);
        if RANDOM_0_1() < 0.333 {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x+1, jitter_y, jitter_z, canvas_size_x, canvas_size_y); # x
        } elif random(0,1) == 0 {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y+1, jitter_z, canvas_size_x, canvas_size_y); # y
        } else {
            local jitter_i2 = jitter_i1 + (canvas_size_x * canvas_size_y); # z
        }

        local voxel temp_voxel = canvas[jitter_i1];
        canvas[jitter_i1] = canvas[jitter_i2];
        canvas[jitter_i2] = temp_voxel;
    }
}


# randomly average pairs of non-air voxels
proc glbfx_melt probability {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $probability) {
        local jitter_x = random(0, canvas_size_x-1);
        local jitter_y = random(0, canvas_size_y-1);
        local jitter_z = random(0, canvas_size_z-2); # do not cross upper boundary

        local jitter_i1 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y, jitter_z, canvas_size_x, canvas_size_y);
        if RANDOM_0_1() < 0.333 {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x+1, jitter_y, jitter_z, canvas_size_x, canvas_size_y); # x
        } elif random(0,1) == 0 {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y+1, jitter_z, canvas_size_x, canvas_size_y); # y
        } else {
            local jitter_i2 = jitter_i1 + (canvas_size_x * canvas_size_y); # z
        }

        if (canvas[jitter_i1].opacity > 0 and canvas[jitter_i2].opacity > 0) { # don't melt air
            canvas[jitter_i1].opacity = AVERAGE(canvas[jitter_i1].opacity, canvas[jitter_i2].opacity);
            canvas[jitter_i1].r = AVERAGE(canvas[jitter_i1].r, canvas[jitter_i2].r);
            canvas[jitter_i1].g = AVERAGE(canvas[jitter_i1].g, canvas[jitter_i2].g);
            canvas[jitter_i1].b = AVERAGE(canvas[jitter_i1].b, canvas[jitter_i2].b);
            canvas[jitter_i1].emission = AVERAGE(canvas[jitter_i1].emission, canvas[jitter_i2].emission);
            canvas[jitter_i2] = canvas[jitter_i1];
        }
    }
}


# darken voxels randomly
proc glbfx_color_noise min, max {
    local i = 1;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        canvas[i].r *= random($min, $max);
        if canvas[i].r < 0 { canvas[i].r = 0; }
        if canvas[i].r > 1 { canvas[i].r = 1; }

        canvas[i].g *= random($min, $max);
        if canvas[i].g < 0 { canvas[i].g = 0; }
        if canvas[i].g > 1 { canvas[i].g = 1; }

        canvas[i].b *= random($min, $max);
        if canvas[i].b < 0 { canvas[i].b = 0; }
        if canvas[i].b > 1 { canvas[i].b = 1; }
        
        i++;
    }
}


# take a 1 voxel thick canvas as profile and revolve on the xy plane
proc glbfx_revolve dist_offset {
    # copy the line of voxels
    delete temp_canvas;
    local row_index = 1;
    repeat (canvas_size_z) {
        ix = 0;
        repeat (canvas_size_x) {
            add canvas[row_index + ix] to temp_canvas;
            ix++;
        }
        row_index += (canvas_size_x * canvas_size_y);
    }
    local temp_width = canvas_size_x;

    # reset canvas
    delete canvas;
    canvas_size_x = temp_width * 2;
    canvas_size_y = temp_width * 2;

    # create revolution
    local bb_min = 0.5 + (canvas_size_x * -0.5);
    local row_index = 1; # offset for temp list
    repeat (canvas_size_z) {

        local iy = bb_min;
        repeat (canvas_size_y) {
            local ix = bb_min;
            repeat (canvas_size_x) {
                local dist = floor($dist_offset + VEC2_LEN(ix, iy));
                if (dist < temp_width and dist > -1) {
                    add temp_canvas[row_index + dist] to canvas;
                } else {
                    add VOXEL_NONE to canvas;
                }
                ix++;
            }
            iy++;
        }
        row_index += temp_width; # temp list does not have thickness along y
    }
    
    delete temp_canvas;
    require_composite = true;
}


proc radial_array dist_offset {
    # TODO
}



on "fx.mirror.mirror_x" { glbfx_mirror_x true; }
# copy one side to the other
proc glbfx_mirror_x keep_lower {
    # no additional list required

    iz = 0;
    repeat canvas_size_z {
        iy = 0;
        repeat canvas_size_y {
            local row_index = ((canvas_size_x * canvas_size_y) * iz) + (canvas_size_x * iy);
            ix = 0;
            if $keep_lower {
                repeat canvas_size_x//2 {
                    local source_index = row_index + ix + 1;
                    local dest_index = row_index + (canvas_size_x-ix);
                    canvas[dest_index] = canvas[source_index];
                    ix++;
                }
            } else {
                repeat canvas_size_x//2 {
                    local source_index = row_index + (canvas_size_x-ix);
                    local dest_index = row_index + ix + 1;
                    canvas[dest_index] = canvas[source_index];
                    ix++;
                }
            }
            iy++;
        }
        iz++;
    }
    
    # no rewrite or temp list required
    require_composite = true;
}

on "fx.mirror.mirror_y" { glbfx_mirror_y true; }
# copy one side to the other
proc glbfx_mirror_y keep_lower {
    # no additional list required

    iz = 0;
    repeat canvas_size_z {
        iy = 0;
        repeat canvas_size_y//2 {
            if $keep_lower {
                local source_index = INDEX_FROM_3D_NOWRAP_INTS(0, iy, iz, canvas_size_x, canvas_size_y);
                local dest_index = INDEX_FROM_3D_NOWRAP_INTS(0, canvas_size_y-1-iy, iz, canvas_size_x, canvas_size_y); 
            } else {
                local source_index = INDEX_FROM_3D_NOWRAP_INTS(0, canvas_size_y-1-iy, iz, canvas_size_x, canvas_size_y);
                local dest_index = INDEX_FROM_3D_NOWRAP_INTS(0, iy, iz, canvas_size_x, canvas_size_y); 
            }
            repeat canvas_size_x {
                canvas[dest_index] = canvas[source_index];
                source_index++;
                dest_index++;
            }
            iy++;
        }
        iz++;
    }
    
    # no rewrite or temp list required
    require_composite = true;
}

