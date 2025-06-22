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
    ['jump_by', [LABEL, VAL], 30, 'iptr += MEM2;'], # jump by address offset
    ['call', [LABEL], 40, 'add iptr to call_stack;'],
    ['return', [], 40, 'iptr = call_stack["last"]+1;delete call_stack["last"];'],

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
    
    ['min', [ADR, VAL, VAL], 30, 'if (MEM3 < MEM4) {MEM2 = MEM3;} else {MEM2 = MEM4;}iptr += $SIZE;'], # min of 2 values
    ['max', [ADR, VAL, VAL], 30, 'if (MEM3 > MEM4) {MEM2 = MEM3;} else {MEM2 = MEM4;}iptr += $SIZE;'], # max of 2 values

    ['random', [ADR, VAL, VAL], 40, 'MEM2 = random(MEM3, MEM4);iptr += $SIZE;'], # pick random
    ['atan2', [ADR, VAL, VAL], 400, 'MEM2 = ATAN2(MEM3, MEM4);iptr += $SIZE;'], # direction from vector
    ['mag2', [ADR, VAL, VAL], 400, 'MEM2 = VEC2_LEN(MEM3, MEM4);iptr += $SIZE;'], # 2d vector magnitude
    ['letter_of', [ADR, VAL, VAL], 2000, 'MEM2 = MEM4[MEM3];iptr += $SIZE;'],
    ['join', [ADR, VAL, VAL], 2000, 'MEM2 = MEM3 & MEM4;iptr += $SIZE;'],

    ['lerp', [ADR, VAL, VAL, VAL], 200, 'MEM2 = LERP(MEM3, MEM4, MEM5);iptr += $SIZE;'], # linear interpolation
    ['unlerp', [ADR, VAL, VAL, VAL], 800, 'MEM2 = UNLERP(MEM3, MEM4, MEM5);iptr += $SIZE;'], # undo linear interpolation
    ['gate', [ADR, VAL, VAL, VAL], 100, 'if MEM3 {MEM2 = MEM4;} else {MEM2 = MEM5;}iptr += $SIZE;'], # pick a if true, b if false
    ['mag3', [ADR, VAL, VAL, VAL], 2000, 'MEM2 = VEC3_LEN(MEM3, MEM4, MEM5);iptr += $SIZE;'], # 3d vector magnitude

    ['print', [VAL], 2000, 'add MEM1 to output;iptr += $SIZE;'],

    ['special', [FIELD], 600, 'error "not implemented";stop_this_script;'], # no specific number of args
]


# format instructions with goboscript code
for ins in instructions:
    if len(ins) == 3:
        ins.append(f'# {ins[0]}')
    else:
        ins[3] = str.replace(ins[3], '$SIZE', str(1+len(ins[1])))


# ordered most common to least for optimisation
instructions_sorted = sorted(instructions, key=lambda ins: ins[2])


if __name__ == '__main__':

    output = []

    output.append(f'# number of instructions: {len(instructions_sorted)}')

    output.append('list instruction_names = ['+','.join([f'"{item[0]}"' for item in instructions_sorted])+'];')

    output.append('list instruction_args = ['+','.join([f'"{''.join(item[1])}"' for item in instructions_sorted])+'];')

    output.append('')
    
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


    tree = search_tree.optimal_binary_tree_from_weights([item[2] for item in instructions_sorted])
    print(tree)
    

    print_branch(tree, 0)

    with open('src/lang/instructions.gs', 'w', encoding='utf8') as f:
        f.writelines([str(ln)+'\n' for ln in output])