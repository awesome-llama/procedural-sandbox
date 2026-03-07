import itertools

type IdsList = dict[str, int]
type ScratchNum = float|int|str


class Element:
    """Parent class for interface elements. Does not have any function by itself."""
    def __init__(self):
        self.items = []

    def to_flat_list(self, ids_list:IdsList):
        return list(self.items)
    
    @staticmethod
    def add_id(ids_list:IdsList, new_id:str, index_offset_from_id:int):
        """Add an id to ids_list and prevent duplicates. Skip if empty."""

        if new_id != "" and new_id is not None:
            if new_id in ids_list: raise Exception(f"id already exists: {new_id}")
            ids_list[new_id] = index_offset_from_id


class Label(Element):
    """A single line of text, usually a title."""
    def __init__(self, text:str, color=""):
        super().__init__()
        self.items = ["LABEL", text, color]


class TextBlock(Element):
    """A block of text, supporting multiple lines with word-wrapping."""
    def __init__(self, text:str, color=""):
        super().__init__()
        self.items = ["TEXTBLOCK", text, color]


class Separator(Element):
    """A separating line or space. The line width is a factor between `0.0` and `1.0` while height is absolute."""
    def __init__(self, line_width_fac:ScratchNum=1, height:ScratchNum=3):
        super().__init__()
        self.items = ["SEPARATOR", line_width_fac, height]


class Button(Element):
    """A clickable button."""
    def __init__(self, label:str, id:str="", action:str="", action_data:str=""):
        super().__init__()
        self.items = ["BUTTON", label, id, action, action_data]

    def to_flat_list(self, ids_list:IdsList):
        self.add_id(ids_list, self.items[2], -2)
        return list(self.items)

    @staticmethod
    def broadcast(label, id:str, message:str=""):
        """Create a button that broadcasts a message with action `broadcast`. If left blank, broadcast its id."""
        if (message == ""): message = id
        return Button(label, id, action="broadcast", action_data=message)

    @staticmethod
    def set_page(label, id:str, page:str):
        """Create a button that sets a page with action `set_page`."""
        return Button(label, id, action="set_page", action_data=page)

    @staticmethod
    def command(label, id:str, command:str):
        """Create a button that runs a command with action `command`."""
        return Button(label, id, action="command", action_data=command)


class Checkbox(Element):
    """An input with a binary state - true and false."""
    def __init__(self, label:str, id:str="", checked=False):
        super().__init__()
        self.items = ["CHECKBOX", label, id, int(checked), int(checked)]

    def to_flat_list(self, ids_list:IdsList):
        self.add_id(ids_list, self.items[2], -2)
        return list(self.items)


class Value(Element):
    """An input for a numeric value."""
    def __init__(self, label, id:str="", value:ScratchNum=0, soft_min:ScratchNum=0, soft_max:ScratchNum=1, hard_min:ScratchNum="-Infinity", hard_max:ScratchNum="Infinity", snap_frac:ScratchNum=100, shape:str="sep"):
        super().__init__()
        if float(soft_max) < float(soft_min): raise Exception("soft limit interval is inverted")
        if float(hard_max) < float(hard_min): raise Exception("hard limit interval is inverted")

        self.items = ["VALUE", label, id, value, value, soft_min, soft_max, hard_min, hard_max, snap_frac, shape]

    def to_flat_list(self, ids_list:IdsList):
        self.add_id(ids_list, self.items[2], -2)
        return list(self.items)

    @staticmethod
    def fraction(label, id:str, value:ScratchNum=0):
        """Create a slider always between `0.000` and `1.000`."""
        return Value(label, id, value, 0, 1, hard_min=0, hard_max=1, snap_frac=1000, shape="full")


class Color(Element):
    """An input for a color."""
    def __init__(self, label="Color", id:str="", color="#808080"):
        if color.startswith("#"): color = color[1:] # remove hash
        if len(color) != 6: raise ValueError("color must be 6 hexadecimal digits")
        super().__init__()
        self.items = ["COLOR", label, id, int(color, 16), int(color, 16)]

    def to_flat_list(self, ids_list:IdsList):
        self.add_id(ids_list, self.items[2], -2)
        return list(self.items)


class End(Element):
    """Indicates the end of a list of components at that indentation level."""
    def __init__(self):
        super().__init__()
        self.items = ["END"]


class Expander(Element):
    """A box that can open and close. A list of elements is contained inside."""
    def __init__(self, label:str, id:str="", is_open=True, children:list|None = None):
        super().__init__()
        if children is None: children = []
        self.children = children + [End()] # end the child list

        self.items = ["EXPANDER", label, id, int(is_open), None] # length of child data uncomputed

    def to_flat_list(self, ids_list:IdsList):
        self.add_id(ids_list, self.items[2], -2)
        _items = list(self.items)
        _children = list(itertools.chain.from_iterable([c.to_flat_list(ids_list) for c in self.children]))
        _items[-1] = len(_items)+len(_children)
        return _items + _children


class Container(Element):
    """A generic style-less container for the purpose of constructing the UI data list. Guarantees that the element list is terminated correctly."""
    def __init__(self, children:list|None = None):
        super().__init__()
        if children is None: children = []
        self.children = children + [End()] # end the child list

    def to_flat_list(self, ids_list:IdsList):
        return list(itertools.chain.from_iterable([c.to_flat_list(ids_list) for c in self.children]))



def save_elements(elements:dict[str,Container], directory:str="src/UI/"):
    """Save a dictionary of UI elements."""

    element_list = [""]*10 # element data, initalised with empty items as a fail safe
    panel_lookup = [] # list of where the panels begin
    element_lookup = [] # k-v tuple list of where the elements are

    element_ids:IdsList = {}

    for name, p in elements.items(): 
        flat = p.to_flat_list(element_ids)
        if flat[-1] != End().items[0]: raise Exception("missing end")

        panel_lookup.append(name)
        panel_lookup.append(1+len(element_list))

        element_list.extend(flat)

    for e, offset in element_ids.items():
        element_lookup.append((e, element_list.index(e)+offset+1))

    # SAVE
    def save_list(path, data:list):
        with open(path, "w", encoding="UTF-8") as f:
            f.writelines([f"{elem}\n" for elem in data])

    save_list(directory + "UI_data.txt", element_list)
    save_list(directory + "UI_data_panels.txt", panel_lookup)

    # split tuples into separate lists:
    save_list(directory + "UI_data_element_id.txt", [l[0] for l in element_lookup])
    save_list(directory + "UI_data_element_index.txt", [l[1] for l in element_lookup])

    print(f"saved {len(element_list)} items")




if __name__ == "__main__":
    pass

