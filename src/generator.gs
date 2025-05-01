%include common/common.gs;

costumes "costumes/blank.svg" as "blank";
hide;

# The following lists are named by purpose and can be shared by any generator procedure.
list maze_graph;
list custom_grid;
list eca_lut;
list temp_canvas_mono; # temporary single channel canvas
list voxel temp_canvas; # temporary voxel canvas
list stack; # stack for recursion

on "initalise" {
    hide;
}

on "hard reset" {
    delete maze_graph;
    delete custom_grid;
    delete eca_lut;
    delete temp_canvas_mono;
    delete temp_canvas;
    delete stack;
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
    
    # no yield - no custom block needed
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


on "gen.ballpit.run" {
    delete UI_return;
    setting_from_id "gen.ballpit.size_x";
    setting_from_id "gen.ballpit.size_y";
    setting_from_id "gen.ballpit.size_z";
    setting_from_id "gen.ballpit.ground_col";

    setting_from_id "gen.ballpit.radius_min";
    setting_from_id "gen.ballpit.radius_max";
    setting_from_id "gen.ballpit.density";
    setting_from_id "gen.ballpit.ball_target_col";
    setting_from_id "gen.ballpit.variance_hue";
    setting_from_id "gen.ballpit.variance_sat";
    setting_from_id "gen.ballpit.variance_val";
    setting_from_id "gen.ballpit.variance_opacity";
    setting_from_id "gen.ballpit.variance_glow";
    generate_ballpit UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6], UI_return[7], UI_return[8], UI_return[9], UI_return[10], UI_return[11], UI_return[12], UI_return[13]; 
}
%define AVG_VOL_OF_SPHERE(RAD1,RAD2) (1.04719755 * (((RAD2*RAD2*RAD2*RAD2)-(RAD1*RAD1*RAD1*RAD1))/(RAD2*RAD1)))
proc generate_ballpit size_x, size_y, size_z, ground_col, rad_min, rad_max, density, ball_col, var_hue, var_sat, var_val, var_opacity, var_glow {
    canvas_size_x = $size_x;
    canvas_size_y = $size_y;
    canvas_size_z = $size_z;
    clear_canvas;
    reset_depositor;
    set_depositor_from_number $ground_col;
    draw_base_layer;

    repeat ($density * ((canvas_size_x * canvas_size_y * canvas_size_z)/AVG_VOL_OF_SPHERE($rad_min, $rad_max))) {
        set_depositor_from_number $ball_col;
        randomise_depositor_by_HSV $var_hue, $var_sat, $var_val;
        depositor_voxel.opacity = 1-random("0.0", $var_opacity);
        set_depositor_glow $var_glow;

        local radius = round(random($rad_min, $rad_max)*2)/2;
        local height = round(canvas_size_z-1-radius-random(0, canvas_size_z-(2*radius)));
        draw_sphere random(1, canvas_size_x), random(1, canvas_size_y), POSITIVE_CLAMP(height), radius;
    }
}


on "gen.city.run" {
    delete UI_return;
    setting_from_id "gen.city.size_x";
    setting_from_id "gen.city.size_y";
    setting_from_id "gen.city.size_z";
    setting_from_id "gen.city.ground_col";
    generate_city UI_return[1], UI_return[2], UI_return[3], UI_return[4]; 
}
proc generate_city size_x, size_y, size_z, ground_col {
    canvas_size_x = $size_x;
    canvas_size_y = $size_y;
    canvas_size_z = $size_z;
    clear_canvas;
    reset_depositor;
    set_depositor_from_number $ground_col;
    draw_base_layer;

    local placement_fac = 1 * (canvas_size_x * canvas_size_y / 16384);

    repeat (300*placement_fac) { # cuboids and low pipes
        brightness = random(0.5, 0.9);
        set_depositor_from_sRGB brightness, brightness, brightness;

        local c1x = RANDOM_X();
        local c1y = RANDOM_Y();
        local cube_x = random(2,16);
        local cube_y = random(2,16);
        local cube_z = random(1, 15);

        draw_cuboid_corner_size c1x, c1y, 0, cube_x, cube_y, cube_z-1;
        draw_cuboid_corner_size c1x+1, c1y+1, 0, cube_x-2, cube_y-2, cube_z;
    }
    repeat (90*placement_fac) { # pipes, grey
        brightness = random(0.5, 0.7);
        set_depositor_from_sRGB brightness+random(-0.1, 0.1), brightness+random(-0.1, 0.1), brightness+random(-0.1, 0.1);
        random_walk_taxicab RANDOM_X(), RANDOM_Y(), random(1, 12), 16, 20;
    }
    repeat (10*placement_fac) { # pipes multicolor
        set_depositor_from_sRGB random(0.4, 0.9), random(0.4, 0.9), random(0.4, 0.9);
        random_walk_taxicab RANDOM_X(), RANDOM_Y(), random(1, 16), 16, 20;
    }
    repeat (10*placement_fac) { # high pipes
        set_depositor_from_sRGB random(0.4, 0.8), random(0.4, 0.8), random(0.4, 0.8);
        random_walk_taxicab RANDOM_X(), RANDOM_Y(), random(1, 16), 16, 20;
    }
    
    require_composite = true;
}

on "gen.control_panel.run" {
    delete UI_return;
    setting_from_id "gen.control_panel.cell_count_x";
    setting_from_id "gen.control_panel.cell_count_y";
    setting_from_id "gen.control_panel.cell_size";
    setting_from_id "gen.control_panel.panel_color";
    generate_control_panel UI_return[1], UI_return[2], UI_return[3], UI_return[4]; 
}
%define CSZ(FRAC) canvas_size_z*(FRAC)
proc generate_control_panel cells_x, cells_y, cell_size, panel_color {
    canvas_size_x = $cells_x * $cell_size;
    canvas_size_y = $cells_y * $cell_size;
    canvas_size_z = MAX(2, $cell_size);
    clear_canvas;
    reset_depositor;
    set_depositor_from_number $panel_color;
    draw_base_layer;
    #draw_cuboid_corner_size 0, 0, 0, canvas_size_x, canvas_size_y, 1;
    
    delete custom_grid; # a list of rectangles
    create_custom_grid_recursive_rectangles 0, 0, $cells_x, $cells_y;
    
    i = 0;
    repeat (length custom_grid / 5) {
        # debug colours
        set_depositor_from_HSV custom_grid[i+5], RANDOM_0_1(), 1;
        draw_cuboid_corner_size custom_grid[i+1]*$cell_size, custom_grid[i+2]*$cell_size, 0, custom_grid[i+3]*$cell_size, custom_grid[i+4]*$cell_size, 1;

        if (custom_grid[i+3] == 1 and custom_grid[i+4] == 1) {
            local origin_x = round((custom_grid[i+1]+0.5)*$cell_size);
            local origin_y = round((custom_grid[i+2]+0.5)*$cell_size);

            if (RANDOM_0_1() < 0.2) {
                # Push button

                # collar
                set_depositor_from_sRGB_value 0.3;
                draw_cylinder origin_x, origin_y, 0, $cell_size*0.4, CSZ(0.5);
                # button surface
                set_depositor_from_HSV random(0,5)/6, random(3,5)/6, random(3,5)/6;
                
                if (RANDOM_0_1() < 0.5) { # chamfered
                    draw_cylinder_chamfered origin_x, origin_y, 0, $cell_size*0.3, CSZ(0.8), CSZ(0.1);
                } else {
                    draw_cylinder origin_x, origin_y, 0, $cell_size*0.3, CSZ(0.8);
                }
            } elif (RANDOM_0_1() < 0.3) {
                # Light

                # collar
                set_depositor_from_sRGB_value 0.3;
                draw_cylinder origin_x, origin_y, 0, $cell_size*0.3, CSZ(0.3);
                # button surface
                set_depositor_from_HSV random(0,5)/6, random(3,5)/6, random(3,5)/6;
                depositor_voxel.emission = random("0.5", "0.8");
                draw_sphere origin_x, origin_y, CSZ(0.3), $cell_size*0.25;
            }
        }
        
        i += 5;
    }
    
}


proc create_custom_grid_recursive_rectangles x, y, size_x, size_y {
    delete stack;
    add $x to stack;
    add $y to stack;
    add $size_x to stack;
    add $size_y to stack;
    add RANDOM_0_1() to stack;
    add 0 to stack;

    until (length stack == 0) {
        if (RANDOM_0_1() < POW(stack[6]/12, 2)) {
            # emit rectangle because life ran out or size is too small
            add stack[1] to custom_grid;
            add stack[2] to custom_grid;
            add stack[3] to custom_grid;
            add stack[4] to custom_grid;
            add stack[5] to custom_grid;
        } else {
            # try splitting (must be run in a loop in the root rect)
            if (RANDOM_0_1() < 0.5) {
                # split x
                local split_position = round(stack[3] * random("0.25", "0.75"));
                add_custom_grid_rect stack[1], stack[2], split_position, stack[4], RANDOM_0_1(), stack[6]+1;
                add_custom_grid_rect stack[1]+split_position, stack[2], stack[3]-split_position, stack[4], RANDOM_0_1(), stack[6]+1;
            } else {
                # split y
                local split_position = round(stack[4] * random("0.25", "0.75"));
                add_custom_grid_rect stack[1], stack[2], stack[3], split_position, RANDOM_0_1(), stack[6]+1;
                add_custom_grid_rect stack[1], stack[2]+split_position, stack[3], stack[4]-split_position, RANDOM_0_1(), stack[6]+1;
            }
        }
        delete stack[1];
        delete stack[1];
        delete stack[1];
        delete stack[1];
        delete stack[1];
        delete stack[1];
    }
}
proc add_custom_grid_rect x, y, size_x, size_y, seed, depth {
    if ($size_x < 1 or $size_y < 1) {
        stop_this_script; # invalid rectangle, don't use it
    }
    add $x to stack;
    add $y to stack;
    add $size_x to stack;
    add $size_y to stack;
    add $seed to stack;
    add $depth to stack;
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
                #set_voxel ix, (canvas_size_y-1), 0;
                draw_column ix, (canvas_size_y-2)-iy, 0, canvas_size_z;
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


on "gen.erosion.run.generate" {
    delete UI_return;
    setting_from_id "gen.erosion.size_x";
    setting_from_id "gen.erosion.size_y";
    setting_from_id "gen.erosion.size_z";
    setting_from_id "gen.erosion.scale";
    setting_from_id "gen.erosion.ground_col";
    generate_terrain UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5];
}
proc generate_terrain size_x, size_y, size_z, scale, color {
    canvas_size_x = $size_x;
    canvas_size_y = $size_y;
    canvas_size_z = $size_z;
    clear_canvas;
    reset_depositor;
    
    generate_value_noise $size_x, $size_y, $scale, 8, false; # doesn't write to the canvas

    # convert height into rock formation
    set_depositor_from_number $color;
    local HSV col = RGB_to_HSV(depositor_voxel.r, depositor_voxel.g, depositor_voxel.b);

    i = 1;
    iy = 0;
    repeat canvas_size_y {
        ix = 0;
        repeat canvas_size_x {
            set_depositor_from_HSV col.h+random("-0.05","0.05"), col.s+random("-0.05","0.05"), col.v+random("-0.1","0.1");
            draw_column ix, iy, 0, (temp_canvas_mono[i] * canvas_size_z);
            ix++;
            i++;
        }
        iy++;
    }
    delete temp_canvas_mono;

    require_composite = true;
}


on "gen.erosion.run.finalise" {
    delete UI_return;
    setting_from_id "gen.erosion.water_level_fac";
    setting_from_id "gen.erosion.water_col";
    setting_from_id "gen.erosion.grass_fac";
    setting_from_id "gen.erosion.grass_col";
    setting_from_id "gen.erosion.tree_fac";
    finalise_terrain UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5];
}
proc finalise_terrain water_level_fac, water_col, grass_fac, grass_col, tree_fac {
    # search every voxel and add water
    reset_depositor;
    set_depositor_from_number $water_col;
    depositor_replace = false;
    draw_cuboid_corner_size 0, 0, 0, canvas_size_x, canvas_size_y, canvas_size_z * $water_level_fac;
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
            set_depositor_glow $glow;
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


on "gen.nucleus.run" {
    delete UI_return;
    setting_from_id "gen.nucleus.radius";
    setting_from_id "gen.nucleus.size_z";
    setting_from_id "gen.nucleus.ground_col";

    generate_nucleus UI_return[1], UI_return[2], UI_return[3];
}
proc generate_nucleus radius, size_z, ground_col {
    # first create a section on the XZ plane
    canvas_size_x = $radius;
    canvas_size_y = 1;
    canvas_size_z = $size_z;
    clear_canvas;
    reset_depositor;
    set_depositor_from_number $ground_col;

    # TODO probability distributions
    local radius = $radius * random("0.4", "0.8");
    repeat (0.2 * canvas_size_x) { # cuboids
        set_depositor_from_HSV RANDOM_0_1(), random("0.0", "0.1"), RANDOM_0_1();

        local c1x = random(0, radius);
        local cube_x = random(2, canvas_size_x*0.2);
        local cube_z = random(0, (canvas_size_z*0.8));
        draw_cuboid_corner_size c1x, 0, 0, cube_x, 1, cube_z-1;
        draw_cuboid_corner_size c1x+1, 0, 0, cube_x-2, 1, cube_z;
    }
    repeat (0.1 * canvas_size_x) { # pipes, grey
        set_depositor_from_HSV RANDOM_0_1(), random("0.0", "0.1"), random("0.5", "0.7");
        set_voxel random(0, canvas_size_x*0.8), 0, random(1, canvas_size_z-2);
    }
    repeat (0.05 * canvas_size_x) { # pipes multicolor
        set_depositor_from_HSV RANDOM_0_1(), random("0.1", "0.8"), random("0.4", "1.0");
        set_voxel random(0, canvas_size_x*0.8), 0, random(1, canvas_size_z-1);
    }
    repeat (0.05 * canvas_size_x) { # pipes
        set_depositor_from_HSV RANDOM_0_1(), random("0.4", "0.6"), random("0.4", "0.8");
        set_voxel random(0, canvas_size_x*0.8), 0, random(1, canvas_size_z-1);
    }

    # perform global effects including revolve to make a square canvas
    glbfx_color_noise 0.95, 1.05;
    glbfx_jitter 0.01, 0;
    glbfx_revolve 0;

    # draw the base layer to fill the void
    set_depositor_from_HSV RANDOM_0_1(), random("0.0", "0.1"), RANDOM_0_1();
    draw_base_layer;

    # radial pipes low
    local turn = random(0,2)*45; # turn angle for random walk
    local steps = random(1,12);
    set_depositor_from_HSV RANDOM_0_1(), random("0.0", "0.1"), RANDOM_0_1();
    repeat (random("0.0", "0.02") * canvas_size_x * canvas_size_y) {
        local dist = random(0, canvas_size_x*1.3); # random walk start distance from center
        local rot = RANDOM_ANGLE();
        random_walk_any (canvas_size_x/2)+dist*cos(rot), (canvas_size_y/2)+dist*sin(rot), random(0, canvas_size_z*0.2), rot, steps, canvas_size_x*random("0.05", "0.1"), turn;
    }

    # add radial pipes
    local turn = random(0,2)*45; # turn angle for random walk
    local steps = random(1,5);
    local dist = random(0, canvas_size_x*0.5); # random walk start distance from center
    local elev_min = random(0, canvas_size_z-2);
    local elev_max = random(0, canvas_size_z-2);
    
    if (random(0,1)) { # set colour
        set_depositor_from_HSV RANDOM_0_1(), random("0.0", "0.8"), RANDOM_0_1();
    } else {
        set_depositor_from_sRGB RANDOM_0_1(), RANDOM_0_1(), RANDOM_0_1();
    }
    repeat (random("0.0", "6.0")*dist) {
        local rot = RANDOM_ANGLE();
        random_walk_any (canvas_size_x/2)+dist*cos(rot), (canvas_size_y/2)+dist*sin(rot), random(elev_min, elev_max), rot, steps, canvas_size_x*random("0.05", "0.1"), turn;
    }
    
    require_composite = true;
}


on "gen.fibres.run" {
    delete UI_return;
    setting_from_id "gen.fibres.size_x";
    setting_from_id "gen.fibres.size_y";
    setting_from_id "gen.fibres.size_z";

    setting_from_id "gen.fibres.density";
    setting_from_id "gen.fibres.cluster_count";
    setting_from_id "gen.fibres.cluster_radius";
    setting_from_id "gen.fibres.segment_length";
    setting_from_id "gen.fibres.segment_count";
    setting_from_id "gen.fibres.segment_angle";

    setting_from_id "gen.fibres.col1";
    setting_from_id "gen.fibres.col2";
    setting_from_id "gen.fibres.col3";

    generate_fibres UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6], UI_return[7], UI_return[8], UI_return[9], UI_return[10], UI_return[11], UI_return[12];
}
proc generate_fibres size_x, size_y, size_z, density, cl_count, cl_rad, seg_len, seg_count, seg_angle, col1, col2, col3 {
    canvas_size_x = $size_x;
    canvas_size_y = $size_y;
    canvas_size_z = $size_z;
    clear_canvas;
    reset_depositor;
    if RANDOM_0_1() < 0.5 {
        set_depositor_from_number_lerp $col1, $col2, RANDOM_0_1();
    } else {
        set_depositor_from_number_lerp $col2, $col3, RANDOM_0_1();
    }
    draw_base_layer;

    repeat ($density) * (canvas_size_x*canvas_size_y) {
        if RANDOM_0_1() < 0.5 {
            set_depositor_from_number_lerp $col1, $col2, RANDOM_0_1();
        } else {
            set_depositor_from_number_lerp $col2, $col3, RANDOM_0_1();
        }

        local px_x = RANDOM_X();
        local px_y = RANDOM_Y();
        local px_z = RANDOM_Z();
        repeat $cl_count {
            random_walk_any px_x+($cl_rad*random("-1.0","1.0")), px_y+($cl_rad*random("-1.0","1.0")), px_z, random("0.0","360.0"), $seg_count, $seg_len, $seg_angle;
        }
    }
    
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

        random_walk_taxicab RANDOM_X(), RANDOM_Y(), RANDOM_Z(), 20, 5;
    }

    require_composite = true;
}


on "gen.refinery.run" { generate_refinery; }
proc generate_refinery {
    canvas_size_x = 64;
    canvas_size_y = 64;
    canvas_size_z = 16;
    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.7, 0.7, 0.6;
    draw_base_layer;

    local tank_rad = 8;
    # spherical tanks
    repeat 3 {
        set_depositor_from_sRGB_value random(0.9, 1);
        
        local tank_x = floor(RANDOM_X() * 16)/16;
        local tank_y = floor(RANDOM_Y() * 16)/16;

        draw_sphere tank_x, tank_y, tank_rad/2, tank_rad;

        set_depositor_from_sRGB_value random(0.5, 1);

        random_walk_taxicab tank_x+tank_rad, tank_y, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x-tank_rad, tank_y, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x, tank_y+tank_rad, random(1, tank_rad/2), 12, 16;
        random_walk_taxicab tank_x, tank_y-tank_rad, random(1, tank_rad/2), 12, 16;
    }
    
    require_composite = true;
}


on "gen.value_noise.run" {
    delete UI_return;
    setting_from_id "gen.value_noise.size_x";
    setting_from_id "gen.value_noise.size_y";
    setting_from_id "gen.value_noise.scale";
    setting_from_id "gen.value_noise.octaves";
    generate_value_noise UI_return[1], UI_return[2], UI_return[3], UI_return[4], true;
}

# 2D value noise
proc generate_value_noise size_x, size_y, scale, octaves, write_to_canvas {
    delete temp_canvas_mono; # output canvas, single channel
    repeat ($size_x * $size_y) {
        add 0.5 to temp_canvas_mono; # use 0.5 as middle value
    }
    
    local range = 0.25;
    local target_scale = $scale;
    repeat $octaves {
        if target_scale > 0.5 { # only add layer if larger than half a pixel
            local last_range = range;

            # noise "layer"
            local grid_size_x = round($size_x/target_scale);
            local grid_size_y = round($size_y/target_scale);

            delete custom_grid; # source grid values
            repeat (grid_size_x * grid_size_y) {
                add random(-range, range) to custom_grid;
            }
            
            # loop over every voxel and sample the grid
            local offset_x = RANDOM_0_1() * ($size_x/grid_size_x) * (grid_size_x != $size_x); # decorrelate the layer
            i = 1;
            local px_y = RANDOM_0_1() * ($size_y/grid_size_y) * (grid_size_y != $size_y);
            repeat $size_y {
                local px_x = offset_x;
                repeat $size_x {
                    local gx = px_x*(grid_size_x/$size_x);
                    local gy = px_y*(grid_size_y/$size_y);
                    local val_BL = custom_grid[INDEX_FROM_2D(gx, gy, grid_size_x, grid_size_y)];
                    local val_BR = custom_grid[INDEX_FROM_2D(gx+1, gy, grid_size_x, grid_size_y)];
                    local val_TL = custom_grid[INDEX_FROM_2D(gx, gy+1, grid_size_x, grid_size_y)];
                    local val_TR = custom_grid[INDEX_FROM_2D(gx+1, gy+1, grid_size_x, grid_size_y)];
                    
                    # bilinear interpolation
                    local val_B = LERP(val_BL,val_BR,(gx%1));
                    local val_T = LERP(val_TL,val_TR,(gx%1));
                    temp_canvas_mono[i] += LERP(val_B,val_T,(gy%1));

                    i++;
                    px_x++;
                }
                px_y++;
            }

            # update for next noise layer
            range *= 0.5;
            target_scale /= 2; # lacunarity
        }
    }
    delete custom_grid;

    # get value and normalise 0-1
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        local val = (temp_canvas_mono[i]-last_range) / (1-last_range*2); 
        temp_canvas_mono[i] = CLAMP_0_1(val);
        i++;
    }

    # write the to the real canvas
    if $write_to_canvas {
        canvas_size_x = $size_x;
        canvas_size_y = $size_y;
        canvas_size_z = 1;
        clear_canvas;
        reset_depositor;

        i = 1;
        repeat (canvas_size_x * canvas_size_y) {
            canvas[i].r = temp_canvas_mono[i];
            canvas[i].g = temp_canvas_mono[i];
            canvas[i].b = temp_canvas_mono[i];
            canvas[i].opacity = 1;
            i++;
        }
        delete temp_canvas_mono; # delete mono list because its data is now in the canvas
        require_composite = true;
    }
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


on "gen.test.run" { generate_test; }
proc generate_test {
    canvas_size_x = 100;
    canvas_size_y = 64;
    canvas_size_z = 10;

    clear_canvas;
    reset_depositor;
    set_depositor_from_sRGB 0.8, 0.8, 0.8;
    draw_base_layer;

    repeat (20) { # pipes multicolor
        set_depositor_from_sRGB random(0.4, 0.9), random(0.4, 0.9), random(0.4, 0.9);
        random_walk_taxicab RANDOM_X(), RANDOM_Y(), random(0, 2), 16, 20;
    }



    local sz = 12;
    # draw various shapes for testing
    i = 0;
    repeat 8 {
        set_depositor_from_sRGB 1, 1, 1;
        depositor_voxel.opacity = 1-(i/8);
        draw_cuboid_corner_size i*sz, sz*0, 5, sz, sz, sz;
        i++;
    }
    i = 0;
    repeat 8 {
        set_depositor_from_sRGB 1, 0, 0;
        depositor_voxel.opacity = 1-(i/8);
        draw_cuboid_corner_size i*sz, sz*1, 5, sz, sz, sz;
        i++;
    }
    i = 0;
    repeat 8 {
        set_depositor_from_sRGB 0, 0, 0;
        depositor_voxel.opacity = 1-(i/8);
        draw_cuboid_corner_size i*sz, sz*2, 5, sz, sz, sz;
        i++;
    }
    set_depositor_from_sRGB 0.2, 0.9, 0.5;
    depositor_voxel.opacity = 0.5;
    draw_sphere 20, 50, 0, 10;


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
    depositor_voxel = VOXEL_SOLID((($number//65536)%256/255), (($number//256)%256/255), (($number%256)/255));
}

# random blend between 2 colors
proc set_depositor_from_number_lerp number1, number2, t {
    # number assumed to be 0-16777215
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = VOXEL_SOLID((($number1//65536)%256/255), (($number1//256)%256/255), (($number1%256)/255));
    
    depositor_voxel.r = LERP(depositor_voxel.r, (($number2//65536)%256/255), $t);
    depositor_voxel.g = LERP(depositor_voxel.g, (($number2//256)%256/255), $t);
    depositor_voxel.b = LERP(depositor_voxel.b, (($number2%256)/255), $t);
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

proc randomise_depositor_by_HSV range_h, range_s, range_v {
    local HSV col = RGB_to_HSV(depositor_voxel.r, depositor_voxel.g, depositor_voxel.b);
    set_depositor_from_HSV col.h+(random("-1.0","1.0")*$range_h), col.s+(random("-1.0","1.0")*$range_s), col.v+(random("-1.0","1.0")*$range_v);
}

proc set_depositor_glow glow_intensity {
    if (random("0.0", "2.0") < $glow_intensity) {
        depositor_voxel.emission = random("0.0", random($glow_intensity, "1.0")); # "glow"
    }
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
            set_voxel px_x, px_y, 0; # depositor is in use
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


# Draw a cylinder on the XY plane, extruded along Z. Negative height allowed.
# TODO make it work with fractions. The cylinder should use the center of voxel for dist comparison and origin should not be moved
proc draw_cylinder x, y, z, radius, height {
    local bb_width = ceil(2 * $radius); # bounding box width
    local bb_min = 0.5 + floor(bb_width * -0.5); # bounding box local minima

    local px_z = $z - (($height < 0)*round($height)); # always start from minimum z and extrude upwards
    repeat (round($height)) {
        local px_y = bb_min;
        repeat bb_width {
            local px_x = bb_min;
            repeat bb_width {
                if (VEC2_LEN(px_x, px_y) <= $radius) { 
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


# Draw a cylinder with the top chamfered.
proc draw_cylinder_chamfered x, y, z, radius, height, chamfer {
    local px_z = $z - (($height < 0)*round($height)); # always start from minimum z and extrude upwards
    draw_cylinder $x, $y, $z, $radius, $height-round($chamfer);
    px_z += ($height-round($chamfer));
    local reduction = 1;
    repeat (round($chamfer)) {
        draw_cylinder $x, $y, px_z, $radius-reduction, 1;
        px_z++;
        reduction++;
    }
}



# sphere centered exactly at the given coordinates (not voxel counts)
proc draw_sphere x, y, z, radius {
    local bb_width = ceil(2 * $radius); # bounding box width
    local bb_min = 0.5 + floor(bb_width * -0.5); # bounding box local minima
    
    local px_z = bb_min;
    repeat bb_width {
        local px_y = bb_min;
        repeat bb_width {
            local px_x = bb_min;
            repeat bb_width {
                if (VEC3_LEN(px_x, px_y, px_z) <= $radius) { 
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



# rectangular prism between from minimum corner
proc draw_cuboid_corner_size x, y, z, size_x, size_y, size_z {
    local px_z = $z;
    repeat (round($size_z)) {
        local px_y = $y;
        repeat (round($size_y)) {
            local px_x = $x;
            repeat (round($size_x)) {
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
proc glbfx_surface_replace coverage {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $coverage) {
        local px_x = RANDOM_X();
        local px_y = RANDOM_Y();
        local px_z = RANDOM_Z();

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
    require_composite = true;
}


# deposit voxels adjacent to any non-air surface randomly
proc glbfx_spatter coverage {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $coverage) {
        local px_x = RANDOM_X();
        local px_y = RANDOM_Y();
        local px_z = RANDOM_Z();

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
    require_composite = true;
}


on "fx.jitter.run" {
    delete UI_return;
    setting_from_id "fx.jitter.coverage";
    setting_from_id "fx.jitter.probability_z";
    glbfx_jitter UI_return[1], UI_return[2];
}
# randomly shift voxels, swapping with neighbours
proc glbfx_jitter coverage, probability_z {
    local max_index = (canvas_size_x * canvas_size_y * canvas_size_z)+1;
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $coverage) {
        # randomly choosing voxels means a column of air is possible. This is intentional. 40 minutes was wasted debugging correct behaviour.
        local jitter_x = RANDOM_X();
        local jitter_y = RANDOM_Y();
        local jitter_z = random(0, canvas_size_z-2); # Do not cross upper boundary

        local jitter_i1 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y, jitter_z, canvas_size_x, canvas_size_y);
        if RANDOM_0_1() < $probability_z {
            local jitter_i2 = jitter_i1 + (canvas_size_x * canvas_size_y); # z
        } elif random(0,1) == 0 {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x+1, jitter_y, jitter_z, canvas_size_x, canvas_size_y); # x
        } else {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y+1, jitter_z, canvas_size_x, canvas_size_y); # y
        }

        if (jitter_i1 > 0 and jitter_i2 < max_index) {
            local voxel temp_voxel = canvas[jitter_i1];
            canvas[jitter_i1] = canvas[jitter_i2];
            canvas[jitter_i2] = temp_voxel;
        }
    }
    require_composite = true;
}


on "fx.smudge.run" {
    delete UI_return;
    setting_from_id "fx.smudge.coverage";
    setting_from_id "fx.smudge.probability_z";
    glbfx_smudge UI_return[1], UI_return[2];
}
# randomly average pairs of non-air voxels
proc glbfx_smudge coverage, probability_z {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $coverage) {
        local jitter_x = RANDOM_X();
        local jitter_y = RANDOM_Y();
        local jitter_z = random(0, canvas_size_z-2); # Do not cross upper boundary

        local jitter_i1 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y, jitter_z, canvas_size_x, canvas_size_y);
        if RANDOM_0_1() < $probability_z {
            local jitter_i2 = jitter_i1 + (canvas_size_x * canvas_size_y); # z
        } elif random(0,1) == 0 {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x+1, jitter_y, jitter_z, canvas_size_x, canvas_size_y); # x
        } else {
            local jitter_i2 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y+1, jitter_z, canvas_size_x, canvas_size_y); # y
        }

        if (canvas[jitter_i1].opacity > 0 and canvas[jitter_i2].opacity > 0) { # don't smudge air
            canvas[jitter_i1].opacity = MEAN(canvas[jitter_i1].opacity, canvas[jitter_i2].opacity);
            canvas[jitter_i1].r = MEAN(canvas[jitter_i1].r, canvas[jitter_i2].r);
            canvas[jitter_i1].g = MEAN(canvas[jitter_i1].g, canvas[jitter_i2].g);
            canvas[jitter_i1].b = MEAN(canvas[jitter_i1].b, canvas[jitter_i2].b);
            canvas[jitter_i1].emission = MEAN(canvas[jitter_i1].emission, canvas[jitter_i2].emission);
            canvas[jitter_i2] = canvas[jitter_i1];
        }
    }
    require_composite = true;
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
    require_composite = true;
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



