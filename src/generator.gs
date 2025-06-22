%include lib/common

costumes "costumes/generator/icon.svg" as "icon";
hide;

# The following lists are named by purpose and can be used by any generator procedure.
list custom_graph;
list custom_grid;
list custom_lut;
list temp_canvas_mono; # temporary single channel canvas
list voxel temp_canvas; # temporary voxel canvas
list stack;
list agents;

on "initalise" {
    hide;
}


on "sys.hard_reset" {
    delete custom_graph;
    delete custom_grid;
    delete custom_lut;
    delete temp_canvas_mono;
    delete temp_canvas;
    delete stack;
    delete agents;
}


on "io.new_canvas.run"{
    delete UI_return;
    setting_from_id "io.new_canvas.size_x";
    setting_from_id "io.new_canvas.size_y";
    setting_from_id "io.new_canvas.size_z";
    setting_from_id "io.new_canvas.include_base";
    setting_from_id "io.new_canvas.base_col";
    
    # no yield - no custom block needed
    reset_generator UI_return[1], UI_return[2], UI_return[3];
    
    if UI_return[4] {
        set_depositor_from_number UI_return[5];
        draw_base_layer;
    }
    generator_finished;
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
    setting_from_id "gen.ballpit.variance_glow";
    generate_ballpit UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6], UI_return[7], UI_return[8], UI_return[9], UI_return[10], UI_return[11], UI_return[12]; 
}
%define AVG_VOL_OF_SPHERE(RAD1,RAD2) (1.04719755 * (((RAD2*RAD2*RAD2*RAD2)-(RAD1*RAD1*RAD1*RAD1))/(RAD2*RAD1)))
proc generate_ballpit size_x, size_y, size_z, ground_col, rad_min, rad_max, density, ball_col, var_hue, var_sat, var_val, var_glow {
    reset_generator $size_x, $size_y, $size_z;

    set_depositor_from_number $ground_col;
    draw_base_layer;

    repeat ($density * ((canvas_size_x * canvas_size_y * canvas_size_z)/AVG_VOL_OF_SPHERE($rad_min, $rad_max))) {
        set_depositor_from_number $ball_col;
        randomise_depositor_by_HSV $var_hue, $var_sat, $var_val;
        set_depositor_glow $var_glow;

        local radius = round(random($rad_min, $rad_max)*2)/2;
        local height = round(canvas_size_z-1-radius-random(0, canvas_size_z-(2*radius)));
        draw_sphere random(1, canvas_size_x), random(1, canvas_size_y), POSITIVE_CLAMP(height), radius;
    }
    generator_finished;
}


on "gen.pcb.run" {
    delete UI_return;
    setting_from_id "gen.pcb.size_x";
    setting_from_id "gen.pcb.size_y";
    setting_from_id "gen.pcb.seamless";
    setting_from_id "gen.pcb.substrate_col";
    setting_from_id "gen.pcb.trace_col";
    setting_from_id "gen.pcb.via_col";
    generate_pcb UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6];
}
proc generate_pcb size_x, size_y, seamless, substrate_col, trace_col, via_col {
    reset_generator $size_x, $size_y, 4;
    set_depositor_from_number $trace_col; # unetched copper
    draw_base_layer;

    # create bitmap for tracking where the etch is. First place components on unetched surface, etching for each. Also spawn in a bunch of traces to random walk.
    delete custom_grid;
    repeat (canvas_size_x * canvas_size_y) {
        add 0 to custom_grid; # 0 = unetched copper, 1 = etched, 2 = unetched trace
    }
    if ($seamless == 0) {
        # add a ring around the edge to prevent things from being placed there
        i = 1;
        repeat (canvas_size_x-1) {
            custom_grid[i] = 1;
            i++;
        }
        repeat (canvas_size_y-1) {
            custom_grid[i] = 1;
            i += canvas_size_x;
        }
        repeat (canvas_size_x-1) {
            custom_grid[i] = 1;
            i--;
        }
        repeat (canvas_size_y-1) {
            custom_grid[i] = 1;
            i -= canvas_size_x;
        }
    }

    delete agents; # traces storing: x, y, direction, steps left

    # place the large IC components
    repeat (0.5*(canvas_size_x+canvas_size_y)) {
        _try_place_IC RANDOM_X(), RANDOM_Y(), random(2, 8), PROBABILITY(0.5), random(2, 8), PROBABILITY(0.5);
    }

    # now increment the random walk traces simultaneously
    # etch as it goes until it can no longer go further, etch its finish and add a via. If it collides with another trace without passing through already etched sides, connect them together.
    set_depositor_from_number $substrate_col;
    i = 1;
    repeat (length agents / 4) {
        _trace agents[i], agents[i+1], agents[i+2], agents[i+3], random(0.05,0.2)*(canvas_size_x+canvas_size_y), $via_col;
        i += 4;
    }


    # copy custom grid etch to canvas
    set_depositor_from_number $substrate_col;
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        if (custom_grid[i] == 1) {
            canvas[i].r = depositor_voxel.r;
            canvas[i].g = depositor_voxel.g;
            canvas[i].b = depositor_voxel.b;
        }
        # only draw etch, not any of the other states as they are assumed drawn already
        i++;
    }

    # done
    delete custom_grid;
    delete agents;

    generator_finished;
}
proc _try_place_IC x, y, size_x, has_legs_x, size_y, has_legs_y {
    if (($has_legs_x + $has_legs_y) == 0) {
        # try again because there were no legs
        _try_place_IC $x, $y, $size_x, PROBABILITY(0.5), $size_y, PROBABILITY(0.5);
        stop_this_script;
    }

    # check if the grid is vacant (all cells have copper plus 1 cell margin, plus 2 cells either side if needed for traces)
    local bb_start_y = $y-2;
    local bb_start_x = $x-2;
    local bb_size_x = ($size_x*2)+3+4;
    local bb_size_y = ($size_y*2)+3+4;
    if (custom_grid[INDEX_FROM_2D(bb_start_y+bb_size_y, bb_start_y+bb_size_y, canvas_size_x, canvas_size_y)] > 0) {
        # optimisation by checking the opposite corner as a quick way to abandon it
        stop_this_script; # not vacant
    }

    iy = bb_start_y;
    repeat (bb_size_y) {
        ix = bb_start_x;
        repeat (bb_size_x) {
            if (custom_grid[INDEX_FROM_2D(ix, iy, canvas_size_x, canvas_size_y)] > 0) {
                stop_this_script; # not vacant, do not draw component
            }
            ix++;
        }
        iy++;
    }

    # fill grid
    iy = $y;
    repeat (($size_y*2)+3) {
        ix = $x;
        repeat (($size_x*2)+3) {
            custom_grid[INDEX_FROM_2D(ix, iy, canvas_size_x, canvas_size_y)] = 1;
            ix++;
        }
        iy++;
    }

    # draw component and spawn in the traces
    # plastic housing
    iz = random(2,3);
    set_depositor_from_sRGB_value 0.2;
    draw_cuboid_corner_size $x+1, $y+1, 1, ($size_x*2)+1, ($size_y*2)+1, iz;
    if (PROBABILITY(0.5)) { # text
        set_depositor_from_sRGB_value 0.23;
        bb_size_x = ($size_x*2)-5;
        bb_size_y = ($size_y*2)-5;
        draw_rectangle_fill_random_centered_XY $x+2+$size_x, $y+2+$size_y, iz, MIN(5, bb_size_x), MIN(5, bb_size_y), 0.8;
    }

    # soldered legs
    set_depositor_from_sRGB_value 0.7;
    if ($has_legs_x) {
        i = $size_y*-0.5;
        iy = $y+2;
        repeat ($size_y) {
            set_voxel $x, iy, 1;
            set_voxel $x+($size_x*2)+2, iy, 1;
            _add_agent $x, iy, 4, random(1, 2+round(($size_y/2)-i));
            _add_agent $x+($size_x*2)+2, iy, 0, random(1, 2+round(($size_y/2)-i));
            iy += 2;
            i++;
        }
    }
    if ($has_legs_y) {
        i = $size_x*-0.5;
        ix = $x+2;
        repeat ($size_x) {
            set_voxel ix, $y, 1;
            set_voxel ix, $y+($size_y*2)+2, 1;
            _add_agent ix, $y, 6, random(1, 2+round(($size_x/2)-i));
            _add_agent ix, $y+($size_y*2)+2, 2, random(1, 2+round(($size_x/2)-i));
            ix += 2;
            i++;
        }
    }
}

proc _add_agent x, y, dir, len {
    # binary search insertion
    local agent_min = 1;
    local agent_max = length agents + 1;
    until (agent_min == agent_max) {
        local agent_i = (agent_min + agent_max) // 2;
        if ($len < agents[agent_i*4]) {
            agent_min = agent_i + 1;
        } else {
            agent_max = agent_i;
        }
    }
    agent_i = agent_min*4-3;
    insert $len at agents[agent_i]; # insert backwards to keep correct order
    insert $dir at agents[agent_i];
    insert $y at agents[agent_i];
    insert $x at agents[agent_i];
    custom_grid[INDEX_FROM_2D($x, $y, canvas_size_x, canvas_size_y)] = 2;
}

proc _trace x, y, dir, no_turn_len, length_remaining, via_col {
    set_depositor_from_sRGB RANDOM_0_1(), RANDOM_0_1(), 1; # TESTING
    local steps = 0; # counted steps
    ix = $x;
    iy = $y;
    
    agent_dir = $dir;
    agent_dx = round(cos(agent_dir*45));
    agent_dy = round(sin(agent_dir*45));
    local can_place_smc = true;

    # add etch along sides at start
    _try_etch ix-agent_dy, iy+agent_dx;
    _try_etch ix+agent_dy, iy-agent_dx;
    if (agent_dir % 2 == 1) {
        _try_etch ix-agent_dx, iy;
        _try_etch ix, iy-agent_dy;
    }
    
    local length_remaining = $length_remaining;
    repeat (length_remaining) {
        local trace_i = INDEX_FROM_2D(ix+agent_dx, iy+agent_dy, canvas_size_x, canvas_size_y);
        if (steps < $no_turn_len) {
            if (custom_grid[trace_i] > 0) {
                # blocked, add via (if reached etch)
                if (custom_grid[trace_i] == 1) {
                    _cap_trace $via_col;
                }
                stop_this_script; # no turning allowed
            }
        } else {
            # typical movement, check for blockage or chance of change in direction
            if (custom_grid[trace_i] > 0 or PROBABILITY(0.3)) {

                local attempted_turn = (random(0,1)*2-1);
                if (custom_grid[INDEX_FROM_2D(ix+round(cos((agent_dir+attempted_turn)*45)), iy+round(sin((agent_dir+attempted_turn)*45)), canvas_size_x, canvas_size_y)] == 0) {
                    _trace ix, iy, agent_dir+attempted_turn, 2, length_remaining, $via_col;

                } else {
                    if (custom_grid[INDEX_FROM_2D(ix+round(cos((agent_dir-attempted_turn)*45)), iy+round(sin((agent_dir-attempted_turn)*45)), canvas_size_x, canvas_size_y)] == 0) {
                        _trace ix, iy, agent_dir-attempted_turn, 2, length_remaining, $via_col;
                        
                    } else {
                        # completely blocked, add via
                        set_depositor_from_number $via_col;
                        set_voxel ix, iy, 0;
                        custom_grid[INDEX_FROM_2D(ix, iy, canvas_size_x, canvas_size_y)] = 2;
                    }
                }
                stop_this_script;
            }
        }

        # no blockage, step forward as usual
        custom_grid[trace_i] = 2;

        ix += agent_dx;
        iy += agent_dy;

        # add etch along sides
        _try_etch ix-agent_dy, iy+agent_dx;
        _try_etch ix+agent_dy, iy-agent_dx;
        if (agent_dir % 2 == 1) {
            _try_etch ix-agent_dx, iy;
            _try_etch ix, iy-agent_dy;
        }

        steps++;
        length_remaining--;

        # add a small surface mount component (e.g. resistor, capacitor, diode)
        if (can_place_smc and PROBABILITY(0.2)) {
            if (steps > 5 and agent_dir % 2 == 0) {
                set_depositor_from_sRGB_value 0.7; # solder
                set_voxel ix, iy, 1;
                set_voxel ix-(agent_dx*3), iy-(agent_dy*3), 1;
                
                if (PROBABILITY(0.5)) {
                    set_depositor_from_sRGB_value 0.3; # grey component
                } else {
                    set_depositor_from_sRGB 0.75, 0.65, 0.55; # tan component
                }
                set_voxel ix-agent_dx, iy-agent_dy, 1;
                set_voxel ix-(agent_dx*2), iy-(agent_dy*2), 1;
                can_place_smc = false;
            }
        }

    }
    
    _cap_trace $via_col; # too long
}

proc _try_etch x, y {
    local etch_i = INDEX_FROM_2D($x, $y, canvas_size_x, canvas_size_y);
    if (custom_grid[etch_i] == 0) {
        custom_grid[etch_i] = 1;
    }
}

proc _cap_trace via_col {
    set_depositor_from_number $via_col;
    set_voxel ix, iy, 0;
    
    custom_grid[INDEX_FROM_2D(ix, iy, canvas_size_x, canvas_size_y)] = 2;
    _try_etch ix+agent_dx, iy+agent_dy;
    if (agent_dir % 2 == 1) {
        _try_etch ix+agent_dx, iy;
        _try_etch ix, iy+agent_dy;
    } else {
        _try_etch ix-agent_dy+agent_dx, iy+agent_dx+agent_dy;
        _try_etch ix+agent_dy+agent_dx, iy-agent_dx+agent_dy;
    }
}



on "gen.city.run" {
    delete UI_return;
    setting_from_id "gen.city.size_x";
    setting_from_id "gen.city.size_y";
    setting_from_id "gen.city.size_z";
    setting_from_id "gen.city.buildings";
    setting_from_id "gen.city.bridges";
    setting_from_id "gen.city.glow";
    generate_city UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6];
}
proc generate_city size_x, size_y, size_z, buildings, bridges, glow {
    # template 1: pavement with dot
    reset_generator 2, 2, 1;
    set_depositor_from_sRGB_value random(0.5, 0.6);
    draw_base_layer;
    set_depositor_from_sRGB_value random(0.5, 0.6);
    set_voxel 0, 0, 0;
    add_canvas_as_template;

    # template 2: skyscraper
    clear_canvas 2, 2, 2;
    set_depositor_from_sRGB_value 0.45;
    draw_base_layer;
    set_depositor_from_sRGB_value 0.4;
    draw_cuboid_corner_size 0, 0, 1, 2, 2, 1;
    set_depositor_from_sRGB 0.4, 0.4, 0.41;
    set_voxel 0, 0, 0;
    set_voxel 1, 1, 0;
    set_depositor_from_sRGB 0.4, 0.4, 0.43;
    set_voxel 0, 0, 1;
    set_voxel 1, 1, 1;
    add_canvas_as_template;

    # template 3: skyscraper sandwich
    clear_canvas 1, 1, 2;
    set_depositor_from_sRGB_value 0.65;
    set_voxel 0, 0, 0;
    set_depositor_from_sRGB 0.6, 0.6, 0.64;
    set_voxel 0, 0, 1;
    add_canvas_as_template;

    # template 4: dither
    clear_canvas 2, 2, 2;
    set_depositor_from_sRGB_value 0.62;
    draw_cuboid_corner_size 0, 0, 0, 2, 2, 2;
    set_depositor_from_sRGB_value 0.52;
    set_voxel 0, 0, 0;
    set_voxel 1, 1, 0;
    set_voxel 1, 0, 1;
    set_voxel 0, 1, 1;
    add_canvas_as_template;

    # template 5: dither with air
    clear_canvas 2, 2, 2;
    set_depositor_from_sRGB_value random(0.4, 0.6);
    set_voxel 0, 0, 0;
    set_voxel 1, 1, 0;
    set_voxel 1, 0, 1;
    set_voxel 0, 1, 1;
    add_canvas_as_template;

    ###

    clear_canvas $size_x, $size_y, $size_z;
    local placement_fac = (canvas_size_x * canvas_size_y) * 1;


    # pavement
    set_depositor_from_sRGB_value 0.7;
    draw_base_layer;

    # patches of dot pavement
    set_depositor_to_template 1, random(0,1), random(0,1), 0;
    repeat (placement_fac * 0.005) {
        draw_cuboid_corner_size RANDOM_X(), RANDOM_Y(), 0, random(2,16), random(2,16), 1;
    }

    # dithered screens
    repeat (placement_fac * 0.005 * $buildings) {
        set_depositor_to_template 5, random(1,4), random(0,1), random(0,1);

        if (PROBABILITY(0.33)) {
            # horizontal
            draw_cuboid_corner_size RANDOM_X(), RANDOM_Y(), random(1,5), random(2,8), random(2,8), 1;
        } else {
            if (PROBABILITY(0.5)) {
                # x
                draw_cuboid_corner_size RANDOM_X(), RANDOM_Y(), random(1,3), random(2,8), 1, random(2,5);
            } else {
                # y
                draw_cuboid_corner_size RANDOM_X(), RANDOM_Y(), random(1,3), 1, random(2,8), random(2,5);
            }
        }
    }
    
    # pavement lights
    repeat (placement_fac * 0.01 * $buildings * $glow) {
        local c1x = RANDOM_X();
        local c1y = RANDOM_X();
        set_depositor_from_sRGB_value 0.4;
        set_voxel c1x, c1y, 1;
        set_voxel c1x, c1y, 4;
        set_depositor_from_HSV RANDOM_0_1(), RANDOM_0_1(), 1;
        depositor_voxel.emission = 1;
        set_voxel c1x, c1y, 2;
        set_voxel c1x, c1y, 3;
    }

    # street cuboids
    repeat (placement_fac * 0.015 * $buildings) {
        local c1x = RANDOM_X();
        local c1y = RANDOM_X();
        local dx = random(2,12);
        local dy = random(2,12);

        set_depositor_from_sRGB_value random(0.2, 0.9);
        draw_cuboid_corner_size c1x, c1y, 0, dx, dy, random(4,6);

        if (PROBABILITY(0.2 * $glow)) {
            set_depositor_from_HSV RANDOM_0_1(), RANDOM_0_1(), 1;
            depositor_voxel.emission = 1;
            draw_cuboid_corner_size c1x, c1y, random(1,2), dx, dy, 1;
        }
    }

    # low sky bridges
    repeat (placement_fac * 0.003 * $bridges) {
        set_depositor_from_HSV RANDOM_0_1(), random(0.0, 0.4), random(0.2, 0.7);
        depositor_replace = false;
        random_walk_any RANDOM_X(), RANDOM_Y(), random(3,5), random(0,7)*45, random(2,4), random(5,32), 45;
    }

    # skyscrapers
    repeat (placement_fac * 0.008 * $buildings) {
        local c1x = RANDOM_X();
        local c1y = RANDOM_X();
        local c1z = random(3,6);
        local dx = random(2,12);
        local dy = random(2,12);
        local dz = random(3, canvas_size_z-c1z-2);

        # lobby
        if (PROBABILITY(0.2 * $glow)) {
            set_depositor_from_HSV RANDOM_0_1(), RANDOM_0_1(), 1;
            depositor_voxel.emission = 1;
        } else {
            set_depositor_from_sRGB_value random(0.2, 0.9);
        }
        if (dx-4 < 1 or dy-4 < 1) {
            # same size as main structure because it's thin
            draw_cuboid_corner_size c1x, c1y, 0, dx, dy, c1z;
        } else {
            draw_cuboid_corner_size c1x+2, c1y+2, 0, dx-4, dy-4, c1z;
        }
        
        # columns
        if PROBABILITY(0.5) {
            set_depositor_from_sRGB_value random(0.2, 0.9);
            draw_column c1x, c1y, 0, c1z;
            draw_column c1x+dx-1, c1y, 0, c1z;
            draw_column c1x, c1y+dy-1, 0, c1z;
            draw_column c1x+dx-1, c1y+dy-1, 0, c1z;
        }

        # main
        if (PROBABILITY(0.3)) {
            set_depositor_from_sRGB_value random(0.2, 0.9);
        } else {
            set_depositor_to_template random(1,4), random(0,1), random(0,1), 0; # use any template
        }
        draw_cuboid_corner_size c1x, c1y, c1z, dx, dy, dz;

        # roof
        if (PROBABILITY(0.5)) {
            # indent
            set_depositor_to_air;
            draw_cuboid_corner_size c1x+1, c1y+1, c1z+dz-1, dx-2, dy-2, 2;

        } else {
            set_depositor_from_sRGB_value random(0.2, 0.6);
            local offset = random(0, 1);
            draw_cuboid_corner_size c1x+offset, c1y+offset, c1z+dz, dx-offset*2, dy-offset*2, 1;
        }

        # glow band
        if (PROBABILITY(0.1 * $glow)) {
            set_depositor_from_HSV RANDOM_0_1(), RANDOM_0_1(), 1;
            depositor_voxel.emission = 1;
            draw_cuboid_corner_size c1x, c1y, random(c1z, c1z+dz-3), dx, dy, 1;
        }
    }
    
    generator_finished;
}



on "gen.control_panel.run" {
    delete UI_return;
    setting_from_id "gen.control_panel.cell_count_x";
    setting_from_id "gen.control_panel.cell_count_y";
    setting_from_id "gen.control_panel.cell_size";
    setting_from_id "gen.control_panel.repetition_fac";
    setting_from_id "gen.control_panel.panel_color";
    setting_from_id "gen.control_panel.accent1";
    setting_from_id "gen.control_panel.accent2";
    generate_control_panel UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6], UI_return[7]; 
}
proc generate_control_panel cells_x, cells_y, cell_size, repetition_fac, panel_color, accent1, accent2 {
    # template 1: mesh
    reset_generator 2, 2, 1;
    set_depositor_from_number $panel_color;
    set_voxel 0, 0, 0;
    set_voxel 1, 1, 0;
    add_canvas_as_template;

    # template 2: louvres
    clear_canvas 1, 2, 1;
    set_depositor_from_number $panel_color;
    set_voxel 0, 0, 0;
    add_canvas_as_template;

    # template 4: gauge
    clear_canvas 10, 6, 2;
    set_depositor_from_number_lerp 8355711, $accent1, 0.9;
    draw_base_layer;
    set_depositor_from_number_lerp 8355711, $accent1, 0.85;
    draw_cuboid_corner_size 1, 0, 0, 1, 2, 1;
    draw_cuboid_corner_size 3, 0, 0, 1, 2, 1;
    draw_cuboid_corner_size 5, 0, 0, 1, 2, 1;
    draw_cuboid_corner_size 7, 0, 0, 1, 2, 1;
    set_depositor_from_number_lerp 8355711, $accent1, 0.82;
    draw_cuboid_corner_size 9, 0, 0, 1, 4, 1;
    add_canvas_as_template;

    # template 5: slider grip
    clear_canvas 1, 2, 1;
    set_depositor_from_number_lerp 8355711, $accent2, 0.8;
    set_voxel 0, 0, 0;
    set_depositor_from_number_lerp 8355711, $accent2, 0.75;
    set_voxel 0, 1, 0;
    add_canvas_as_template;

    ###

    local cell_size = MAX(4, $cell_size);
    
    clear_canvas $cells_x*cell_size, $cells_y*cell_size, cell_size;

    set_depositor_from_number_lerp 0, $panel_color, 0.5;
    draw_cuboid_corner_size 0, 0, 0, canvas_size_x, canvas_size_y, 1;
    set_depositor_from_number $panel_color;
    draw_cuboid_corner_size 0, 0, 1, canvas_size_x, canvas_size_y, 1;
    
    delete custom_grid; # a list of rectangles
    create_custom_grid_recursive_rectangles 0, 0, $cells_x, $cells_y, RANDOM_0_1(), $repetition_fac, $repetition_fac;
    

    i = 0;
    repeat (length custom_grid / 5) {
        # debug colors
        #set_depositor_from_HSV custom_grid[i+5], 1.0, random("0.8", "0.9");
        #set_voxel custom_grid[i+1]*$cell_size, custom_grid[i+2]*$cell_size, 1;
        #draw_cuboid_corner_size custom_grid[i+1]*$cell_size, custom_grid[i+2]*$cell_size, 1, custom_grid[i+3]*$cell_size, custom_grid[i+4]*$cell_size, 1;

        control_panel_draw_element cell_size, custom_grid[i+1], custom_grid[i+2], custom_grid[i+3], custom_grid[i+4], custom_grid[i+5], $panel_color, $accent1, $accent2;
        
        i += 5;
    }
    
    generator_finished;
}

%define CSZ(FRAC) ($cell_size*(FRAC))
proc control_panel_draw_element cell_size, grid_x, grid_y, grid_size_x, grid_size_y, seed, panel_color, accent1, accent2 {
    local center_x = ($grid_x+($grid_size_x/2))*$cell_size;
    local center_y = ($grid_y+($grid_size_y/2))*$cell_size;
    local size_x = $grid_size_x*$cell_size;
    local size_y = $grid_size_y*$cell_size;
    local radius_x = size_x / 2;
    local radius_y = size_y / 2;

    # arguments are in canvas space with x and y being centered
    if ($grid_size_x == 1 and $grid_size_y == 1) {
        
        if (($seed*13.3654) % 1 < 0.2) {
            # Push button
            set_depositor_from_number $accent1;
            draw_cylinder center_x, center_y, 0, CSZ(0.4), CSZ(0.5);
            set_depositor_from_HSV (($seed*76.121)%6)/6, (($seed*16.126)%3)/3, (3+($seed*53.321)%3)/6;
            draw_cylinder center_x, center_y, 0, CSZ(0.3), CSZ(0.6);
            stop_this_script;
        }
        if (($seed*61.7658) % 1 < 0.3) {
            # Light bulb
            set_depositor_from_number $accent1;
            draw_cylinder center_x, center_y, 0, CSZ(0.3), CSZ(0.3);
            if (($seed*47.2123) % 1 < 0.5) {
                set_depositor_from_HSV (($seed*19.562)%6)/6, 3+(($seed*4.411)%2)/6, 1;
                depositor_voxel.emission = 1;
            } else {
                set_depositor_from_HSV (($seed*54.752)%6)/6, 1+(($seed*4.411)%2)/12, 1+(($seed*5.791)%2)/6;
            }
            draw_sphere center_x, center_y, CSZ(0.3), CSZ(0.2);
            stop_this_script;
        }

    } elif ($grid_size_x == 1 and $grid_size_y > 2) {
        if (($seed*25.3411) % 1 < 0.2) {
            # vertical slider
            set_depositor_to_air;
            draw_cuboid_centered_XY center_x, center_y, 1, CSZ(0.2), (radius_y*2)-CSZ(0.4), 1;
            # grip
            set_depositor_to_template 4, 0, 0, 0;
            draw_cuboid_centered_XY center_x, center_y+random(-0.5, 0.5)*(radius_y-CSZ(0.4)), 2, CSZ(0.4), CSZ(0.6), 2;
            stop_this_script;
        }
    }

    if (($seed*21.2121) % 1 < 0.15) {
        # create raised area
        set_depositor_from_voxel center_x, center_y, 1;
        if (depositor_voxel.opacity < 1) {
            set_depositor_from_number $panel_color;
        }
        draw_cuboid_centered_XY center_x, center_y, 2, (radius_x*2)-CSZ(0.2), (radius_y*2)-CSZ(0.2), 1;
        if (($seed*6.9642) % 1 < 0.3) {
            # port
            set_depositor_to_air;
            if (($seed*58.323) % 1 < 0.3) {
                draw_cylinder center_x, center_y, 1, MIN(radius_x, radius_y)*0.4, 2;
            } else {
                draw_cuboid_centered_XY center_x, center_y, 1, (radius_x*2)*RANDOM_0_1()*0.4, (radius_y*2)*RANDOM_0_1()*0.4, 2;
            }
        }
        stop_this_script;
    }
    if (($seed*7.3247) % 1 < 0.15) {
        # create depressed area
        set_depositor_from_voxel center_x, center_y, 1;
        if (depositor_voxel.opacity < 1) {
            set_depositor_from_number $panel_color;
        }
        draw_cuboid_centered_XY center_x, center_y, 0, (radius_x*2)-CSZ(0.2), (radius_y*2)-CSZ(0.2), 1;
        set_depositor_to_air;
        draw_cuboid_centered_XY center_x, center_y, 1, (radius_x*2)-CSZ(0.2), (radius_y*2)-CSZ(0.2), 1;
        stop_this_script;
    }
    if (($seed*9.1942) % 1 < 0.1) {
        # create mesh
        set_depositor_to_template 1, center_x, center_y, 0;
        draw_cuboid_centered_XY center_x, center_y, 1, (radius_x*2)-CSZ(0.2), (radius_y*2)-CSZ(0.2), 1;
        stop_this_script;
    }
    if (($seed*18.0841) % 1 < 0.2) {
        # create louvres
        set_depositor_to_template 2, center_x, center_y, 0;
        draw_cuboid_centered_XY center_x, center_y, 1, (radius_x*2)-CSZ(0.2), (radius_y*2)-CSZ(0.2), 1;
        stop_this_script;
    }

    if ($grid_size_x > 1 and $grid_size_y == 1) {
        if (($seed*42.1234) % 1 < 0.15) {
            # create horizontal gauge
            set_depositor_to_template 3, center_x, ($grid_y+0.3)*$cell_size, 0; # TODO set origin
            draw_cuboid_centered_XY center_x, center_y, 0, (radius_x*2)-CSZ(0.3), (radius_y*2)-CSZ(0.3), 2;
            stop_this_script;
        }
    }

    if (($seed*94.3114) % 1 < 0.3) {
        # colored panel
        set_depositor_to_air;
        draw_cuboid_centered_XY center_x, center_y, 1, (radius_x*2), (radius_y*2), 1;
        
        set_depositor_from_number_lerp $accent2, $panel_color, 0.2;
        draw_cuboid_centered_XY center_x, center_y, 1, (radius_x*2)-2, (radius_y*2)-2, 1;
        stop_this_script;
    }
}


# create a recursively subdivided grid of rectangles, outputted to the list `custom_grid`
proc create_custom_grid_recursive_rectangles x, y, size_x, size_y, seed, probability_half, probability_similar {
    delete stack;
    local hash = $seed;
    add_custom_grid_rect $x, $y, $size_x, $size_y, hash, 0;

    until (length stack == 0) {
        hash = ((stack[5]*4672.87427 % 2.45497) + stack[5]*15.2139) % 1;
        if (hash < POW(stack[6]/18, 2)) {
            # emit rectangle because life ran out or size is too small
            add stack[1] to custom_grid;
            add stack[2] to custom_grid;
            add stack[3] to custom_grid;
            add stack[4] to custom_grid;
            add stack[5] to custom_grid;
            # depth isn't outputted
        } else {
            # try splitting (must be run in a loop in the root rect)
            if (((stack[5]*721.9324) % 1) < 0.5) {
                # split x
                if ((((stack[5]*304.3259) % 1) < $probability_half) and (stack[3] % 2 == 0)) {
                    # divide in half perfectly
                    local split_position = round(stack[3] / 2);
                    hash = ((stack[4]*3623.5411 % 3.4329) + stack[4]*603.1771 + stack[5]*19.3937 + 0.78712) % 1;
                    add_custom_grid_rect stack[1], stack[2], split_position, stack[4], hash, stack[6]+1;
                    add_custom_grid_rect stack[1]+split_position, stack[2], stack[3]-split_position, stack[4], hash, stack[6]+1;
                } elif (((stack[5]*907.2345) % 1) < $probability_similar) {
                    # split anywhere
                    local split_position = round(stack[3] * 0.25+((stack[5]*163.9334) % 0.5));
                    add_custom_grid_rect stack[1], stack[2], split_position, stack[4], ((stack[5]*585.5398) % 1), stack[6]+1;
                    add_custom_grid_rect stack[1]+split_position, stack[2], stack[3]-split_position, stack[4], ((stack[5]*777.043) % 1), stack[6]+1;
                } else {
                    # split randomly anywhere
                    local split_position = round(stack[3] * 0.25+((stack[5]*578.9234) % 0.5));
                    add_custom_grid_rect stack[1], stack[2], split_position, stack[4], RANDOM_0_1(), stack[6]+1;
                    add_custom_grid_rect stack[1]+split_position, stack[2], stack[3]-split_position, stack[4], RANDOM_0_1(), stack[6]+1;
                }
                
            } else {
                # split y
                if ((((stack[5]*396.1209) % 1) < $probability_half) and (stack[4] % 2 == 0)) {
                    # divide in half perfectly
                    local split_position = round(stack[4] / 2);
                    hash = ((stack[4]*4122.1877 % 1.3471) + stack[4]*3.4401 + stack[5]*318.7991 + 0.21347) % 1;
                    add_custom_grid_rect stack[1], stack[2], stack[3], split_position, hash, stack[6]+1;
                    add_custom_grid_rect stack[1], stack[2]+split_position, stack[3], stack[4]-split_position, hash, stack[6]+1;
                } elif (((stack[5]*965.3475) % 1) < $probability_similar) {
                    # split anywhere
                    local split_position = round(stack[4] * 0.25+((stack[5]*241.3661) % 0.5));
                    add_custom_grid_rect stack[1], stack[2], stack[3], split_position, ((stack[5]*169.5327) % 1), stack[6]+1;
                    add_custom_grid_rect stack[1], stack[2]+split_position, stack[3], stack[4]-split_position, ((stack[5]*371.5121) % 1), stack[6]+1;
                } else {
                    # split randomly anywhere
                    local split_position = round(stack[3] * 0.25+((stack[5]*7435.3425) % 0.5));
                    add_custom_grid_rect stack[1], stack[2], stack[3], split_position, RANDOM_0_1(), stack[6]+1;
                    add_custom_grid_rect stack[1], stack[2]+split_position, stack[3], stack[4]-split_position, RANDOM_0_1(), stack[6]+1;
                }
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
    reset_generator $size_x, $size_y, 1 + $extrude_z;

    set_depositor_from_number $state_0_col;
    draw_base_layer;
    set_depositor_from_number $state_1_col;

    # generate the lookup table (convert rule to binary)
    delete custom_lut;
    local remaining = floor($rule);
    repeat 8 {
        add 1-((remaining % 2)<1) to custom_lut;
        remaining /= 2;
    }

    # generate the initial state
    delete custom_grid;
    ix = 0;
    if $random_start {
        repeat canvas_size_x {
            if (PROBABILITY(0.5)) {
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
            if custom_lut[1 + \
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
    delete custom_lut;
    generator_finished;
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
    reset_generator 1, 1, $size_z; # column defining rock strata
    set_depositor_from_number $color;
    local HSV col = RGB_to_HSV(depositor_voxel.r, depositor_voxel.g, depositor_voxel.b);
    iz = 0;
    repeat ($size_z) {
        set_depositor_from_HSV col.h+random("-0.05","0.05"), col.s+random("-0.05","0.05"), col.v+random("-0.1","0.1");
        set_voxel 0, 0, iz;
        iz++;
    }
    add_canvas_as_template; # template 1

    clear_canvas $size_x, $size_y, $size_z;
    generate_value_noise canvas_size_x, canvas_size_y, $scale, 8, false; # doesn't write to the canvas

    # remap noise
    i = 1;
    repeat (canvas_size_x * canvas_size_y) {
        temp_canvas_mono[i] = (((temp_canvas_mono[i] * 1.6) - 0.3) * canvas_size_z);
        if (temp_canvas_mono[i] < 1) {
            temp_canvas_mono[i] = 1;
        }
        i++;
    }

    # convert height into rock formation
    set_depositor_to_template 1, 0, 0, 0;
    temp_canvas_mono_to_canvas;
    delete temp_canvas_mono;

    generator_finished;
}

proc temp_canvas_mono_to_canvas {
    i = 1;
    iy = 0;
    repeat (canvas_size_y) {
        ix = 0;
        repeat (canvas_size_x) {
            draw_column ix, iy, 0, temp_canvas_mono[i];
            ix++;
            i++;
        }
        iy++;
    }
}


on "gen.erosion.run.erode" {
    delete UI_return;
    setting_from_id "gen.erosion.steps";
    setting_from_id "gen.erosion.capacity";
    setting_from_id "gen.erosion.strength";
    erode UI_return[1], UI_return[2], UI_return[3];
}
proc erode steps, capacity, strength {
    create_erosion_lut 2;

    # convert canvas into temp_canvas_mono representing heights
    # it was originally planned to move around real voxels but that's too expensive, even for turbowarp
    delete temp_canvas_mono;
    layer_size = (canvas_size_x * canvas_size_y);
    i = 1;
    repeat layer_size {
        iz = canvas_size_z-1;
        until ((iz < 0) or (canvas[i + (iz * layer_size)].opacity > 0)) {
            iz += -1;
        }
        add iz+1 to temp_canvas_mono;
        i++;
    }

    # create flows
    repeat ((canvas_size_x * canvas_size_y) * $steps) {
        erode_flow RANDOM_X(), RANDOM_Y(), $capacity, $capacity*$strength;
    }

    # update the terrain by removing air where necessary and adding voxels

    i = 1;
    iy = 0;
    repeat (canvas_size_y) {
        ix = 0;
        repeat (canvas_size_x) {
            set_depositor_to_air;
            iz = canvas_size_z-1;
            repeat (canvas_size_z-temp_canvas_mono[i]) {
                set_voxel ix, iy, iz;
                iz += -1;
            }
            # now search down until solid is found
            #repeat (temp_canvas_mono[i]) {
            #    set_voxel ix, iy, iz;
            #    iz += -1;
            #}

            #draw_column ix, iy, 0, temp_canvas_mono[i];
            ix++;
            i++;
        }
        iy++;
    }
    
    #delete temp_canvas_mono;

    generator_finished;
}


proc create_erosion_lut radius {
    delete custom_lut;

    # create grid
    local radius = ceil($radius);
    local sum = 0;
    iy = -radius;
    repeat (1+radius*2) {
        ix = -radius;
        repeat (1+radius*2) {
            local val = $radius - VEC2_LEN(ix, iy);
            if (val > 0) {
                add ix to custom_lut;
                add iy to custom_lut;
                add val to custom_lut;
                sum += val;
            }
            ix++;
        }
        iy++;
    }

    # normalise to 1
    i = 3;
    repeat (length custom_lut / 3) {
        custom_lut[i] /= sum;
        i += 3;
    }
}


# heightmap of the topmost non-transparent voxel, normalised to greyscale 0-1
%define FLOW_KERNEL_X(DX,DY,WX) \
agent_dx += WX*(temp_canvas_mono[INDEX_FROM_2D_INTS(agent_x+(DX), agent_y, canvas_size_x, canvas_size_y)] - h);

%define FLOW_KERNEL_Y(DX,DY,WY) \
agent_dy += WY*(temp_canvas_mono[INDEX_FROM_2D_INTS(agent_x, agent_y+(DY), canvas_size_x, canvas_size_y)] - h);

%define FLOW_KERNEL_XY(DX,DY,WX,WY) \
local kernel_h = (temp_canvas_mono[INDEX_FROM_2D_INTS(agent_x+(DX), agent_y+(DY), canvas_size_x, canvas_size_y)] - h);\
agent_dx += WX*kernel_h;\
agent_dy += WY*kernel_h;\

%define W_EDGE 0.5
%define W_CORNER 0.25



proc erode_flow x, y, capacity, strength {
    agent_x = $x;
    agent_y = $y;
    local current_capacity = $capacity;
    
    local speed = 0;
    local evaporation_rate = $strength;
    local sediment = 0;
    local capacity_fac = 0;
    local capacity_fac_change = 5 / (current_capacity / evaporation_rate);
    repeat (current_capacity // evaporation_rate) {
        #log agent_x & "," & agent_y;
        agent_i = INDEX_FROM_2D_NOWRAP_INTS(agent_x, agent_y, canvas_size_x);
        
        # 3D terrain generator method
        _terr_change sediment - (capacity_fac * current_capacity);
        sediment += (capacity_fac * current_capacity) - sediment;

        current_capacity -= evaporation_rate;

        #log sediment & "/" & current_capacity;

        # pick a way to move (but only move at the end after erosion, so erosion doesn't affect direction)
        local agent_dx = 0;
        local agent_dy = 0;
        local h = temp_canvas_mono[agent_i];

        # x
        FLOW_KERNEL_X(-1,0,W_EDGE)
        FLOW_KERNEL_X(1,0,-W_EDGE)
        
        # y
        FLOW_KERNEL_Y(0,-1,W_EDGE)
        FLOW_KERNEL_Y(0,1,-W_EDGE)

        # corners
        FLOW_KERNEL_XY(1,1,-W_CORNER,-W_CORNER)
        FLOW_KERNEL_XY(-1,1,W_CORNER,-W_CORNER)
        FLOW_KERNEL_XY(1,-1,-W_CORNER,W_CORNER)
        FLOW_KERNEL_XY(-1,-1,W_CORNER,W_CORNER)

        # move
        speed = VEC2_LEN(agent_dx, agent_dy);
        if (speed < 0.1) {
            _terr_change sediment; # might be unnecessary
            stop_this_script;
        }

        # find new location
        local new_x = (agent_x + ((agent_dx>0)*2-1)) % canvas_size_x;
        local new_y = (agent_y + ((agent_dy>0)*2-1)) % canvas_size_y;

        agent_x = new_x;
        agent_y = new_y;

        capacity_fac += capacity_fac_change;
        if (capacity_fac > 1) {
            capacity_fac = 1;
        }
    }
    _terr_change -sediment;
}


proc _terr_change amount {
    # can be optimised
    local terr_change_i = 1;
    repeat length custom_lut / 3 {
        local deposit_i = INDEX_FROM_2D_INTS(agent_x+custom_lut[terr_change_i], agent_y+custom_lut[terr_change_i+1], canvas_size_x, canvas_size_y);
        temp_canvas_mono[deposit_i] += $amount * custom_lut[terr_change_i+2];
        if temp_canvas_mono[deposit_i] < 0 {
            temp_canvas_mono[deposit_i] = 0;
        }
        terr_change_i += 3;
    }
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

    # add trees (must not overlap)
    iy = 0;
    repeat (canvas_size_y) {
        ix = 0;
        repeat (canvas_size_x) {
            if (PROBABILITY($tree_fac)) {
                _plant_tree ix, iy, (canvas_size_z * $water_level_fac) + 1;
            }
            ix++;
        }
        iy++;
    }

    generator_finished;
}
proc _plant_tree x, y, min_elevation {
    iz = $min_elevation;
    i = INDEX_FROM_3D_CANVAS($x, $y, iz, canvas_size_x, canvas_size_y);
    layer_size = (canvas_size_x * canvas_size_y);
    # find first non-air voxel
    repeat (canvas_size_z) {
        if (canvas[i].opacity == 0 and canvas[i-layer_size].opacity > 0) {
            # plant the tree here
            set_depositor_from_HSV 0.25, 0.5, 0.5;
            randomise_depositor_by_HSV 0.05, 0.05, 0.05;
            draw_column $x, $y, iz, random(1,random(2,4));
            
            stop_this_script;
        }
        i += layer_size;
        iz++;
    }
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
    
    reset_generator $cell_count*total_cell_size, $cell_count*total_cell_size, $max_height;
    
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
    generator_finished;
}



on "gen.hedge.run" {
    delete UI_return;
    setting_from_id "gen.hedge.size_x";
    setting_from_id "gen.hedge.size_y";
    setting_from_id "gen.hedge.size_z";
    setting_from_id "gen.hedge.leaf_density";
    setting_from_id "gen.hedge.leaf_size";
    setting_from_id "gen.hedge.col1";
    setting_from_id "gen.hedge.col2";
    setting_from_id "gen.hedge.col3";
    generate_hedge UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6], UI_return[7], UI_return[8];
}
proc generate_hedge size_x, size_y, size_z, leaf_density, leaf_size, col1, col2, col3 {
    reset_generator $size_x, $size_y, $size_z;

    set_depositor_from_number $col1;
    draw_base_layer;

    iz = 0;
    repeat ($size_z) {
        repeat ($leaf_density * (canvas_size_x/$leaf_size) * (canvas_size_y/$leaf_size)) {
            # draw a leaf
            set_depositor_from_number_lerp $col2, $col3, RANDOM_0_1();
            lerp_depositor_towards_number $col1, 1-((iz+1)/$size_z);
            draw_cuboid_centered_XY RANDOM_X(), RANDOM_Y(), iz, RANDOM_0_1()*$leaf_size, RANDOM_0_1()*$leaf_size, 1;
        }
        iz++;
    }
    
    generator_finished;
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

%define MGSOFFSET(DX,DY,SIDE) (custom_graph[(((edit_x+(DX))%$cell_count) + ((edit_y+(DY))%$cell_count)*$cell_count)*2+(SIDE)])
%define MGSOFFSETX(DX,SIDE) (custom_graph[(((edit_x+(DX))%$cell_count) + (edit_y*$cell_count))*2+(SIDE)])
%define MGSOFFSETY(DY,SIDE) (custom_graph[(edit_x + ((edit_y+(DY))%$cell_count)*$cell_count)*2+(SIDE)])
%define MGS(SIDE) (custom_graph[(edit_x + (edit_y*$cell_count))*2+(SIDE)])

proc generate_maze cell_count, cell_size, wall_thickness, wall_height, pertubation, ground_col, wall_col {
    local total_cell_size = ($cell_size+$wall_thickness);

    # first generate the maze graph, 2 items per cell for the 2 walls (they make an L shape in the cell)
    delete custom_graph;
    repeat ($cell_count*$cell_count) {
        if (PROBABILITY(0.5)) {
            add 0 to custom_graph;
            add 1 to custom_graph;
        } else {
            add 1 to custom_graph;
            add 0 to custom_graph;
        }
    }

    # randomise by swapping walls
    # take a random cell and swap any 2 of its 4 adj walls
    repeat ($cell_count*$cell_count*$pertubation) {
        local edit_x = random(1,$cell_count);
        local edit_y = random(1,$cell_count);

        if (PROBABILITY(0.5)) {
            # vertical toggle
            local index_to_edit = (edit_x + (edit_y*$cell_count))*2+2;
            local req_state = custom_graph[index_to_edit];
            # check if there is still another of the same state as the original
            if req_state == MGSOFFSETY(1,1) or req_state == MGSOFFSETY(1,2) or MGSOFFSET(-1,1,1) {
                if req_state == MGS(1) or req_state == MGSOFFSETX(-1,1) or req_state == MGSOFFSETY(-1,2) {
                    custom_graph[index_to_edit] = 1 - custom_graph[index_to_edit];
                }
            }
        } else {
            # horizontal
            local index_to_edit = (edit_x + (edit_y*$cell_count))*2+1;
            local req_state = custom_graph[index_to_edit];
            # check if there is still another of the same state as the original
            if req_state == MGSOFFSETX(1,1) or req_state == MGSOFFSETX(1,2) or MGSOFFSET(1,-1,2) {
                if req_state == MGS(2) or req_state == MGSOFFSETY(-1,2) or req_state == MGSOFFSETX(-1,1) {
                    custom_graph[index_to_edit] = 1 - custom_graph[index_to_edit];
                }
            }
        }
    }

    # generate the canvas
    reset_generator $cell_count*total_cell_size, $cell_count*total_cell_size, $wall_height+1;
    
    set_depositor_from_number $ground_col;
    draw_base_layer;

    set_depositor_from_number $wall_col;
    iy = 0;
    repeat $cell_count {
        ix = 0;
        repeat $cell_count {
            if (custom_graph[2*(ix+iy*$cell_count)+1]) {
                # horz
                draw_cuboid_corner_size ix*total_cell_size, iy*total_cell_size, 0, total_cell_size+$wall_thickness, $wall_thickness, canvas_size_z;
            }
            if (custom_graph[2*(ix+iy*$cell_count)+2]) {
                # vert
                draw_cuboid_corner_size ix*total_cell_size, iy*total_cell_size, 0, $wall_thickness, total_cell_size+$wall_thickness, canvas_size_z;
            }
            ix++;
        }
        iy++;
    }

    delete custom_graph;
    generator_finished;
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
    reset_generator $radius, 1, $size_z;

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
    
    if (PROBABILITY(0.5)) { # set color
        set_depositor_from_HSV RANDOM_0_1(), random("0.0", "0.8"), RANDOM_0_1();
    } else {
        set_depositor_from_sRGB RANDOM_0_1(), RANDOM_0_1(), RANDOM_0_1();
    }
    repeat (random("0.0", "6.0")*dist) {
        local rot = RANDOM_ANGLE();
        random_walk_any (canvas_size_x/2)+dist*cos(rot), (canvas_size_y/2)+dist*sin(rot), random(elev_min, elev_max), rot, steps, canvas_size_x*random("0.05", "0.1"), turn;
    }
    
    generator_finished;
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
    reset_generator $size_x, $size_y, $size_z;

    if (PROBABILITY(0.5)) {
        set_depositor_from_number_lerp $col1, $col2, RANDOM_0_1();
    } else {
        set_depositor_from_number_lerp $col2, $col3, RANDOM_0_1();
    }
    draw_base_layer;

    repeat ($density) * (canvas_size_x*canvas_size_y) {
        if (PROBABILITY(0.5)) {
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
    
    generator_finished;
}


on "gen.refinery.run" {
    delete UI_return;
    generate_refinery;
}
proc generate_refinery {
    reset_generator 64, 64, 16;
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
    
    generator_finished;
}


on "gen.value_noise.run" {
    delete UI_return;
    setting_from_id "gen.value_noise.size_x";
    setting_from_id "gen.value_noise.size_y";
    setting_from_id "gen.value_noise.scale";
    setting_from_id "gen.value_noise.octaves";
    generate_value_noise UI_return[1], UI_return[2], UI_return[3], UI_return[4], true;
    generator_finished;
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

    # write the to the real canvas as 1 layer of voxels
    if $write_to_canvas {
        clear_canvas $size_x, $size_y, 1;
        
        i = 1;
        repeat (canvas_size_x * canvas_size_y) {
            canvas[i].r = temp_canvas_mono[i];
            canvas[i].g = temp_canvas_mono[i];
            canvas[i].b = temp_canvas_mono[i];
            canvas[i].opacity = 1;
            i++;
        }
        delete temp_canvas_mono; # delete mono list because its data is now in the canvas
    }
}


on "gen.sphere.run" {
    delete UI_return;
    setting_from_id "gen.sphere.canvas_size";
    setting_from_id "gen.sphere.include_ground";
    setting_from_id "gen.sphere.ground_col";
    setting_from_id "gen.sphere.sphere_radius";
    setting_from_id "gen.sphere.sphere_color";
    setting_from_id "gen.sphere.sphere_emission";
    generate_sphere UI_return[1], UI_return[2], UI_return[3], UI_return[4], UI_return[5], UI_return[6];
}
proc generate_sphere canvas_size, include_ground, ground_col, sphere_radius, sphere_color, sphere_emission {
    reset_generator $canvas_size*2, $canvas_size*2, $sphere_radius*2;
    if $include_ground {
        set_depositor_from_number $ground_col;
        draw_base_layer;
    }
    set_depositor_from_number $sphere_color;
    depositor_voxel.emission = $sphere_emission;
    draw_sphere $canvas_size, $canvas_size, $sphere_radius, $sphere_radius;
    generator_finished;
}


on "gen.template.run" {
    reset_generator 64, 64, 8;
    set_depositor_from_sRGB_value 0.8;
    draw_base_layer;
    set_depositor_from_sRGB 1, 0, 0;
    draw_sphere 16, 16, 4, 4;
    set_depositor_from_sRGB 0, 1, 0;
    draw_sphere 32, 16, 4, 4;
    set_depositor_from_sRGB 0, 0, 1;
    draw_sphere 24, 32, 4, 4;
    generator_finished;
}


on "gen.grad.run" {
    generate_grad 120, 80;
}
proc generate_grad size_x, size_y {
    reset_generator $size_x, $size_y, 1;
    set_depositor_from_sRGB 0.5, 0.5, 0.5;
    draw_base_layer;

    local px_y = 0;
    repeat $size_y {
        local px_x = 0;
        repeat $size_x {
            set_depositor_from_HSV px_x/($size_x), 1, px_y/($size_y);
            set_voxel px_x, px_y, 0;
            px_x++;
        }
        px_y++;
    }
    
    generator_finished;
}


on "gen.test.run" { generate_test; }
proc generate_test {
    reset_generator 100, 64, 10;

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

    generator_finished;
}


################################
#          Language            #
################################

on "sys.hard_reset" {
    delete call_stack;
    clear_lang_lists;
}

%define MEM1 memory[instructions[iptr+1]]
%define MEM2 memory[instructions[iptr+2]]
%define MEM3 memory[instructions[iptr+3]]
%define MEM4 memory[instructions[iptr+4]]
%define MEM5 memory[instructions[iptr+5]]

list instructions; # machine code
list call_stack; # used for call and return instructions in operation
list memory; # stores variables at runtime

list lit_vals; # lookup
list lit_addresses; # location in memory

list var_names; # lookup
list var_addresses; # location in memory

list label_names; # lookup
list label_addresses; # location in instructions

list unresolved_jump_targets; # instruction addresses that need a second pass to replace with label addresses

list instruction_names = ["set","add","sub","mul","div","inc","eq","lt","gt","and","or","not","lteq","gteq","dec","mod","jump","jump_if_true","jump_if_false","jump_by","min","max","call","return","random","pow","abs","round","floor","ceil","sqrt","sin","cos","tan","gate","lerp","asin","acos","atan","atan2","mag2","ln","log","antiln","antilog","special","unlerp","letter_of","join","mag3","print"];
list instruction_args = ["AV","AVV","AVV","AVV","AVV","A","AVV","AVV","AVV","AVV","AVV","AV","AVV","AVV","A","AVV","L","LV","LV","LV","AVV","AVV","L","","AVV","AVV","AV","AV","AV","AV","AV","AV","AV","AV","AVVV","AVVV","AV","AV","AV","AVV","AVV","AV","AV","AV","AV","F","AVVV","AVV","AVV","AVVV","V"];

on "lang.run" {
    broadcast "sys.show_output";
    language_assemble "set i 0; jump_if_true @end 0; set i \"yes\"; @end;";
    if (assemble_success) {
        language_run;
    }
}


proc clear_lang_lists {
    delete instructions;
    delete memory;
    delete lit_vals;
    delete lit_addresses;
    delete var_names;
    delete var_addresses;
    delete label_names;
    delete label_addresses;
    delete unresolved_jump_targets;
    delete output;
}


# convert the text-based format into a list of numbers and variables
proc language_assemble script {
    clear_lang_lists;

    assemble_success = false;
    input = $script & ";"; # guarantee it ends with a semicolon
    substr = "";
    line_number = 1;
    i = 1;
    until (i > length input) {
        # first character at start of line

        if (input[i] == "#") {
            # comment, ignore and go to next semicolon
            i++;
            until (input[i] == ";") {
                i++;
            }

        } elif (input[i] == " ") {
            # ignore start padding
            i++;

        } elif (input[i] == ";") {
            line_number++;
            i++;

        } elif (input[i] == "@") {
            # label, go to next semicolon, must be entirely alphanumeric
            i++; # skip over @
            _consume_name;

            if (input[i] != ";") {
                assembler_error "unexpected character, label must be terminated with a semicolon";
                stop_this_script;
            }
            if (length substr == 0) {
                assembler_error "label is empty";
                stop_this_script;
            }
            if substr in label_names {
                assembler_error "duplicate label: " & substr;
                stop_this_script;
            }

            add substr to label_names;
            add (length instructions + 1) to label_addresses;
            # don't add anything to the instructions
            substr = "";
            
        } elif (input[i] in "_0123456789abcdefghijklmnopqrstuvwxyz") {
            # instruction
            _consume_name;
            if (not (input[i] in " ;")) {
                assembler_error "unexpected character " & input[i] & " in name";
                stop_this_script;
            }
            local ins_index = substr in instruction_names; # 1-indexed
            if (ins_index == 0) {
                assembler_error "unrecognised instruction: " & substr;
                stop_this_script;
            }
            add (ins_index - 1) to instructions;
            substr = "";

            # now parse args
            arg_index = 1;
            until (input[i] == ";") {
                if (input[i] == " ") {
                    # ignore padding
                    i++;
                } elif (input[i] == "@") {
                    # label as parameter
                    if (instruction_args[ins_index][arg_index] != "L") {
                        assembler_error "unexpected label in argument " & arg_index & " of " & instruction_names[ins_index];
                        stop_this_script;
                    }

                    i++; # skip over @
                    _consume_name;
                    if (length substr == 0) {
                        assembler_error "label is empty";
                        stop_this_script;
                    }
                    if (not (input[i] in " ;")) {
                        assembler_error "unexpected character " & input[i] & " in label";
                        stop_this_script;
                    }

                    add substr to instructions; # will be replaced in a second pass, item will be used in lookup to replace with code address
                    add (length instructions) to unresolved_jump_targets;
                    substr = "";
                    arg_index++;
                
                } elif (input[i] == "\"") {
                    # string literal
                    if (instruction_args[ins_index][arg_index] != "V") {
                        assembler_error "unexpected string in argument " & arg_index & " of " & instruction_names[ins_index];
                        stop_this_script;
                    }

                    i++; # skip over first quote
                    # consume string
                    until (input[i] == "\"" or input[i] == ";") {
                        if (input[i] == "\\" and input[i+1] == "\"") {
                            substr &= "\"";
                            i += 2; # jump past
                        } else {
                            substr &= input[i];
                            i++;
                        }
                    }
                    if (input[i] != "\"") {
                        assembler_error "string not terminated";
                        stop_this_script;
                    }
                    i++; # skip over last quote

                    local lit_index = substr in lit_vals;
                    if (lit_index == 0) {
                        # never-seen-before literal
                        add (substr + 0) to memory; # literal stored in memory
                        add substr to lit_vals;
                        add (length memory) to instructions; # address to memory
                        add (length memory) to lit_addresses;
                    } else {
                        add lit_addresses[lit_index] to instructions;
                    }

                    substr = "";
                    arg_index++;
                
                } elif (input[i] in "+-.0123456789") {
                    # number literal
                    if (instruction_args[ins_index][arg_index] != "V") {
                        assembler_error "unexpected number in argument " & arg_index & " of " & instruction_names[ins_index];
                        stop_this_script;
                    }

                    # consume number:
                    # TODO limit use of special chars to certain positions
                    substr &= input[i];
                    i++;
                    until (not (input[i] in ".0123456789")) {
                        substr &= input[i];
                        i++;
                    }
                    if (not (input[i] in " ;")) {
                        assembler_error "unexpected character " & input[i] & " in number";
                        stop_this_script;
                    }

                    local lit_index = substr in lit_vals;
                    if (lit_index == 0) {
                        # never-seen-before literal
                        add (substr + 0) to memory; # literal stored in memory
                        add substr to lit_vals;
                        add (length memory) to instructions; # address to memory
                        add (length memory) to lit_addresses;
                    } else {
                        add lit_addresses[lit_index] to instructions;
                    }

                    substr = "";
                    arg_index++;

                } elif (input[i] in "_0123456789abcdefghijklmnopqrstuvwxyz") {
                    # variable or field
                    local arg_type = instruction_args[ins_index][arg_index]; # beware detection of empty string
                    if (arg_type == "" or not (arg_type in "AVF")) {
                        assembler_error "unexpected variable in argument " & arg_index & " of " & instruction_names[ins_index];
                        stop_this_script;
                    }

                    _consume_name;
                    if (not (input[i] in " ;")) {
                        assembler_error "unexpected character " & input[i] & " in name";
                        stop_this_script;
                    }
                    
                    if (instruction_args[ins_index][arg_index] == "F") {
                        # is field, keep as-is
                        # TODO convert to number depending on instruction (hard-code it)
                        add substr to instructions;

                    } else {
                        # add var and use address to memory
                        local var_index = substr in var_names;
                        if (var_index == 0) {
                            # never-seen-before var name
                            add "unassigned " & substr to memory; # initial value, TODO
                            add substr to var_names;
                            add (length memory) to var_addresses;
                            add (length memory) to instructions; # address to memory
                        } else {
                            add var_addresses[var_index] to instructions; # address to memory
                        }
                    }
                    substr = "";
                    arg_index++;

                } else {
                    assembler_error "unexpected character in argument: " & input[i];
                    stop_this_script;
                }
            }

            if ((arg_index - 1) != length instruction_args[ins_index]) {
                assembler_error "incorrect number of args in " & instruction_names[ins_index];
                stop_this_script;
            }
        
        } else {
            assembler_error "unexpected character: " & input[i];
            stop_this_script;
        }
    }


    # resolve the jump targets
    i = 1;
    repeat (length unresolved_jump_targets) {
        local label_index = instructions[unresolved_jump_targets[i]] in label_names;
        if (label_index > 0) {
            instructions[unresolved_jump_targets[i]] = label_addresses[label_index];
        } else {
            assembler_error "label not found: " & instructions[unresolved_jump_targets[i]], true;
            stop_this_script;
        }
    }

    add "assembler finished successfully" to output;
    assemble_success = true;
}


proc _consume_name {
    until (not (input[i] in "_0123456789abcdefghijklmnopqrstuvwxyz")) {
        substr &= input[i];
        i++;
    }
}




proc assembler_error message, raw=false {
    if $raw {
        add $message to output;
    } else {
        add "error at char " & i & " (line " & line_number & ")" to output;
        add $message to output;
    }
    error output["last"];
}



proc language_run {
    delete output;
    delete call_stack;
    local iptr = 1; # entry point at first item

    until (iptr > length instructions) {
        log iptr & ": " & instruction_names[instructions[iptr] + 1]; # debug

        local opcode = instructions[iptr];
        # code generated by src/lang/instructions.py
        # do not modify
        if (opcode < 29) {
            if (opcode < 2) {
                if (opcode < 1) {
                    # 0: set
                    MEM1 = MEM2;iptr += 3;
                } else {
                    # 1: add
                    MEM1 = MEM2 + MEM3;iptr += 4;
                }
            } else {
                if (opcode < 17) {
                    if (opcode < 4) {
                        if (opcode < 3) {
                            # 2: sub
                            MEM1 = MEM2 - MEM3;iptr += 4;
                        } else {
                            # 3: mul
                            MEM1 = MEM2 * MEM3;iptr += 4;
                        }
                    } else {
                        if (opcode < 7) {
                            if (opcode < 5) {
                                # 4: div
                                MEM1 = MEM2 / MEM3;iptr += 4;
                            } else {
                                if (opcode < 6) {
                                    # 5: inc
                                    MEM1 += 1;iptr += 2;
                                } else {
                                    # 6: eq
                                    MEM1 = MEM2 == MEM3;iptr += 4;
                                }
                            }
                        } else {
                            if (opcode < 10) {
                                if (opcode < 8) {
                                    # 7: lt
                                    MEM1 = MEM2 < MEM3;iptr += 4;
                                } else {
                                    if (opcode < 9) {
                                        # 8: gt
                                        MEM1 = MEM2 > MEM3;iptr += 4;
                                    } else {
                                        # 9: and
                                        MEM1 = MEM2 and MEM3;iptr += 4;
                                    }
                                }
                            } else {
                                if (opcode < 12) {
                                    if (opcode < 11) {
                                        # 10: or
                                        MEM1 = MEM2 or MEM3;iptr += 4;
                                    } else {
                                        # 11: not
                                        MEM1 = not MEM2;iptr += 3;
                                    }
                                } else {
                                    if (opcode < 14) {
                                        if (opcode < 13) {
                                            # 12: lteq
                                            MEM1 = MEM2 <= MEM3;iptr += 4;
                                        } else {
                                            # 13: gteq
                                            MEM1 = MEM2 >= MEM3;iptr += 4;
                                        }
                                    } else {
                                        if (opcode < 15) {
                                            # 14: dec
                                            MEM1 -= 1;iptr += 2;
                                        } else {
                                            if (opcode < 16) {
                                                # 15: mod
                                                MEM1 = MEM2 % MEM3;iptr += 4;
                                            } else {
                                                # 16: jump
                                                iptr = instructions[iptr+1];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (opcode < 20) {
                        if (opcode < 18) {
                            # 17: jump_if_true
                            if (MEM2) {iptr = instructions[iptr+1];} else {iptr += 3;}
                        } else {
                            if (opcode < 19) {
                                # 18: jump_if_false
                                if (MEM2) {iptr += 3;} else {iptr = instructions[iptr+1];}
                            } else {
                                # 19: jump_by
                                iptr += MEM2;
                            }
                        }
                    } else {
                        if (opcode < 22) {
                            if (opcode < 21) {
                                # 20: min
                                if (MEM3 < MEM4) {MEM2 = MEM3;} else {MEM2 = MEM4;}iptr += 4;
                            } else {
                                # 21: max
                                if (MEM3 > MEM4) {MEM2 = MEM3;} else {MEM2 = MEM4;}iptr += 4;
                            }
                        } else {
                            if (opcode < 24) {
                                if (opcode < 23) {
                                    # 22: call
                                    add iptr to call_stack;
                                } else {
                                    # 23: return
                                    iptr = call_stack["last"]+1;delete call_stack["last"];
                                }
                            } else {
                                if (opcode < 26) {
                                    if (opcode < 25) {
                                        # 24: random
                                        MEM2 = random(MEM3, MEM4);iptr += 4;
                                    } else {
                                        # 25: pow
                                        MEM2 = POW(MEM3, MEM4);iptr += 4;
                                    }
                                } else {
                                    if (opcode < 27) {
                                        # 26: abs
                                        MEM1 = abs(MEM2);iptr += 3;
                                    } else {
                                        if (opcode < 28) {
                                            # 27: round
                                            MEM1 = round(MEM2);iptr += 3;
                                        } else {
                                            # 28: floor
                                            MEM1 = floor(MEM2);iptr += 3;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            if (opcode < 40) {
                if (opcode < 34) {
                    if (opcode < 31) {
                        if (opcode < 30) {
                            # 29: ceil
                            MEM1 = ceil(MEM2);iptr += 3;
                        } else {
                            # 30: sqrt
                            MEM1 = sqrt(MEM2);iptr += 3;
                        }
                    } else {
                        if (opcode < 32) {
                            # 31: sin
                            MEM1 = sin(MEM2);iptr += 3;
                        } else {
                            if (opcode < 33) {
                                # 32: cos
                                MEM1 = cos(MEM2);iptr += 3;
                            } else {
                                # 33: tan
                                MEM1 = tan(MEM2);iptr += 3;
                            }
                        }
                    }
                } else {
                    if (opcode < 37) {
                        if (opcode < 35) {
                            # 34: gate
                            if MEM3 {MEM2 = MEM4;} else {MEM2 = MEM5;}iptr += 5;
                        } else {
                            if (opcode < 36) {
                                # 35: lerp
                                MEM2 = LERP(MEM3, MEM4, MEM5);iptr += 5;
                            } else {
                                # 36: asin
                                MEM1 = asin(MEM2);iptr += 3;
                            }
                        }
                    } else {
                        if (opcode < 38) {
                            # 37: acos
                            MEM1 = acos(MEM2);iptr += 3;
                        } else {
                            if (opcode < 39) {
                                # 38: atan
                                MEM1 = atan(MEM2);iptr += 3;
                            } else {
                                # 39: atan2
                                MEM2 = ATAN2(MEM3, MEM4);iptr += 4;
                            }
                        }
                    }
                }
            } else {
                if (opcode < 45) {
                    if (opcode < 42) {
                        if (opcode < 41) {
                            # 40: mag2
                            MEM2 = VEC2_LEN(MEM3, MEM4);iptr += 4;
                        } else {
                            # 41: ln
                            MEM1 = ln(MEM2);iptr += 3;
                        }
                    } else {
                        if (opcode < 43) {
                            # 42: log
                            MEM1 = log(MEM2);iptr += 3;
                        } else {
                            if (opcode < 44) {
                                # 43: antiln
                                MEM1 = antiln(MEM2);iptr += 3;
                            } else {
                                # 44: antilog
                                MEM1 = antilog(MEM2);iptr += 3;
                            }
                        }
                    }
                } else {
                    if (opcode < 48) {
                        if (opcode < 46) {
                            # 45: special
                            error "not implemented";stop_this_script;
                        } else {
                            if (opcode < 47) {
                                # 46: unlerp
                                MEM2 = UNLERP(MEM3, MEM4, MEM5);iptr += 5;
                            } else {
                                # 47: letter_of
                                MEM2 = MEM4[MEM3];iptr += 4;
                            }
                        }
                    } else {
                        if (opcode < 49) {
                            # 48: join
                            MEM2 = MEM3 & MEM4;iptr += 4;
                        } else {
                            if (opcode < 50) {
                                # 49: mag3
                                MEM2 = VEC3_LEN(MEM3, MEM4, MEM5);iptr += 5;
                            } else {
                                # 50: print
                                add MEM1 to output;iptr += 2;
                            }
                        }
                    }
                }
            }
        }

        # end of until loop
    }

    add "finished successfully" to output;
}


proc call_special name {

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
    # metadata
    add template_metadata { ptr:(length depositor_template_voxels), sx:canvas_size_x, sy:canvas_size_y, sz:canvas_size_z } to depositor_template_metadata;
    
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

# blend between 2 colors
proc set_depositor_from_number_lerp number1, number2, t {
    # number assumed to be 0-16777215
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = VOXEL_SOLID((($number1//65536)%256/255), (($number1//256)%256/255), (($number1%256)/255));
    
    depositor_voxel.r = LERP(depositor_voxel.r, (($number2//65536)%256/255), $t);
    depositor_voxel.g = LERP(depositor_voxel.g, (($number2//256)%256/255), $t);
    depositor_voxel.b = LERP(depositor_voxel.b, (($number2%256)/255), $t);
}

# move the current depositor color towards a color
proc lerp_depositor_towards_number target_number, t {
    depositor_voxel.r = LERP(depositor_voxel.r, (($target_number//65536)%256/255), $t);
    depositor_voxel.g = LERP(depositor_voxel.g, (($target_number//256)%256/255), $t);
    depositor_voxel.b = LERP(depositor_voxel.b, (($target_number%256)/255), $t);
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

proc set_depositor_from_voxel x, y, z {
    # copy the voxel at the given coordinates
    local index = INDEX_FROM_3D($x, $y, $z, canvas_size_x, canvas_size_y, canvas_size_z);
    depositor_mode = DepositorMode.DRAW;
    depositor_voxel = canvas[index];
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


# Reset the canvas to an empty state, ready for a generator to run. Deletes templates and resets the depositor.
proc reset_generator size_x, size_y, size_z {
    delete_all_templates;
    reset_depositor;
    clear_canvas $size_x, $size_y, $size_z;
}


# Clear the canvas to an empty state.
proc clear_canvas size_x, size_y, size_z {
    canvas_size_x = floor($size_x) * ($size_x > 0); # positive clamp and floor
    canvas_size_y = floor($size_y) * ($size_y > 0);
    canvas_size_z = floor($size_z) * ($size_z > 0);
    delete canvas;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        add VOXEL_NONE to canvas;
    }

    if ((canvas_size_x * canvas_size_y * canvas_size_z) != length canvas) {
        error "canvas does not contain all requested voxels";
        if (length canvas == 200000) {
            print_no_duplicates "Error: Scratch's 200k list limit has been reached, canvas is malformed", 6;
        }
    }
}


proc generator_finished {
    require_composite = true;
    cam_x = canvas_size_x/2;
    cam_y = canvas_size_y/2;
}


################################
#            Shapes            #
################################


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
    draw_cuboid_corner_size $x-($size_x/2), $y-($size_y/2), $z-($size_z/2), $size_x, $size_y, $size_z;
}


# rectangular prism centered at x,y,z
proc draw_cuboid_centered_XY x, y, z, size_x, size_y, size_z {
    draw_cuboid_corner_size $x-($size_x/2), $y-($size_y/2), $z, $size_x, $size_y, $size_z;
}


# partially filled rectangle
proc draw_rectangle_fill_random x, y, z, size_x, size_y, probability {
    local px_y = $y;
    repeat (round($size_y)) {
        local px_x = $x;
        repeat (round($size_x)) {
            if (PROBABILITY($probability)) {
                set_voxel px_x, px_y, $z;
            }
            px_x++;
        }
        px_y++;
    }
}


proc draw_rectangle_fill_random_centered_XY x, y, z, size_x, size_y, probability {
    draw_rectangle_fill_random $x-($size_x/2), $y-($size_y/2), $z, $size_x, $size_y, $probability;
}


# random walk in a 2D plane using taxicab movement (X and Y axis only)
proc random_walk_taxicab x, y, z, turns, steps {
    agent_x = $x;
    agent_y = $y;

    repeat $turns {
        if (PROBABILITY(0.5)) {
            if (PROBABILITY(0.5)) {
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
            if (PROBABILITY(0.5)) {
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
    agent_x = $x;
    agent_y = $y;
    agent_dir = $start_dir;

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
# abbreviated to glbfx


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
}


on "fx.jitter.run" {
    delete UI_return;
    setting_from_id "fx.jitter.coverage";
    setting_from_id "fx.jitter.probability_z";
    glbfx_jitter UI_return[1], UI_return[2];
    require_composite = true;
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
        if (PROBABILITY($probability_z)) {
            local jitter_i2 = jitter_i1 + (canvas_size_x * canvas_size_y); # z
        } elif (PROBABILITY(0.5)) {
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
}


on "fx.smudge.run" {
    delete UI_return;
    setting_from_id "fx.smudge.coverage";
    setting_from_id "fx.smudge.probability_z";
    glbfx_smudge UI_return[1], UI_return[2];
    require_composite = true;
}
# randomly average pairs of non-air voxels
proc glbfx_smudge coverage, probability_z {
    repeat ((canvas_size_x * canvas_size_y * canvas_size_z) * $coverage) {
        local jitter_x = RANDOM_X();
        local jitter_y = RANDOM_Y();
        local jitter_z = random(0, canvas_size_z-2); # Do not cross upper boundary

        local jitter_i1 = INDEX_FROM_3D_CANVAS_INTS(jitter_x, jitter_y, jitter_z, canvas_size_x, canvas_size_y);
        if (PROBABILITY($probability_z)) {
            local jitter_i2 = jitter_i1 + (canvas_size_x * canvas_size_y); # z
        } elif (PROBABILITY(0.5)) {
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
}


# darken voxels randomly
proc glbfx_color_noise min, max {
    local i = 1;
    repeat (canvas_size_x * canvas_size_y * canvas_size_z) {
        canvas[i].r *= random($min, $max);
        if (canvas[i].r < 0) { canvas[i].r = 0; }
        if (canvas[i].r > 1) { canvas[i].r = 1; }

        canvas[i].g *= random($min, $max);
        if (canvas[i].g < 0) { canvas[i].g = 0; }
        if (canvas[i].g > 1) { canvas[i].g = 1; }

        canvas[i].b *= random($min, $max);
        if (canvas[i].b < 0) { canvas[i].b = 0; }
        if (canvas[i].b > 1) { canvas[i].b = 1; }
        
        i++;
    }
}


# take a 1 voxel thick canvas as profile and revolve on the xy plane
proc glbfx_revolve dist_offset {
    # copy the line of voxels
    delete temp_canvas;
    layer_size = (canvas_size_x * canvas_size_y);
    local row_index = 1;
    repeat (canvas_size_z) {
        ix = 0;
        repeat (canvas_size_x) {
            add canvas[row_index + ix] to temp_canvas;
            ix++;
        }
        row_index += layer_size;
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
}


proc radial_array dist_offset {
    # TODO
}



on "fx.mirror.mirror_x" {
    glbfx_mirror_x true;
    require_composite = true;
}
# copy one side to the other
proc glbfx_mirror_x keep_lower {
    # no additional list required
    layer_size = (canvas_size_x * canvas_size_y);
    iz = 0;
    repeat canvas_size_z {
        iy = 0;
        repeat canvas_size_y {
            local row_index = (layer_size * iz) + (canvas_size_x * iy);
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
}

on "fx.mirror.mirror_y" {
    glbfx_mirror_y true;
    require_composite = true;
}
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
    require_composite = true;
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

            # use fac to interpolate colors
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

            # use fac to interpolate colors
            canvas[i].r = FROM_LINEAR(LERP(c0r,c1r,t));
            canvas[i].g = FROM_LINEAR(LERP(c0g,c1g,t));
            canvas[i].b = FROM_LINEAR(LERP(c0b,c1b,t));
            i++;
        }
    }
}



