"""Create the option lists for the various generators"""

import itertools

"""Add an id to the ids list. Skip if empty."""
def add_id(ids_list: set, new_id, index_offset_from_id):
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

class Separator(Element):
    def __init__(self, width_fac=1, height=3):
        super().__init__()
        self.items = ['SEPARATOR', max(0, width_fac), height]

class Button(Element):
    def __init__(self, label, id='', action='broadcast', action_data=''):
        # id needs to be unique
        super().__init__()
        self.items = ['BUTTON', label, id, action, action_data, 0] # 0 is default false (unclicked)

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
    def __init__(self, label, id='', value=0, soft_min=0, soft_max=1, hard_min="-Infinity", hard_max="Infinity", snap_frac=100, shape='sep'):
        super().__init__()
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
    def __init__(self, label='Color', id='', color="808080"):
        if len(color) != 6: raise ValueError('color must be 6 hexadecimal digits')
        super().__init__()
        self.items = ['COLOR', label, id, int(color, 16), int(color, 16)]

    def to_flat_list(self, ids_list):
        add_id(ids_list, self.items[2], -2)
        return list(self.items)

class End(Element):
    # End indicates the end of a list of components.
    # Its feature is that it doesn't recurse, all other components assume another follows at the same indent.

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

################################

panels = {}


################################
#      High-speed access       #
################################

panels['popup.color_picker'] = Container([
    Label.title('Color picker'),
    Color('Color', 'popup.color_picker.color', 'ff3000'),
    Value('Mode', 'popup.color_picker.mode', 0, 0, 3, snap_frac=1), # 0=HSV, 1=RGB
    
    Value.fraction('Hue', 'popup.color_picker.hue', 0.1),
    Value.fraction('Sat', 'popup.color_picker.sat', 0.4),
    Value.fraction('Val', 'popup.color_picker.val', 1.0),
    End(),
    
    Value.fraction('R', 'popup.color_picker.r', 0.1), # it's easier to be decimal
    Value.fraction('G', 'popup.color_picker.g', 0.8),
    Value.fraction('B', 'popup.color_picker.b', 1.0),
    End(),

    Button('Set from hex code', 'popup.color_picker.set_from_hex'),
    End(),
    Button('Cancel', 'popup.color_picker.cancel'),
    End(),
    Button('Apply', 'popup.color_picker.apply'),
    End(),
])



################################
#             Tabs             #
################################

def btn_menu_set_page(label, page):
    return Button.set_page(label, 'menu.'+page, page)

panels['menu.io'] = Container([
    Label.title('Import/Export'),
    Separator(),
    btn_menu_set_page('New canvas', 'io.new_canvas'),
    Separator(0, 5),
    btn_menu_set_page('Save canvas', 'io.save_canvas'),
    Button('Load canvas', 'io.load_canvas.run'), # run button, no page
    Separator(0, 5),
    Button('Export rendered canvas', 'io.export_rendered_canvas.run'), # run button, no page
    
    Separator(0, 5),

    Label('Textures', '#baaaba'),
    btn_menu_set_page('Import height map', 'io.import_height_map'),
    btn_menu_set_page('Import color map', 'io.import_color_map'),
    btn_menu_set_page('Export height map', 'io.export_height_map'),
    
    Separator(0, 5),

    Label('3D models', '#baaaba'),
    Button('Export .ply point cloud', 'io.export_ply.run'), # run button, no page
])

panels['menu.gen'] = Container([
    Label.title('Generate'),
    Separator(),
    btn_menu_set_page('City', 'gen.city'),
    btn_menu_set_page('Nucleus', 'gen.nucleus'),
    btn_menu_set_page('Pipelines', 'gen.pipelines'),
    btn_menu_set_page('Wheel', 'gen.wheel'),
    Separator(0, 5),
    btn_menu_set_page('Erosion', 'gen.erosion'),
    btn_menu_set_page('Fibres', 'gen.fibres'),
    Separator(0, 5),
    btn_menu_set_page('Ballpit', 'gen.ballpit'),
    btn_menu_set_page('Maze', 'gen.maze'),
    btn_menu_set_page('Elem. cellular automata', 'gen.eca'),
    btn_menu_set_page('Extruded grid', 'gen.extruded_grid'),
])

panels['menu.fx'] = Container([
    Label.title('Effects'),
    Separator(),
    btn_menu_set_page('Translate', 'fx.translate'),
    btn_menu_set_page('Rotate', 'fx.rotate'),
    btn_menu_set_page('Scale', 'fx.scale'),
    Separator(0, 5),
    btn_menu_set_page('Crop XY', 'fx.crop_xy'),
    btn_menu_set_page('Mirror', 'fx.mirror'),
    btn_menu_set_page('Gradient recolor', 'fx.recolor'),
    Separator(0, 5),
    btn_menu_set_page('Reshape', 'fx.reshape_canvas'),
])

panels['menu.draw'] = Container([
    Label.title('Draw'),
    Separator(),
])


################################
#              IO              #
################################

panels['io.new_canvas'] = Container([
    Label.title('New empty canvas'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value.canvas_size('Size X', 'io.new_canvas.size_x', 64),
        Value.canvas_size('Size Y', 'io.new_canvas.size_y', 64),
        Value.canvas_size('Size Z', 'io.new_canvas.size_z', 16, 64),
    ]),
    Expander('Base layer', '', True, [
        Checkbox('Include base layer', 'io.new_canvas.include_base', False),
        Color('Base color', 'io.new_canvas.base_col', '808080'),
    ]),
    Button('Create new canvas', 'io.new_canvas.run'),
])

panels['io.save_canvas'] = Container([
    Label.title('Save canvas'),
    Separator(),
    Label('Can be losslessly loaded later'),
    Expander('Layers', '', True, [
        Checkbox('Include opacity (alpha)', 'io.save_canvas.include_opacity', True),
        Checkbox('Include emission', 'io.save_canvas.include_emission', True),
    ]),
    Button('Save', 'io.save_canvas.run'),
])

panels['io.import_height_map'] = Container([
    Label.title('Import height map'),
    Separator(),
    Expander('Canvas', '', True, [
        Checkbox('Erase canvas', 'io.import_height_map.erase_canvas', True),
        Value.canvas_size('New size Z', 'io.import_height_map.size_z', 16, 64),
        Color('New voxel color', 'io.import_height_map.new_color', 'aaaaaa'),
    ]),
    Expander('Channel weights', '', False, [
        Value('Red', 'io.import_height_map.weight_r', 0.25, 0, 1, snap_frac=1000),
        Value('Green', 'io.import_height_map.weight_g', 0.5,  0, 1, snap_frac=1000),
        Value('Blue', 'io.import_height_map.weight_b', 0.25, 0, 1, snap_frac=1000),
        Label('All usually should add to 1'),
    ]),
    Expander('Remap height', '', True, [
        Value('Map 0 to height', 'io.import_height_map.map_0', 0, -2, 2, snap_frac=1000),
        Value('Map 1 to height', 'io.import_height_map.map_1', 1, -2, 2, snap_frac=1000),
    ]),
    Button('Input height map', 'io.import_height_map.run'),
])

panels['io.import_color_map'] = Container([
    Label.title('Import color map'),
    Separator(),
    Label('Replaces voxel colors'),
    Label('Does not affect opacity'),
    Separator(),
    Checkbox('Resize canvas if needed', 'io.import_color_map.resize_canvas', True),
    Checkbox('Interpret as linear', 'io.import_color_map.interpret_linear', False),
    Separator(0),
    Button('Input color map', 'io.import_color_map.run'),
])

panels['io.export_height_map'] = Container([
    Label.title('Export height map'),
    Separator(),
    Expander('Map normalised heights', '', True, [
        Value('Map 0 to value', 'io.export_height_map.map_0', 0, -2, 2, snap_frac=1000),
        Value('Map 1 to value', 'io.export_height_map.map_1', 1, -2, 2, snap_frac=1000),
    ]),
    Button('Export height map', 'io.export_height_map.run'),
])


################################
#             Gen              #
################################

panels['gen.fibres'] = Container([
    Label.title('Generate fibres'),
    Separator(),
    Expander('Canvas', '', True, [
        Value.canvas_size('Size X', 'gen.fibres.size_x', 64),
        Value.canvas_size('Size Y', 'gen.fibres.size_y', 64),
        Value.canvas_size('Size Z', 'gen.fibres.size_z', 4, 64),
    ]),
    Expander('Fibre', '', True, [
        Value('Density', 'gen.fibres.density', 0.05, 0, 0.5, 0, 10, 1000),
        Value('Cluster count', 'gen.fibres.cluster_count', 4, 1, 16, 0, 512, 1),
        Value('Cluster radius', 'gen.fibres.cluster_radius', 2, 0, 16, 0, 512, 10),
        Value('Segment length', 'gen.fibres.segment_length', 2, 1, 16, 0, 512, 10),
        Value('Segment count', 'gen.fibres.segment_count', 4, 1, 16, 0, 512, 1),
        Value('Segment angle', 'gen.fibres.segment_angle', 30, 0, 90, 0, 360, 1),
    ]),
    Expander('Color', '', True, [
        Color('Color 1', 'gen.fibres.col1', '48433e'),
        Color('Color 2', 'gen.fibres.col2', 'a8a39e'),
        Color('Color 3', 'gen.fibres.col3', '745b43'),
    ]),
    Button('Generate', 'gen.fibres.run'),
])

panels['gen.ballpit'] = Container([
    Label.title('Generate ballpit'),
    Separator(),
    Expander('Canvas', '', True, [
        Value.canvas_size('Size X', 'gen.ballpit.size_x', 64),
        Value.canvas_size('Size Y', 'gen.ballpit.size_y', 64),
        Value.canvas_size('Size Z', 'gen.ballpit.size_z', 16, 64),
        Color('Ground color', 'gen.ballpit.ground_col', '48433e'),
    ]),
    Expander('Balls', '', True, [
        Value('Min. radius', 'gen.ballpit.radius_min', 1, 0.5, 16, 0, 256, 2),
        Value('Max. radius', 'gen.ballpit.radius_max', 4, 0.5, 16, 0, 256, 2),
        Value('Density', 'gen.ballpit.density', 0.5, 0, 1, 0, 10),
        Separator(0),
        Expander('Ball color', '', False, [
            Color('Target color', 'gen.ballpit.ball_target_col', 'ff3000'),
            Value.fraction('Hue variance', 'gen.ballpit.variance_hue', 0.2),
            Value.fraction('Sat variance', 'gen.ballpit.variance_sat', 0.4),
            Value.fraction('Val variance', 'gen.ballpit.variance_val', 0.4),
            Value.fraction('Opacity variance', 'gen.ballpit.variance_opacity', 1),
            Value.fraction('Glow', 'gen.ballpit.variance_emission', 0.5),
        ]),
    ]),
    Button('Generate', 'gen.ballpit.run'),
])

panels['gen.city'] = Container([
    Label.title('Generate city'),
    Separator(),
    Expander('Canvas', '', True, [
        Value.canvas_size('Size X', 'gen.city.size_x', 64),
        Value.canvas_size('Size Y', 'gen.city.size_y', 64),
        Value.canvas_size('Size Z', 'gen.city.size_z', 16, 64),
    ]),
    Expander('Color', '', True, [
        Color('Ground color', 'gen.city.ground_col', 'aaaaaa'),
    ]),
    Button('Generate', 'gen.city.run'),
])

panels['gen.eca'] = Container([
    Label.title('Elementary cellular automata'),
    Separator(),
    Expander('Canvas', '', True, [
        Value.canvas_size('Size X', 'gen.eca.size_x', 64),
        Value.canvas_size('Size Y', 'gen.eca.size_y', 64),
        Value('Extrude Z', 'gen.eca.extrude_z', 0, 0, 4, 0, 4096, 1)
    ]),
    Expander('Variant', '', True, [
        Label('Suggested rules:'),
        Label('18, 30, 45, 73, 90, 105, 110, 184'),
        Separator(0),
        Value('Rule', 'gen.eca.rule', 110, 0, 255, 0, 255, snap_frac=1),
        Checkbox('Random initial condition', 'gen.eca.random_initial_condition'),
    ]),
    Expander('Color', '', True, [
        Color('State 0', 'gen.eca.state_0_col', '000000'),
        Color('State 1', 'gen.eca.state_1_col', 'ffffff'),
    ]),
    Button('Generate', 'gen.eca.run'),
])

panels['gen.erosion'] = Container([
    Label.title('Hydraulic erosion'),
    Separator(),
    Expander('Initial terrain', '', True, [
        Value.canvas_size('Size X', 'gen.erosion.size_x', 64),
        Value.canvas_size('Size Y', 'gen.erosion.size_y', 64),
        Value.canvas_size('Size Z', 'gen.erosion.size_z', 16, 64),
        #Checkbox('Perlin', 'perlin'),
        Button('Generate', 'gen.erosion.run.generate'),
    ]),
    Expander('Erode', '', True, [
        Value('Steps', 'gen.erosion.steps', 1, 0, 1000, 0, snap_frac=10),
        Value('Stream strength', 'gen.erosion.strength', 0.1, 0, 1, 0, snap_frac=100),
        Value('Stream capacity', 'gen.erosion.capacity', 5, 0, 10, 0, snap_frac=10),
        Button('Run', 'gen.erosion.run.erode'),
    ]),
    Expander('Finalise', '', True, [
        Value('Water level', 'gen.erosion.water_level_fac', 0.2, 0, 1, snap_frac=1000),
        Color('Water color', 'gen.erosion.water_col', '505090'),
        Value('Grass amount', 'gen.erosion.grass_fac', 0.5, 0, 1, snap_frac=1000),
        Color('Grass color', 'gen.erosion.grass_col', '70aa60'),
        Value('Tree amount', 'gen.erosion.tree_fac', 0.2, 0, 1, snap_frac=1000),
        Button('Run', 'gen.erosion.run.finalise'),
    ]),
])

panels['gen.extruded_grid'] = Container([ # "I call them cities"
    Label.title('Generate extruded grid'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value('Cell count', 'gen.extruded_grid.cell_count', 16, 1, 64, 1, 1024, snap_frac=1),
        Value('Cell size', 'gen.extruded_grid.cell_size', 4, 1, 8, 1, 256, snap_frac=1),
        Value('Cell spacing', 'gen.extruded_grid.cell_spacing', 0, 0, 8, 0, 256, snap_frac=1),
        Value('Max height', 'gen.extruded_grid.max_height', 8, 1, 16, 1, 256, snap_frac=1),
        Value('Jitter', 'gen.extruded_grid.jitter_fac', 0, 0, 1, snap_frac=1000),
    ]),
    Expander('Color', '', True, [
        Color('Color 1', 'gen.extruded_grid.col1', '007F7F'), # green
        Color('Color 2', 'gen.extruded_grid.col2', 'FDFE7F'), # yellow
        Value.fraction('Glow', 'gen.extruded_grid.glow', 0),
    ]),
    Button('Generate', 'gen.extruded_grid.run'),
])

panels['gen.maze'] = Container([
    Label.title('Generate maze'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value('Cell count', 'gen.maze.cell_count', 24, 1, 64, 1, 1024, snap_frac=1),
        Value('Cell size', 'gen.maze.cell_size', 2, 1, 8, 1, 256, snap_frac=1),
        Value('Wall thickness', 'gen.maze.wall_thickness', 1, 1, 8, 1, 256, snap_frac=1),
        Value('Wall height', 'gen.maze.wall_height', 2, 0, 8, 0, 256, snap_frac=1),
        Value.fraction('Pertubation', 'gen.maze.pertubation', 0.5),
    ]),
    Expander('Color', '', True, [
        Color('Ground color', 'gen.maze.ground_col', 'ffffff'),
        Color('Wall color', 'gen.maze.wall_col', '000000'),
    ]),
    Button('Generate', 'gen.maze.run'),
])

panels['gen.nucleus'] = Container([
    Label.title('Generate "Nucleus"'),
    Separator(),
    Expander('Canvas', '', True, [
        Value('Radius', 'gen.nucleus.radius', 64, 1, 256, 0, 4096, snap_frac=1),
        Value.canvas_size('Size Z', 'gen.nucleus.size_z', 16, 64),
    ]),
    Expander('Color', '', True, [
        #Color('Ground color', 'gen.nucleus.ground_col', 'aaaaaa'),
    ]),
    Button('Generate', 'gen.nucleus.run'),
])

panels['gen.pipelines'] = Container([
    Label.title('Generate pipelines'),
    Separator(),
    Expander('Canvas', '', True, [
        Value.canvas_size('Size X', 'gen.pipelines.size_x', 64),
        Value.canvas_size('Size Y', 'gen.pipelines.size_y', 64),
        Value.canvas_size('Size Z', 'gen.pipelines.size_z', 16, 64),
    ]),
    Expander('Color', '', True, [
        Color('Ground color', 'gen.pipelines.ground_col', 'aaaaaa'),
    ]),
    Button('Generate', 'gen.pipelines.run'),
])

panels['gen.wheel'] = Container([
    Label.title('Generate wheel'),
    Separator(),
    Value('Rim radius', 'gen.wheel.rim_radius', 25, 1, 256, 0, 4096, snap_frac=1),
    Value('Sidewall height', 'gen.wheel.sidewall_height', 9, 1, 512, 0, 4096, snap_frac=1),
    Value('Tire width', 'gen.wheel.tire_width', 8, 1, 512, 0, 4096, snap_frac=1),
    Separator(0),
    Button('Run', 'gen.wheel.run'),
])

################################
#              FX              #
################################

panels['fx.translate'] = Container([
    Label.title('Translate canvas'),
    Separator(),
    Expander('Translation vector', '', True, [
        Value('X', 'fx.translate.dx', 0, -512, 512, -4096, 4096, snap_frac=1),
        Value('Y', 'fx.translate.dy', 0, -512, 512, -4096, 4096, snap_frac=1),
        Value('Z', 'fx.translate.dz', 0, -512, 512, -4096, 4096, snap_frac=1),
        Separator(0),
        Button('Set to 0', 'fx.translate.set_0'),
        Button('Set half canvas x,y', 'fx.translate.set_half_canvas_xy'),
    ]),
    Button('Run', 'fx.translate.run'),
])

panels['fx.scale'] = Container([
    Label.title('Scale canvas'),
    Separator(),
    Expander('Scale vector', '', True, [
        Value('X', 'fx.scale.dx', 1, 0.25, 4, -4096, 4096, snap_frac=1000),
        Value('Y', 'fx.scale.dy', 1, 0.25, 4, -4096, 4096, snap_frac=1000),
        Value('Z', 'fx.scale.dz', 1, 0.25, 4, -4096, 4096, snap_frac=1000),
        Separator(0),
        Button('Set to 0.5', 'fx.scale.set_x0.5'),
        Button('Set to 1', 'fx.scale.set_x1'),
        Button('Set to 2', 'fx.scale.set_x2'),
    ]),
    Button('Run', 'fx.scale.run'),
])

panels['fx.rotate'] = Container([
    Label.title('Rotate canvas XY'),
    Separator(),
    Button('Rotate +90 (CCW)', 'fx.rotate.rotate_+90'),
    Button('Rotate -90 (CW)', 'fx.rotate.rotate_-90'),
])

panels['fx.crop_xy'] = Container([
    Label.title('Crop XY'),
    Separator(),
    Value.canvas_size('Size X', 'fx.crop_xy.size_x', 64),
    Value.canvas_size('Size Y', 'fx.crop_xy.size_y', 64),
    Checkbox('Centered', 'fx.crop_xy.centered', True),
    Button('Crop', 'fx.crop_xy.run'),
])

panels['fx.mirror'] = Container([
    Label.title('Mirror'),
    Separator(),
    Expander('Flip (nondestructive)', '', True, [
        Button('Flip X', 'fx.mirror.flip_x'),
        Button('Flip Y', 'fx.mirror.flip_y'),
    ]),
    Expander('Mirror (destructive)', '', True, [
        Button('Mirror X', 'fx.mirror.mirror_x'),
        Button('Mirror Y', 'fx.mirror.mirror_y'),
    ]),
])

panels['fx.recolor'] = Container([
    Label.title('Gradient recolor'),
    Separator(),
    Expander('Channel weights', '', False, [
        Value('Red', 'fx.recolor.weight_r', 0.25, 0, 1, snap_frac=1000),
        Value('Green', 'fx.recolor.weight_g', 0.5,  0, 1, snap_frac=1000),
        Value('Blue', 'fx.recolor.weight_b', 0.25, 0, 1, snap_frac=1000),
        Label('All usually should add to 1'),
    ]),
    Expander('Input range', '', True, [
        Value('Map 0 to value', 'fx.recolor.map_0', 0, -2, 2, snap_frac=1000),
        Value('Map 1 to value', 'fx.recolor.map_1', 1, -2, 2, snap_frac=1000),
    ]),
    Expander('Output colors', '', True, [
        Color('Val 0 to color', 'fx.recolor.col_0', '000000'),
        Color('Val 1 to color', 'fx.recolor.col_1', 'ffffff'),
    ]),
    Checkbox('Interpolate in sRGB', 'fx.recolor.use_sRGB', True),
    Separator(0),
    Button('Run', 'fx.recolor.run'),
])

panels['fx.reshape_canvas'] = Container([
    Label.title('Reshape canvas'),
    Separator(),
    Label('Nondestructive.'),
    Separator(0),
    Button('Get current dimensions', 'fx.reshape_canvas.get_current_dimensions'),
    Value.canvas_size('Size X', 'fx.reshape_canvas.size_x', ''),
    Value.canvas_size('Size Y', 'fx.reshape_canvas.size_y', ''),
    Value.canvas_size('Size Z', 'fx.reshape_canvas.size_z', ''),
    Checkbox('Allow any size (dangerous)', 'fx.reshape_canvas.any_size', False),
    Separator(0),
    Button('Set dimensions', 'fx.reshape_canvas.run'),
])

################################
#             Misc             #
################################

panels['project.compositor_mode'] = Container([
    Button.run_command('Color', 'project.compositor_mode.1', 'compositor_mode COLOR'),
    Button.run_command('Shaded', 'project.compositor_mode.2', 'compositor_mode SHADED'),
])

panels['project.settings'] = Container([
    Label.title('Project settings'),
    Separator(),
    Checkbox('Dark background', 'project.settings.bg_dark', True),
    Value('Slider sensitivity', 'project.settings.slider_sensitivity', 200, 10, 1000, 0, 10000, snap_frac=0.1),
    Separator(0),
    Button('Apply changes', 'project.settings.apply'),
])

panels['project.info'] = Container([
    Label.title('Info'),
    Separator(),
    Label('Created by awesome-llama'),
    Label('Developed w/ goboscript'),
    Separator(),
    Label('2025'),
])


################################
#    Generate lists & save     #
################################

element_list = [""]*10 # element data
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
def save_list(path, data:list):
    with open(path, 'w', encoding='UTF-8') as f:
        f.writelines([f"{elem}\n" for elem in data])

save_list('UI/UI_data.txt', element_list)
save_list('UI/UI_data_panels.txt', panel_lookup)

# split tuples into separate lists:
save_list('UI/UI_data_element_id.txt', [l[0] for l in element_lookup])
save_list('UI/UI_data_element_index.txt', [l[1] for l in element_lookup])

print(f'saved {len(element_list)} items')
