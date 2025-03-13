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
    def __init__(self, label, id, value=0, soft_min=0, soft_max=1, hard_min="-Infinity", hard_max="Infinity", snap_frac=0.01):
        super().__init__()
        self.items = ['VALUE', label, id, value, soft_min, soft_max, hard_min, hard_max, snap_frac]

class Color(Element):
    def __init__(self, label='Color', id='', color="#808080"):
        super().__init__()
        self.items = ['COLOR', label, id, color]

class End(Element):
    def __init__(self):
        super().__init__()
        self.items = ['END']

    def get_height(self):
        return 0

class Expander(Element):
    def __init__(self, label, id, open=True, children:list = None):
        super().__init__()
        if children is None: children = []
        self.children = children + [End()]

        children_list_height = sum([c.get_height() for c in self.children])
        
        self.items = ['EXPANDER', label, id, int(open), children_list_height, None] # height, length

    def get_height(self):
        return LINE_HEIGHT + 3 + self.items[4]

    def to_flat_list(self):
        _items = list(self.items)
        _children = list(itertools.chain.from_iterable([c.to_flat_list() for c in self.children]))
        _items[5] = 6+len(_children)
        return _items + _children

class Container(Element):
    # special case, no additional properties, just an element with children
    def __init__(self, children):
        super().__init__()
        if children is None: children = []
        self.children = children + [End()]

    def get_height(self):
        return sum([c.get_height() for c in self.children])
    
    def to_flat_list(self):
        return list(itertools.chain.from_iterable([c.to_flat_list() for c in self.children]))



gen_opt = Container([
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

element_list = gen_opt.to_flat_list()

with open('UI_data.txt', 'w') as f:
    f.writelines([f"{l}\n" for l in element_list])
