"""Create the option lists for the various generators"""

import itertools

LINE_HEIGHT = 16

def add_id(ids_list: set, new_id, index_offset_from_id):
    if new_id != '':
        if new_id in ids_list: raise Exception(f'id already exists: {new_id}')
        ids_list[new_id] = index_offset_from_id

class Element:
    def __init__(self):
        self.items = []

    def get_height(self):
        return LINE_HEIGHT

    def to_flat_list(self, ids_list):
        return list(self.items)


class Label(Element):
    def __init__(self, text):
        super().__init__()
        self.items = ['LABEL', text]

class Separator(Element):
    def __init__(self, width_fac=1, height=3):
        super().__init__()
        self.items = ['SEPARATOR', max(0, width_fac), height]

    def get_height(self):
        return self.items[2]

class Button(Element):
    def __init__(self, label, id='', action='run', action_data=''):
        # id needs to be unique
        super().__init__()
        self.items = ['BUTTON', label, id, action, action_data, 0] # 0 is default false (unclicked)

    def get_height(self):
        return LINE_HEIGHT + 2

    def to_flat_list(self, ids_list):
        add_id(ids_list, self.items[2], -2)
        return list(self.items)
    
    @staticmethod
    def set_page(label, id, page):
        # create a button that sets the page
        return Button(label, id, action='set_page', action_data=page)

class Checkbox(Element):
    def __init__(self, label, id='', checked=False):
        super().__init__()
        self.items = ['CHECKBOX', label, id, int(checked)]

    def to_flat_list(self, ids_list):
        add_id(ids_list, self.items[2], -2)
        return list(self.items)

class Value(Element):
    def __init__(self, label, id='', value=0, soft_min=0, soft_max=1, hard_min="-Infinity", hard_max="Infinity", snap_frac=100):
        super().__init__()
        self.items = ['VALUE', label, id, value, soft_min, soft_max, hard_min, hard_max, snap_frac]

    def to_flat_list(self, ids_list):
        add_id(ids_list, self.items[2], -2)
        return list(self.items)

class Color(Element):
    def __init__(self, label='Color', id='', color="808080"):
        #if len(color) != 6: raise ValueError('color must be 6 hexadecimal digits')
        super().__init__()
        self.items = ['COLOR', label, id, int(color, 16)]

    def to_flat_list(self, ids_list):
        add_id(ids_list, self.items[2], -2)
        return list(self.items)

class End(Element):
    # End indicates the end of a list of components.
    # Its feature is that it doesn't recurse, all other components assume another follows at the same indent.

    def __init__(self):
        super().__init__()
        self.items = ['END']

    def get_height(self):
        return 0

class Expander(Element):
    def __init__(self, label, id='', is_open=True, children:list = None):
        super().__init__()
        if children is None: children = []
        self.children = children + [End()] # end the child list
        
        self.items = ['EXPANDER', label, id, int(is_open), None] # length of child data uncomputed

    def get_height(self):
        return LINE_HEIGHT + 3 + sum([c.get_height() for c in self.children])

    def to_flat_list(self, ids_list):
        add_id(ids_list, self.items[2], -2)
        _items = list(self.items)
        _children = list(itertools.chain.from_iterable([c.to_flat_list(ids_list) for c in self.children]))
        _items[-1] = len(_items)+len(_children)
        return _items + _children

class Container(Element):
    # special case, no additional properties, just an element with children
    def __init__(self, children:list = None):
        super().__init__()
        if children is None: children = []
        self.children = children + [End()] # end the child list

    def get_height(self):
        return sum([c.get_height() for c in self.children])
    
    def to_flat_list(self, ids_list):
        return list(itertools.chain.from_iterable([c.to_flat_list(ids_list) for c in self.children]))


panels = {}

panels['gen.maze'] = Container([
    Label('Maze'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value('Cell count', 'gen.maze.cell_count', 24, 1, 64, 1, 1024, 1),
        Value('Cell size', 'gen.maze.cell_size', 2, 1, 8, 1, 256, 1),
        Value('Wall thickness', 'gen.maze.wall_thickness', 1, 1, 8, 1, 256, 1),
        Value('Pertubation', 'gen.maze.pertubation', 0.5, 0, 1, snap_frac=100),
    ]),
    Expander('Color', '', True, [
        Color('Ground color', 'gen.maze.ground_col', 'ffffff'),
        Color('Wall color', 'gen.maze.wall_col', '000000'),
    ]),
    Button('Generate', 'gen.maze.generate'),
])

panels['gen.city'] = Container([
    Label('City'),
    Expander('Canvas', '', True, [
        Value('Size X', 'gen.city.size_x', 64, 1, 512, 0, 4096, 1),
        Value('Size Y', 'gen.city.size_y', 64, 1, 512, 0, 4096, 1),
        Value('Size Z', 'gen.city.size_z', 16, 1, 512, 0, 4096, 1),
    ]),
    Expander('Color', '', True, [
        Color('Ground color', 'gen.city.ground_col', 'aaaaaa'),
    ]),
    Button('Generate', 'gen.city.generate'),
])

panels['gen.pipelines'] = Container([
    Label('Pipelines'),
    Expander('Canvas', '', True, [
        Value('Size X', 'gen.pipelines.size_x', 64, 1, 512, 0, 4096, 1),
        Value('Size Y', 'gen.pipelines.size_y', 64, 1, 512, 0, 4096, 1),
        Value('Size Z', 'gen.pipelines.size_z', 16, 1, 512, 0, 4096, 1),
    ]),
    Expander('Color', '', True, [
        Color('Ground color', 'gen.pipelines.ground_col', 'aaaaaa'),
    ]),
    Button('Generate', 'gen.pipelines.generate'),
])

panels['gen.erosion'] = Container([
    Label('Hydraulic erosion'),
    Expander('Initial terrain', '', True, [
        Value('Size X', 'gen.erosion.size_x', 64, 1, 512, 0, 4096, 1),
        Value('Size Y', 'gen.erosion.size_y', 64, 1, 512, 0, 4096, 1),
        Value('Size Z', 'gen.erosion.size_z', 16, 1, 512, 0, 4096, 1),
        Separator(),
        #Checkbox('Perlin', 'perlin'),
        Separator(),
        Button('Generate', 'gen.erosion.run_generate'),
    ]),
    Expander('Erode', '', True, [
        Value('Steps', 'gen.erosion.steps', 1, 0, 1000, 0, snap_frac=10),
        Value('Stream strength', 'gen.erosion.strength', 0.1, 0, 1, 0, snap_frac=100),
        Value('Stream capacity', 'gen.erosion.capacity', 5, 0, 10, 0, snap_frac=10),
        Button('Run', 'gen.erosion.run_erode'),
    ]),
    Expander('Finalise', '', True, [
        Value('Water level', 'gen.erosion.water_level_fac', 0.2, 0, 1, snap_frac=1000),
        Color('Water color', 'gen.erosion.water_col', '505090'),
        Value('Grass amount', 'gen.erosion.grass_fac', 0.5, 0, 1, snap_frac=1000),
        Color('Grass color', 'gen.erosion.grass_col', '70aa60'),
        Value('Tree amount', 'gen.erosion.tree_fac', 0.2, 0, 1, snap_frac=1000),
        Button('Run', 'gen.erosion.run_finalise'),
    ]),
])

panels['io.save_canvas'] = Container([
    Label('Save canvas'),
    Separator(),
    Label('All data remains intact'),
    Checkbox('Include opacity', 'io.save_canvas.include_opacity', True),
    Button('Save', 'io.save_canvas.save'),
])

panels['io.import_height_map'] = Container([
    Label('Import height map'),
    Expander('Canvas', '', True, [
        Checkbox('Erase canvas', 'io.import_height_map.erase_canvas', True),
        Value('New size Z', 'io.import_height_map.size_z', 16, 1, 512, 0, 4096, 1),
        Color('New voxel color', 'io.import_height_map.new_color', 'aaaaaa'),
    ]),
    Expander('Channel weights', '', True, [
        Value('Red', 'io.import_height_map.weight_r', 0.25, 0, 1, snap_frac=1000),
        Value('Green', 'io.import_height_map.weight_g', 0.5,  0, 1, snap_frac=1000),
        Value('Blue', 'io.import_height_map.weight_b', 0.25, 0, 1, snap_frac=1000),
        Label('All usually should add to 1'),
    ]),
    Expander('Remap height', '', True, [
        Value('Map 0 to height', 'io.import_height_map.map_0', 0, -2, 2, snap_frac=100),
        Value('Map 1 to height', 'io.import_height_map.map_1', 1, -2, 2, snap_frac=100),
    ]),
    Button('Input height map', 'io.import_height_map.btn_input_height_map'),
])

panels['io.import_color_map'] = Container([
    Label('Import color map'),
    Separator(),
    Checkbox('Crop if size mismatch', 'io.import_color_map.crop', True),
    Checkbox('Interpret as linear', 'io.import_color_map.interpret_linear', False),
    Button('Input color map', 'io.import_color_map.btn_input_color_map'),
])

panels['io.export_height_map'] = Container([
    Label('Export'),
    Separator(),
    Label('Normalised heights'),
    Value('Map 0 to value', 'io.export_height_map.map_0', 0, -2, 2, snap_frac=100),
    Value('Map 1 to value', 'io.export_height_map.map_1', 1, -2, 2, snap_frac=100),
    Button('Export as TextImage', 'io.export_height_map.btn_export'),
])

panels['project.settings'] = Container([
    Label('Project settings'),
    Separator(),
    Checkbox('Dark background', 'project.settings.bg_dark', True),
    Value('Slider sensitivity', 'project.settings.slider_sensitivity', 200, 10, 1000, 0, 10000, 0.1),
])

panels['project.credits'] = Container([
    Label('Created by awesome-llama'),
    Label('Developed w/ goboscript'),
    Separator(),
    Label('2025'),
])



def btn_menu_set_page(label, page):
    return Button.set_page(label, 'menu.'+page, page)


panels['menu.io'] = Container([
    Separator(0),
    btn_menu_set_page('New canvas', 'io.new_canvas'),
    btn_menu_set_page('Save canvas', 'io.save_canvas'),
    btn_menu_set_page('Load canvas', 'io.load_canvas'),
    Separator(),
    btn_menu_set_page('Import height map', 'io.import_height_map'),
    btn_menu_set_page('Import color map', 'io.import_color_map'),
    btn_menu_set_page('Export height map', 'io.export_height_map'),
    #btn_menu_set_page('Export .stl point cloud', 'io.export_stl'),
])

panels['menu.gen'] = Container([
    Separator(0),
    btn_menu_set_page('Maze', 'gen.maze'),
    btn_menu_set_page('City', 'gen.city'),
    btn_menu_set_page('Pipelines', 'gen.pipelines'),
    btn_menu_set_page('Erosion', 'gen.erosion'),
])

panels['menu.fx'] = Container([
    Separator(0),
    Label('Effects'),
])

panels['menu.draw'] = Container([
    Separator(0),
    Label('Draw'),
])



# GENERATE LISTS

element_list = [""] # element data
panel_lookup = [] # list of where the panels begin
element_lookup = [] # k-v tuple list of where the elements are

element_ids = {}

for name, p in panels.items(): 
    p: Element
    flat = p.to_flat_list(element_ids)
    if flat[-1] != End().items[0]: raise Exception('missing end')

    panel_lookup.append(name)
    panel_lookup.append(1+len(element_list))
    
    element_list.extend(flat)

for e, offset in element_ids.items():
    element_lookup.append((e, element_list.index(e)+offset+1))

# SAVE

with open('UI/UI_data.txt', 'w') as f:
    f.writelines([f"{l}\n" for l in element_list])

with open('UI/UI_data_panels.txt', 'w') as f:
    f.writelines([f"{p}\n" for p in panel_lookup])

with open('UI/UI_data_element_id.txt', 'w') as f:
    f.writelines([f"{l[0]}\n" for l in element_lookup])

with open('UI/UI_data_element_index.txt', 'w') as f:
    f.writelines([f"{l[1]}\n" for l in element_lookup])
