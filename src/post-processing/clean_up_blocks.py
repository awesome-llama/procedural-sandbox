GRID_SIZE = 40 # the block grid is 40 units. Reporters are 40 units tall
MARGIN = 8

SCRIPT_SPACING = GRID_SIZE*2


# some hats should be closer to the top than others for readability
HAT_PRIORITY = [
    'event_whenflagclicked',
    'event_whenkeypressed',
    'event_whenthisspriteclicked',
    'event_whenbroadcastreceived',
    'event_whengreaterthan',
    'control_start_as_clone',
    'procedures_definition',
]


def clean_target(target):
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
        y += (script_height(blocks, block_id)) + SCRIPT_SPACING


def script_height(blocks, parent_id):
    # recurse though children to find dimensions of each block
    
    h = _height_stack(blocks, parent_id)
    
    if blocks[parent_id]['opcode'] == 'procedures_definition':
        h += MARGIN*2 # definition hats are tall
    
    # h += 36 # definition
    # h += 18 # rounded top part of hat
    
    return h


def _height_stack(blocks, block_id):
    block = blocks[block_id]

    h = GRID_SIZE + MARGIN # stack height

    if block['opcode'].startswith('pen_'):
        h += 8 # pen blocks are slightly taller due to the icon

    input_h = 0
    nested_h = 0
    for input_name, input in block.get('inputs', {}).items():
        if input[0] == 2 and input[1] is not None:
            if input_name == 'SUBSTACK' or input_name == 'SUBSTACK2':
                # stack
                nested_h += _height_stack(blocks, input[1])
                nested_h += 32 # bottom part of C shape
            else:
                # boolean
                input_h = max(input_h, _height_reporter_input(blocks, input[1]) + MARGIN)
            
        elif input[0] == 3 and input[1] is not None:
            # round reporter
            input_h = max(input_h, _height_reporter_input(blocks, input[1]) + MARGIN)
    
    h = max(h, input_h)
    h += nested_h
    
    # next stack block
    if block['next'] is not None:
        h += _height_stack(blocks, block['next'])
    
    return h



def _height_reporter_input(blocks, block_id):
    if block_id is None: 
        return 0
    if not isinstance(block_id, str):
        return GRID_SIZE
    
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


