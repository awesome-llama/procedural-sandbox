import itertools


def add_id(ids_list: set, new_id, index_offset_from_id):
    """Add an id to ids_list and prevent duplicates. Skip if empty."""

    if new_id != '' and new_id is not None:
        if new_id in ids_list: raise Exception(f'id already exists: {new_id}')
        ids_list[new_id] = index_offset_from_id


class Element:
    def __init__(self):
        self.items = []

    def to_flat_list(self, ids_list):
        return list(self.items)


class Label(Element):
    def __init__(self, text, color=''): # color should start with hash as it's fed directly into the pen color
        super().__init__()
        self.items = ['LABEL', text, color]

    @staticmethod
    def title(text):
        # create a label suitable for a panel title
        return Label(text, "#FF8CFF")


class TextBlock(Element):
    # label but wrapped text for longer bits of information
    def __init__(self, text, color=''):
        super().__init__()
        self.items = ['TEXTBLOCK', text, color]


class Separator(Element):
    def __init__(self, width_fac=1, height=3):
        super().__init__()
        self.items = ['SEPARATOR', max(0, width_fac), height]


class Button(Element):
    def __init__(self, label, id='', action='broadcast', action_data=''):
        # id needs to be unique
        super().__init__()
        if action == 'broadcast' and (action_data == '' or action_data is None):
            action_data = id
        self.items = ['BUTTON', label, id, action, action_data]

    def to_flat_list(self, ids_list):
        add_id(ids_list, self.items[2], -2)
        return list(self.items)
    
    @staticmethod
    def set_page(label, id, page):
        # create a button that sets the page
        return Button(label, id, action='set_page', action_data=page)
    
    @staticmethod
    def run_command(label, id, command):
        # create a button that runs a command
        return Button(label, id, action='command', action_data=command)


class Checkbox(Element):
    def __init__(self, label, id='', checked=False):
        super().__init__()
        self.items = ['CHECKBOX', label, id, int(checked), int(checked)]

    def to_flat_list(self, ids_list):
        add_id(ids_list, self.items[2], -2)
        return list(self.items)


class Value(Element):
    def __init__(self, label, id='', value=0, soft_min=0, soft_max=1, hard_min='-Infinity', hard_max='Infinity', snap_frac=100, shape='sep'):
        super().__init__()
        if float(soft_max) < float(soft_min):
            raise Exception('soft limit interval is inverted')
        if float(hard_max) < float(hard_min):
            raise Exception('hard limit interval is inverted')
        
        self.items = ['VALUE', label, id, value, value, soft_min, soft_max, hard_min, hard_max, snap_frac, shape]

    def to_flat_list(self, ids_list):
        add_id(ids_list, self.items[2], -2)
        return list(self.items)
    
    @staticmethod
    def fraction(label, id, value=0):
        # create a slider always between 0-1
        return Value(label, id, value, 0, 1, hard_min=0, hard_max=1, snap_frac=1000, shape='full')
    
    @staticmethod
    def canvas_size(label, id, value=64, soft_max=None):
        # create a value representing a canvas dimension. Always >= 0.
        if soft_max is None: soft_max = 512
        return Value(label, id, value, 1, soft_max, hard_min=0, hard_max=4096, snap_frac=1)


class Color(Element):
    def __init__(self, label='Color', id='', color='#808080'):
        if color.startswith('#'): color = color[1:] # remove hash
        if len(color) != 6: raise ValueError('color must be 6 hexadecimal digits')
        super().__init__()
        self.items = ['COLOR', label, id, int(color, 16), int(color, 16)]

    def to_flat_list(self, ids_list):
        add_id(ids_list, self.items[2], -2)
        return list(self.items)


class End(Element):
    # End indicates the end of a list of components.
    # It doesn't recurse, all other components assume another follows at the same indent.

    def __init__(self):
        super().__init__()
        self.items = ['END']


class Expander(Element):
    def __init__(self, label, id='', is_open=True, children:list = None):
        super().__init__()
        if children is None: children = []
        self.children = children + [End()] # end the child list
        
        self.items = ['EXPANDER', label, id, int(is_open), None] # length of child data uncomputed

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
    
    def to_flat_list(self, ids_list):
        return list(itertools.chain.from_iterable([c.to_flat_list(ids_list) for c in self.children]))


if __name__ == '__main__':
    pass

