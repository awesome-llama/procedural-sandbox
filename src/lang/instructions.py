# Generate goboscript code

import search_tree

LABEL = 'L' # must be a valid label
VAL = 'V' # literal or variable
ADR = 'A' # variable
FIELD = 'F' # must be text

# name, args, ranking (occurrence), goboscript code
instructions = [
    ['jump', [LABEL], 30, 'iptr = instructions[iptr+1];'],
    ['jump_if_true', [LABEL, VAL], 30, 'if (MEM2) {iptr = instructions[iptr+1];} else {iptr += $SIZE;}'],
    ['jump_if_false', [LABEL, VAL], 30, 'if (MEM2) {iptr += $SIZE;} else {iptr = instructions[iptr+1];}'],
    ['jump_by', [VAL], 30, 'iptr += MEM1;'], # jump by address offset
    ['call', [LABEL], 40, 'add iptr+$SIZE to call_stack;iptr = instructions[iptr+1];'],
    ['return', [], 40, 'iptr = call_stack["last"];delete call_stack["last"];'],

    ['set', [ADR, VAL], 10, 'MEM1 = MEM2;iptr += $SIZE;'], # set var
    ['inc', [ADR], 15, 'MEM1 += 1;iptr += $SIZE;'], # increment by 1
    ['dec', [ADR], 20, 'MEM1 -= 1;iptr += $SIZE;'], # decrement by 1
    ['add', [ADR, VAL, VAL], 10, 'MEM1 = MEM2 + MEM3;iptr += $SIZE;'], # add
    ['sub', [ADR, VAL, VAL], 10, 'MEM1 = MEM2 - MEM3;iptr += $SIZE;'], # subtract
    ['mul', [ADR, VAL, VAL], 10, 'MEM1 = MEM2 * MEM3;iptr += $SIZE;'], # multiply
    ['div', [ADR, VAL, VAL], 10, 'MEM1 = MEM2 / MEM3;iptr += $SIZE;'], # divide
    ['mod', [ADR, VAL, VAL], 20, 'MEM1 = MEM2 % MEM3;iptr += $SIZE;'], # modulo
    ['pow', [ADR, VAL, VAL], 50, 'MEM2 = POW(MEM3, MEM4);iptr += $SIZE;'], # power

    ['eq', [ADR, VAL, VAL], 15, 'MEM1 = MEM2 == MEM3;iptr += $SIZE;'], # equality
    ['lt', [ADR, VAL, VAL], 15, 'MEM1 = MEM2 < MEM3;iptr += $SIZE;'], # less than
    ['gt', [ADR, VAL, VAL], 15, 'MEM1 = MEM2 > MEM3;iptr += $SIZE;'], # greater than
    ['lteq', [ADR, VAL, VAL], 16, 'MEM1 = MEM2 <= MEM3;iptr += $SIZE;'], # less than or equal to
    ['gteq', [ADR, VAL, VAL], 16, 'MEM1 = MEM2 >= MEM3;iptr += $SIZE;'], # greater than or equal to
    
    ['and', [ADR, VAL, VAL], 15, 'MEM1 = MEM2 and MEM3;iptr += $SIZE;'], # boolean and
    ['or', [ADR, VAL, VAL], 15, 'MEM1 = MEM2 or MEM3;iptr += $SIZE;'], # boolean or
    ['not', [ADR, VAL], 15, 'MEM1 = not MEM2;iptr += $SIZE;'], # boolean not

    ['abs', [ADR, VAL], 50, 'MEM1 = abs(MEM2);iptr += $SIZE;'], # absolute value
    ['round', [ADR, VAL], 80, 'MEM1 = round(MEM2);iptr += $SIZE;'], # round
    ['floor', [ADR, VAL], 80, 'MEM1 = floor(MEM2);iptr += $SIZE;'], # round down
    ['ceil', [ADR, VAL], 80, 'MEM1 = ceil(MEM2);iptr += $SIZE;'], # round up
    ['sqrt', [ADR, VAL], 100, 'MEM1 = sqrt(MEM2);iptr += $SIZE;'], # square root
    ['sin', [ADR, VAL], 100, 'MEM1 = sin(MEM2);iptr += $SIZE;'], # sin
    ['cos', [ADR, VAL], 100, 'MEM1 = cos(MEM2);iptr += $SIZE;'], # cos
    ['tan', [ADR, VAL], 100, 'MEM1 = tan(MEM2);iptr += $SIZE;'], # tan
    ['asin', [ADR, VAL], 400, 'MEM1 = asin(MEM2);iptr += $SIZE;'], # asin
    ['acos', [ADR, VAL], 400, 'MEM1 = acos(MEM2);iptr += $SIZE;'], # acos
    ['atan', [ADR, VAL], 400, 'MEM1 = atan(MEM2);iptr += $SIZE;'], # atan
    ['ln', [ADR, VAL], 500, 'MEM1 = ln(MEM2);iptr += $SIZE;'],
    ['log', [ADR, VAL], 500, 'MEM1 = log(MEM2);iptr += $SIZE;'],
    ['antiln', [ADR, VAL], 500, 'MEM1 = antiln(MEM2);iptr += $SIZE;'], # e^
    ['antilog', [ADR, VAL], 500, 'MEM1 = antilog(MEM2);iptr += $SIZE;'], # 10^
    
    ['min', [ADR, VAL, VAL], 30, 'if (MEM2 < MEM3) {MEM1 = MEM2;} else {MEM1 = MEM3;}iptr += $SIZE;'], # min of 2 values
    ['max', [ADR, VAL, VAL], 30, 'if (MEM2 > MEM3) {MEM1 = MEM2;} else {MEM1 = MEM3;}iptr += $SIZE;'], # max of 2 values

    ['random', [ADR, VAL, VAL], 40, 'MEM1 = random(MEM2, MEM3);iptr += $SIZE;'], # pick random
    ['atan2', [ADR, VAL, VAL], 400, 'MEM1 = ATAN2(MEM2, MEM3);iptr += $SIZE;'], # direction from vector
    ['mag2', [ADR, VAL, VAL], 400, 'MEM1 = VEC2_LEN(MEM2, MEM3);iptr += $SIZE;'], # 2d vector magnitude
    ['letter_of', [ADR, VAL, VAL], 500, 'MEM1 = MEM2[MEM3];iptr += $SIZE;'],
    ['join', [ADR, VAL, VAL], 500, 'MEM1 = MEM2 & MEM3;iptr += $SIZE;'],

    ['lerp', [ADR, VAL, VAL, VAL], 200, 'MEM1 = LERP(MEM2, MEM3, MEM4);iptr += $SIZE;'], # linear interpolation
    ['unlerp', [ADR, VAL, VAL, VAL], 800, 'MEM1 = UNLERP(MEM2, MEM3, MEM4);iptr += $SIZE;'], # undo linear interpolation
    ['select', [ADR, VAL, VAL, VAL], 100, 'if MEM2 {MEM1 = MEM3;} else {MEM1 = MEM4;}iptr += $SIZE;'], # pick a if true, b if false

    # project-specific:

    ['print', [VAL], 2000, 'add MEM1 to output;iptr += $SIZE;'],

    ['clear_canvas', [VAL, VAL, VAL], 500, 'clear_canvas MEM1, MEM2, MEM3;iptr += $SIZE;'],
    ['get_canvas_size', [ADR, ADR, ADR], 500, 'MEM1=canvas_size_x;MEM2=canvas_size_y;MEM3=canvas_size_z;iptr += $SIZE;'],
    ['add_canvas_as_template', [], 500, 'add_canvas_as_template;iptr += $SIZE;'],

    ['reset_depositor', [], 500, 'reset_depositor;iptr += $SIZE;'],
    ['set_depositor_to_air', [], 500, 'set_depositor_to_air;iptr += $SIZE;'],
    ['set_depositor_from_sRGB', [VAL, VAL, VAL], 500, 'set_depositor_from_sRGB MEM1, MEM2, MEM3;iptr += $SIZE;'],
    ['set_depositor_from_HSV', [VAL, VAL, VAL], 500, 'set_depositor_from_HSV MEM1, MEM2, MEM3;iptr += $SIZE;'],
    ['set_depositor_from_voxel', [VAL, VAL, VAL], 500, 'set_depositor_from_voxel MEM1, MEM2, MEM3;iptr += $SIZE;'],
    ['set_depositor_to_template', [VAL, VAL, VAL, VAL], 500, 'set_depositor_to_template MEM1, MEM2, MEM3, MEM4;iptr += $SIZE;'],
    ['set_depositor_opacity', [VAL], 500, 'depositor_voxel.opacity=MEM1;iptr += $SIZE;'],
    ['set_depositor_emission', [VAL], 500, 'depositor_voxel.emission=MEM1;iptr += $SIZE;'],
    ['get_depositor', [ADR, ADR, ADR, ADR, ADR], 500, 'MEM1=depositor_voxel.r;MEM2=depositor_voxel.g;MEM3=depositor_voxel.b;MEM4=depositor_voxel.opacity;MEM5=depositor_voxel.emission;iptr += $SIZE;'],

    ['set_voxel', [VAL, VAL, VAL], 500, 'set_voxel MEM1, MEM2, MEM3;iptr += $SIZE;'],
    ['draw_ray', [VAL, VAL, VAL, VAL, VAL, VAL, VAL], 500, 'draw_ray MEM1, MEM2, MEM3, MEM4, MEM5, MEM6, MEM7;iptr += $SIZE;'],
    ['draw_cuboid_corner_size', [VAL, VAL, VAL, VAL, VAL, VAL], 500, 'draw_cuboid_corner_size MEM1, MEM2, MEM3, MEM4, MEM5, MEM6;iptr += $SIZE;'],
    ['draw_sphere', [VAL, VAL, VAL, VAL], 500, 'draw_sphere MEM1, MEM2, MEM3, MEM4;iptr += $SIZE;'],
    ['draw_cylinder', [VAL, VAL, VAL, VAL, VAL], 500, 'draw_cylinder MEM1, MEM2, MEM3, MEM4, MEM5;iptr += $SIZE;'],
    ['generate_value_noise', [VAL, VAL, VAL, VAL], 500, 'generate_value_noise MEM1, MEM2, MEM3, MEM4, true;iptr += $SIZE;'],
    
]


# format instructions with goboscript code
for ins in instructions:
    if len(ins) == 3:
        ins.append(f'# {ins[0]}')
    else:
        ins[3] = str.replace(ins[3], '$SIZE', str(1+len(ins[1])))
        
        if 'iptr' not in ins[3]:
            raise Exception(f'instruction lacks instruction pointer handling, code will get stuck: {ins[3]}')
        


# ordered most common to least for optimisation
instructions_sorted = sorted(instructions, key=lambda ins: ins[2])


if __name__ == '__main__':

    output = []

    output.append(f'# number of instructions: {len(instructions_sorted)}')

    output.append('list instruction_names = ['+','.join([f'"{item[0]}"' for item in instructions_sorted])+'];')

    output.append('list instruction_args = ['+','.join([f'"{''.join(item[1])}"' for item in instructions_sorted])+'];')

    # create if-else statements
    INDENT = '    '
    IF = 'if (opcode < NUM) {'
    ELSE = '} else {'
    END = '}'

    def add_ln(text):
        output.append(text)
        #print(text)

    def print_branch(branch, depth=0):
        indent = INDENT * depth

        b1_index = search_tree.find_max_item(branch[0])

        add_ln(indent + IF.replace('NUM', str(b1_index + 1)))
        
        if isinstance(branch[0], int):
            add_ln((INDENT * (depth+1)) + f'# {branch[0]}: {instructions_sorted[branch[0]][0]}')
            add_ln((INDENT * (depth+1)) + instructions_sorted[branch[0]][3])
        else:
            print_branch(branch[0], depth+1)
        
        add_ln(indent + ELSE)
        
        if isinstance(branch[1], int):
            add_ln((INDENT * (depth+1)) + f'# {branch[1]}: {instructions_sorted[branch[1]][0]}')
            add_ln((INDENT * (depth+1)) + instructions_sorted[branch[1]][3])
        else:
            print_branch(branch[1], depth+1)
        
        add_ln(indent + END)


    #tree = search_tree.optimal_binary_tree_from_weights([max(item[2],50) for item in instructions_sorted])
    #print(tree)
    
    # custom tree (first splits are custom)
    weights = [item[2] for item in instructions_sorted]
    items = list(range(len(weights)))

    split1 = 16
    b1 = []
    search_tree._optimal_binary_tree(b1, items[:split1], weights[:split1])
    
    split2 = 34
    b2 = []
    search_tree._optimal_binary_tree(b2, items[split1:split2], weights[split1:split2])

    b3 = []
    search_tree._optimal_binary_tree(b3, items[split2:], weights[split2:])

    tree = [b1, [b2, b3]]



    search_tree.print_depths(tree, [item[0] for item in instructions_sorted])

    output.append('')
    output.append(INDENT * 2 + '######')
    output.append(INDENT * 2 + '# Following code generated by src/lang/instructions.py')
    output.append(INDENT * 2 + '# DO NOT EDIT MANUALLY')
    output.append(INDENT * 2 + '# Edit the source only and copy the output here.')
    
    print_branch(tree, 2)

    with open('src/lang/instructions.gs', 'w', encoding='utf8') as f:
        f.writelines([str(ln)+'\n' for ln in output])