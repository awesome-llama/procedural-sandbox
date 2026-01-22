# Clean up the scripts like the Scratch editor's "clean up blocks" function.

import copy

GRID_SIZE = 40 # The block grid is 40 units. Reporters are 40 units tall.
MARGIN = 8 # Additional space above+below a block's inputs (is still part of the block).

SCRIPT_SPACING = GRID_SIZE*2 # How much space to leave between separate scripts.


# Some hats should be closer to the top than others for readability:
HAT_PRIORITY = [
    'event_whenflagclicked',
    'event_whenkeypressed',
    'event_whenthisspriteclicked',
    'event_whenbroadcastreceived',
    'event_whengreaterthan',
    'control_start_as_clone',
    'procedures_definition',
]

# All blocks that are C shaped:
C_SHAPED_OPCODES = {'control_repeat', 'control_repeat_until', 'control_while', 'control_for_each', 'control_forever', 'control_if', 'control_if_else', 'control_all_at_once'}


def clean_target(target: dict):
    """Rearrange all scripts in a target."""

    blocks = target['blocks']

    # find all the parent blocks and sort them
    parents = []
    for block_id, block in blocks.items():
        if block['topLevel']:
            if block['opcode'] in HAT_PRIORITY:
                parents.append((block_id, HAT_PRIORITY.index(block['opcode'])))
            else:
                parents.append((block_id, 1000))
    parents.sort(key=lambda x: x[1])
    
    x = 0
    y = 0

    for parent in parents:
        block_id = parent[0]
        block = blocks[parent[0]]
        block['x'] = x
        block['y'] = y
        y += (_script_height(blocks, block_id)) + SCRIPT_SPACING



def _script_height(blocks, parent_id):
    """Find the height of an entire script by recursing though children."""
    
    h = _height_stack(blocks, parent_id)
    
    if blocks[parent_id]['opcode'] == 'procedures_definition':
        h += MARGIN * 2 # accounts for prototype stack block in definition
    
    # h += 36 # definition top
    # h += 18 # rounded top part of hat
    
    return h



def _height_stack(blocks, block_id):
    """Returns the height of a vertical stack of blocks."""

    if block_id is None: return 0

    block = blocks[block_id]

    h = GRID_SIZE + MARGIN # the base height of a stack block is grid size + margin above and below (it's larger than a reporter)

    if block['opcode'].startswith('pen_'):
        h += 8 # icons in extension blocks make them slightly taller

    inputs = copy.copy(block.get('inputs', {}))

    # add missing inputs
    if block['opcode'] in C_SHAPED_OPCODES and 'SUBSTACK' not in inputs:
        inputs['SUBSTACK'] = [2, None]
    if block['opcode'] == 'control_if_else' and 'SUBSTACK2' not in inputs:
        inputs['SUBSTACK2'] = [2, None]

    input_h = 0 # the input in the top part of the block such as repeat count
    nested_h_total = 0 # total height of all nested stacks

    for input_name, input in inputs.items():
        if input[0] == 2:
            if input_name == 'SUBSTACK' or input_name == 'SUBSTACK2':
                # stack
                nested_h_total += max(24, _height_stack(blocks, input[1])) # empty slot or nested script
                nested_h_total += 32 # bottom part of C shape

            else:
                # boolean
                input_h = max(input_h, _height_reporter_input(blocks, input[1]) + MARGIN)

        elif input[0] == 3:
            # round reporter
            input_h = max(input_h, _height_reporter_input(blocks, input[1]) + MARGIN)

    h = max(h, input_h)
    h += nested_h_total
    
    # next stack block
    if block['next'] is not None:
        h += _height_stack(blocks, block['next'])
    
    return h



def _height_reporter_input(blocks, block_id):
    """Returns the height of a reporter."""

    if block_id is None: return 0

    if not isinstance(block_id, str):
        return GRID_SIZE # input not occupied by block
    
    block = blocks[block_id]

    h = GRID_SIZE
    for input_name, input in block.get('inputs', {}).items():
        if input[0] == 2 and input[1] is not None:
            # boolean
            h = max(h, _height_reporter_input(blocks, input[1]) + MARGIN)
            
        elif input[0] == 3 and input[1] is not None:
            # round reporter
            h = max(h, _height_reporter_input(blocks, input[1]) + MARGIN)
    
    return h


