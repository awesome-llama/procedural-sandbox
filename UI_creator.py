"""Create the option lists for the various generators"""

import itertools

LINE_HEIGHT = 16

class Element:
    def __init__(self):
        self.items = []

    def get_height(self):
        return LINE_HEIGHT

    def to_flat_list(self):
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
    def __init__(self, label, id):
        super().__init__()
        self.items = ['BUTTON', label, id, 0] # 0 is default false (unclicked)

    def get_height(self):
        return LINE_HEIGHT + 2

class Checkbox(Element):
    def __init__(self, label, id, checked=False):
        super().__init__()
        self.items = ['CHECKBOX', label, id, int(checked)]

class Value(Element):
    def __init__(self, label, id, value=0, soft_min=0, soft_max=1, hard_min="-Infinity", hard_max="Infinity", snap_frac=100):
        super().__init__()
        self.items = ['VALUE', label, id, value, soft_min, soft_max, hard_min, hard_max, snap_frac]

    def val_fac(self, label, id, value=0, snap_frac=100):
        return Value(label, id, value, 0, 1, "-Infinity", "Infinity", snap_frac)

class Color(Element):
    def __init__(self, label='Color', id='', color="#808080"):
        super().__init__()
        self.items = ['COLOR', label, id, color]

class End(Element):
    # End indicates the end of a list of components.
    # Its feature is that it doesn't recurse, all other components assume another follows at the same indent.

    def __init__(self):
        super().__init__()
        self.items = ['END']

    def get_height(self):
        return 0

class Expander(Element):
    def __init__(self, label, id, open=True, children:list = None):
        super().__init__()
        if children is None: children = []
        self.children = children + [End()] # end the child list
        
        self.items = ['EXPANDER', label, id, int(open), None] # length of child data uncomputed

    def get_height(self):
        return LINE_HEIGHT + 3 + sum([c.get_height() for c in self.children])

    def to_flat_list(self):
        _items = list(self.items)
        _children = list(itertools.chain.from_iterable([c.to_flat_list() for c in self.children]))
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
    
    def to_flat_list(self):
        return list(itertools.chain.from_iterable([c.to_flat_list() for c in self.children]))

"""class Dialog(Element):
    # panel
    def __init__(self, title, id, title_color="#808080", show_close_btn=True, children:list = None):
        super().__init__()
        if children is None: children = []
        self.children = children + [End()] # end the child list

        self.items = ['EXPANDER', title, id, title_color, int(show_close_btn), None] # length of child data uncomputed

    def get_height(self):
        return LINE_HEIGHT + 3 + sum([c.get_height() for c in self.children])
    
    def to_flat_list(self):
        _items = list(self.items)
        _children = list(itertools.chain.from_iterable([c.to_flat_list() for c in self.children]))
        _items[-1] = len(_items)+len(_children)
        return _items + _children
"""

testing = Container([
    Label('Example'),
    Expander('Canvas', 'exp1', True, [
        Value('Canvas size x', 'size_x', 64, 1, 512, 0, 4096, 1),
        Value('Canvas size y', 'size_y', 64, 1, 512, 0, 4096, 1),
        Value('Canvas size z', 'size_z', 64, 1, 512, 0, 4096, 1),
    ]),
    Expander('Expander', 'exp2', True, [
        Button('Button1', 'btn1'),
        Checkbox('Checkbox', 'cb1'),
        Color('Col', 'col1', '#ff3000'),
        Button('Button2', 'btn2'),
    ]),
    Value('Val', 'v2', 0.5, 0, 1, 0, 1, 10000),
    Separator(),
    Checkbox('Checkbox2', 'cb2'),
])

project_settings = Container([
    Label('Project settings'),
    Expander('Display', 'expander_display', True, [
        Checkbox('Dark background', 'bg_dark', True),
        Value('AO samples', 'ao_samples', 64, 1, 256, 1, 4096, 1),
        Checkbox('Checkbox2', 'cb2'),
        Color('Col', 'col1', '#ff3000'),
    ]),
    Expander('Misc', 'expander_2', True, [
        Value('Mouse sensitivity', 'slider_sensitivty', 200, 10, 1000, 0, 10000, 0.1),
        Button('Button1', 'btn1'),
    ]),
    Checkbox('Developer mode', 'dev'),
    Button('Reset project', 'reset'),
])

erosion = Container([
    Label('Hydraulic erosion'),
    Expander('Initial terrain', 'exp_initial_terr', True, [
        Value('Size x', 'size_x', 64, 1, 512, 0, 4096, 1),
        Value('Size y', 'size_y', 64, 1, 512, 0, 4096, 1),
        Value('Size z (height)', 'size_z', 16, 1, 512, 0, 4096, 1),
        Checkbox('Perlin', 'perlin'),
        Button('Generate', 'generate_terrain'),
    ]),
    Expander('Erode', 'exp_erode', True, [
        Value('Steps', 'steps', 1, 0, 1000, 0, snap_frac=10),
        Value('Stream strength', 'strength', 0.1, 0, 1, 0, snap_frac=100),
        Value('Stream capacity', 'capacity', 5, 0, 10, 0, snap_frac=10),
        Button('Run', 'run'),
    ]),
    Expander('Finalise', 'exp_finalise', True, [
        Value('Water level', 'water level fac', 0.2, 0, 1, snap_frac=1000),
        Color('Water col', 'water col', '#505090'),
        Value('Grass amount', 'grass', 0.5, 0, 1, snap_frac=1000),
        Color('Grass col', 'water col', '#70aa60'),
        Button('Run', 'run'),
    ]),
])

import_height_map = Container([
    Label('Import height map'),
    Expander('Channel weights', '?', True, [
        Value('Red', 'weight_r', 0.25, 0, 1, snap_frac=1000),
        Value('Green', 'weight_g', 0.5,  0, 1, snap_frac=1000),
        Value('Blue', 'weight_b', 0.25, 0, 1, snap_frac=1000),
        Label('All usually should add to 1'),
    ]),
    Expander('Remap height', '?', True, [
        Value('Map 0 to', '?', 0, -2, 2, snap_frac=100),
        Value('Map 1 to', '?', 1, -2, 2, snap_frac=100),
    ]),
    Expander('Color', '?', True, [
        Checkbox('Overwrite canvas color', '?', False),
        Color('New voxel color', '?', '#aaaaaa'),
    ]),
    Button('Input height map', '?'),
])

import_color_map = Container([
    Label('Import color map'),
    
    Expander('Color', '?', True, [
        Checkbox('Interpret as sRGB', '?', True),
        Checkbox('Overwrite color', '?', False),
        Color('Color', '?', '#aaaaaa'),
    ]),
    Button('Input color map', '?'),
])


panels = {
    'import_color_map': import_color_map,
    'import_height_map': import_height_map,
    'erosion': erosion,
    'project_settings': project_settings,
    'testing': testing,
}

# SAVE

element_lookup = []
element_list = []
for name, p in panels.items(): 
    flat = p.to_flat_list()
    if flat[-1] != End().items[0]: raise Exception('missing end')
    element_lookup.append(name)
    element_lookup.append(1+len(element_list))
    element_list.extend(flat)

with open('UI_data_lookup.txt', 'w') as f:
    f.writelines([f"{l}\n" for l in element_lookup])

with open('UI_data.txt', 'w') as f:
    f.writelines([f"{l}\n" for l in element_list])
