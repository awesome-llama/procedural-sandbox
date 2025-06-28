"""Create the lists for the modular UI"""

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

################################

panels = {}


################################
#      High-speed access       #
################################

panels['popup.color_picker'] = Container([
    Label.title('Color picker'),
    Color('Color', 'popup.color_picker.color', '#ff3000'),
    Value('Mode', 'popup.color_picker.mode', 0, 0, 2, snap_frac=1), # 0=HSV, 1=RGB
    
    Value.fraction('Hue', 'popup.color_picker.hue', 0.1),
    Value.fraction('Sat', 'popup.color_picker.sat', 0.4),
    Value.fraction('Val', 'popup.color_picker.val', 1.0),
    End(),
    
    #Value.fraction('R', 'popup.color_picker.r', 0.1),
    #Value.fraction('G', 'popup.color_picker.g', 0.8),
    #Value.fraction('B', 'popup.color_picker.b', 1.0),
    #End(),
    
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
    Label.title('Import/export'),
    Separator(),
    btn_menu_set_page('New canvas', 'io.new_canvas'),
    Separator(0, 5),
    btn_menu_set_page('Save canvas', 'io.save_canvas'),
    Button('Load canvas', 'io.load_canvas.run'), # run button, no page
    Separator(0, 5),
    Button('Export displayed canvas', 'io.export_rendered_canvas.run'), # run button, no page
    
    Separator(0, 5),

    Label('Textures', '#baaaba'),
    btn_menu_set_page('Import height map', 'io.import_height_map'),
    btn_menu_set_page('Import color map', 'io.import_color_map'),
    btn_menu_set_page('Export height map', 'io.export_height_map'),
    
    Separator(0, 5),

    Label('3D models', '#baaaba'),
    btn_menu_set_page('Export .ply point cloud', 'io.export_ply_point_cloud'),
    btn_menu_set_page('Export .obj surfaces', 'io.export_obj_surface'),
])

panels['menu.gen'] = Container([
    Label.title('Generate'),
    Separator(), # featured structures
    btn_menu_set_page('City', 'gen.city'),
    btn_menu_set_page('Control panel', 'gen.control_panel'),
    btn_menu_set_page('Nucleus', 'gen.nucleus'),
    btn_menu_set_page('Printed circuit board', 'gen.pcb'),
    Separator(0, 5), # patterns, specific
    btn_menu_set_page('Extruded grid', 'gen.extruded_grid'),
    btn_menu_set_page('Fibres', 'gen.fibres'),
    btn_menu_set_page('Hedge', 'gen.hedge'),
    btn_menu_set_page('Terrain', 'gen.terrain'),
    Separator(0, 5), # patterns, misc
    btn_menu_set_page('Ball Pit', 'gen.ballpit'),
    btn_menu_set_page('Elem. cellular automata', 'gen.eca'),
    btn_menu_set_page('Maze', 'gen.maze'),
    btn_menu_set_page('Value noise', 'gen.value_noise'),
    Separator(0, 5),
    btn_menu_set_page('Sphere', 'gen.sphere'),
    btn_menu_set_page('Custom script', 'gen.lang'),
])

panels['menu.fx'] = Container([
    Label.title('Effects'),
    Separator(),
    btn_menu_set_page('Translate', 'fx.translate'),
    btn_menu_set_page('Rotate', 'fx.rotate'),
    btn_menu_set_page('Scale', 'fx.scale'),
    btn_menu_set_page('Mirror', 'fx.mirror'),
    btn_menu_set_page('Repeated symmetry', 'fx.repeated_symmetry'),
    Separator(0, 5),
    btn_menu_set_page('Crop XY', 'fx.crop_xy'),
    Separator(0, 5),
    btn_menu_set_page('Gradient recolor', 'fx.recolor'),
    Separator(0, 5),
    btn_menu_set_page('Jitter', 'fx.jitter'),
    btn_menu_set_page('Smudge', 'fx.smudge'),
    Separator(0, 5),
    btn_menu_set_page('Reshape', 'fx.reshape_canvas'),
])

panels['menu.settings'] = Container([
    Label.title('Settings'),
    Separator(),
    btn_menu_set_page('Misc.', 'settings.misc'),
    btn_menu_set_page('Pathtracer', 'settings.pathtracer'),
    btn_menu_set_page('Normal map', 'settings.normal_map'),
    Separator(0, 5),
    btn_menu_set_page('Tips', 'settings.tips'),
    Separator(0, 5),
    btn_menu_set_page('Credits', 'settings.credits'),
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
        Color('Base color', 'io.new_canvas.base_col', '#808080'),
    ]),
    Button('Create new canvas', 'io.new_canvas.run'),
])

panels['io.save_canvas'] = Container([
    Label.title('Save canvas'),
    Separator(),
    TextBlock('Save all canvas data, quantized to 8-bit.'),
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
        Color('New voxel color', 'io.import_height_map.new_color', '#aaaaaa'),
    ]),
    Expander('Channel weights', '', False, [
        Value('Red', 'io.import_height_map.weight_r', 0.25, 0, 1, snap_frac=1000),
        Value('Green', 'io.import_height_map.weight_g', 0.5,  0, 1, snap_frac=1000),
        Value('Blue', 'io.import_height_map.weight_b', 0.25, 0, 1, snap_frac=1000),
        TextBlock('All usually should add to 1'),
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
    TextBlock('Replaces voxel colors only. Does not affect opacity.'),
    Expander('Settings', '', True, [
        Checkbox('Resize canvas if needed', 'io.import_color_map.resize_canvas', True),
        Checkbox('Interpret as linear', 'io.import_color_map.interpret_linear', False),
    ]),
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

panels['io.export_ply_point_cloud'] = Container([
    Label.title('Export point cloud'),
    Separator(),
    Expander('Settings', '', True, [
        Checkbox('Include 0 opacity voxels', 'io.export_ply_point_cloud.include_air', False),
        Checkbox('Create data URL', 'io.export_ply_point_cloud.create_data_url', True),
    ]),
    Button('Export', 'io.export_ply_point_cloud.run'),
])

panels['io.export_obj_surface'] = Container([
    Label.title('Export mesh surface'),
    Separator(),
    Expander('Settings', '', True, [
        Checkbox('Right-handed Z-up', 'io.export_obj_surface.right_handed_z_up', True),
        Checkbox('Create data URL', 'io.export_obj_surface.create_data_url', True),
    ]),
    Button('Export', 'io.export_obj_surface.run'),
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
        Color('Color 1', 'gen.fibres.col1', "#837a71"),
        Color('Color 2', 'gen.fibres.col2', "#c1b9b0"),
        Color('Color 3', 'gen.fibres.col3', "#bd936d"),
    ]),
    Button('Generate', 'gen.fibres.run'),
])

panels['gen.ballpit'] = Container([
    Label.title('Generate ball pit'),
    Separator(),
    Expander('Canvas', '', True, [
        Value.canvas_size('Size X', 'gen.ballpit.size_x', 64),
        Value.canvas_size('Size Y', 'gen.ballpit.size_y', 64),
        Value.canvas_size('Size Z', 'gen.ballpit.size_z', 16, 64),
        Color('Ground color', 'gen.ballpit.ground_col', '#aaaaaa'),
    ]),
    Expander('Balls', '', True, [
        Value('Min. radius', 'gen.ballpit.radius_min', 1, 0.5, 16, 0, 256, 2),
        Value('Max. radius', 'gen.ballpit.radius_max', 4, 0.5, 16, 0, 256, 2),
        Value('Density', 'gen.ballpit.density', 0.2, 0, 1, 0, 10),
        Separator(0),
        Expander('Ball color', '', False, [
            Color('Target color', 'gen.ballpit.ball_target_col', '#ff3000'),
            Value.fraction('Hue variance', 'gen.ballpit.variance_hue', 0.1),
            Value.fraction('Sat variance', 'gen.ballpit.variance_sat', 0.7),
            Value.fraction('Val variance', 'gen.ballpit.variance_val', 0.2),
            Value.fraction('Glow', 'gen.ballpit.variance_glow', 0.5),
        ]),
    ]),
    Button('Generate', 'gen.ballpit.run'),
])

panels['gen.pcb'] = Container([
    Label.title('Generate PCB'),
    Separator(),
    Expander('Canvas', '', True, [
        Value('Size X', 'gen.pcb.size_x', 64, 32, 256, 0, 4096, 1),
        Value('Size Y', 'gen.pcb.size_y', 64, 32, 256, 0, 4096, 1),
        Checkbox('Seamless', 'gen.pcb.seamless', True),
    ]),
    Expander('Color', '', True, [
        Color('Substrate', 'gen.pcb.substrate_col', "#00682F"),
        Color('Trace', 'gen.pcb.trace_col', '#07892D'),
        Color('Via', 'gen.pcb.via_col', "#a48b3e"),
    ]),
    Button('Generate', 'gen.pcb.run'),
])

panels['gen.city'] = Container([
    Label.title('Generate city'),
    Separator(),
    Expander('Canvas', '', True, [
        Value.canvas_size('Size X', 'gen.city.size_x', 64),
        Value.canvas_size('Size Y', 'gen.city.size_y', 64),
        Value('Size Z', 'gen.city.size_z', 16, 8, 32, 4, 256, snap_frac=1),
    ]),
    Expander('Form', '', True, [
        Value('Buildings', 'gen.city.buildings', 1, 0, 2, 0, 1000),
        Value('Sky bridges', 'gen.city.bridges', 1, 0, 2, 0, 1000),
        Value('Glow', 'gen.city.glow', 1, 0, 2, 0, 1000),
    ]),
    Button('Generate', 'gen.city.run'),
])

panels['gen.control_panel'] = Container([
    Label.title('Generate control panel'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value('Cell count X', 'gen.control_panel.cell_count_x', 12, 1, 64, 1, 1024, snap_frac=1),
        Value('Cell count Y', 'gen.control_panel.cell_count_y', 12, 1, 64, 1, 1024, snap_frac=1),
        Value('Cell size', 'gen.control_panel.cell_size', 6, 4, 12, 1, 256, snap_frac=1),
    ]),
    Expander('Shape', '', True, [
        Value.fraction('Repetition chance', 'gen.control_panel.repetition_fac', 0.7),
    ]),
    Expander('Color', '', True, [
        Color('Panel color', 'gen.control_panel.panel_color', '#aaaaaa'),
        Color('Accent color 1', 'gen.control_panel.accent1', "#6f6f6f"),
        Color('Accent color 2', 'gen.control_panel.accent2', "#c5c5c5"),
    ]),
    Button('Generate', 'gen.control_panel.run'),
])

panels['gen.eca'] = Container([
    Label.title('Elementary cellular automata'),
    Separator(),
    Expander('Canvas', '', True, [
        Value.canvas_size('Size X', 'gen.eca.size_x', 64),
        Value.canvas_size('Size Y', 'gen.eca.size_y', 64),
        Value('Extrude Z', 'gen.eca.extrude_z', 1, 0, 4, 0, 4096, 1)
    ]),
    Expander('Variant', '', True, [
        TextBlock('Suggested rules: 18, 30, 45, 73, 90, 105, 110, 184'),
        Separator(0),
        Value('Rule', 'gen.eca.rule', 110, 0, 255, 0, 255, snap_frac=1),
        Checkbox('Random initial condition', 'gen.eca.random_initial_condition', True),
    ]),
    Expander('Color', '', True, [
        Color('State 0', 'gen.eca.state_0_col', '#303030'),
        Color('State 1', 'gen.eca.state_1_col', '#ffffff'),
    ]),
    Button('Generate', 'gen.eca.run'),
])

panels['gen.terrain'] = Container([
    Label.title('Terrain'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value.canvas_size('Size X', 'gen.terrain.size_x', 64),
        Value.canvas_size('Size Y', 'gen.terrain.size_y', 64),
        Value.canvas_size('Size Z', 'gen.terrain.size_z', 16, 64),
        Value('Noise scale XY', 'gen.terrain.noise_scale_xy', 10, 1, 64, 0, 4096, snap_frac=1),
        Value('Noise scale Z', 'gen.terrain.noise_scale_z', 1, 0, 1, 0, 4096, snap_frac=1000),
    ]),
    Expander('Water', '', True, [
        Value('Water level', 'gen.terrain.water_level_fac', 0.4, 0, 1, snap_frac=1000),
        Color('Water color', 'gen.terrain.water_col', "#355156"),
    ]),
    Expander('Ground', '', True, [
        Color('Rock color', 'gen.terrain.rock_col', "#686766"),
        Color('Soil color', 'gen.terrain.soil_col', "#55453b"),
        Color('Grass color', 'gen.terrain.grass_col', "#6e9c45"),
        Value('Grass slope', 'gen.terrain.grass_fac', 1, 0, 2, snap_frac=1000),
    ]),
    Expander('Trees', '', True, [
        Color('Tree color', 'gen.terrain.tree_col', "#4c6a39"),
        Value('Tree density', 'gen.terrain.tree_fac', 0.2, 0, 1, snap_frac=1000),
    ]),
    Button('Run', 'gen.terrain.run'),
])

panels['gen.extruded_grid'] = Container([ # "I call them cities"
    Label.title('Generate extruded grid'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value('Cell count', 'gen.extruded_grid.cell_count', 16, 1, 64, 1, 1024, snap_frac=1),
        Value('Cell size', 'gen.extruded_grid.cell_size', 4, 1, 8, 1, 256, snap_frac=1),
        Value('Cell spacing', 'gen.extruded_grid.cell_spacing', 0, 0, 8, 0, 256, snap_frac=1),
        Value('Max. height', 'gen.extruded_grid.max_height', 8, 1, 16, 1, 256, snap_frac=1),
        Value('Jitter', 'gen.extruded_grid.jitter_fac', 0, 0, 1, snap_frac=1000),
    ]),
    Expander('Color', '', True, [
        Color('Color 1', 'gen.extruded_grid.col1', '#007F7F'),
        Color('Color 2', 'gen.extruded_grid.col2', '#FDFE7F'),
        Value.fraction('Glow', 'gen.extruded_grid.glow', 0),
    ]),
    Button('Generate', 'gen.extruded_grid.run'),
])

panels['gen.hedge'] = Container([
    Label.title('Generate hedge'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value.canvas_size('Size X', 'gen.hedge.size_x', 64),
        Value.canvas_size('Size Y', 'gen.hedge.size_y', 64),
        Value.canvas_size('Size Z', 'gen.hedge.size_z', 4, 16),
        Value('Leaf density', 'gen.hedge.leaf_density', 2, 0, 4, 0, 64, snap_frac=100),
        Value('Leaf size', 'gen.hedge.leaf_size', 3, 1, 16, 1, 256, snap_frac=10),
    ]),
    Expander('Color', '', True, [
        Color('Color 1', 'gen.hedge.col1', "#2E4934"),
        Color('Color 2', 'gen.hedge.col2', "#2F6517"),
        Color('Color 3', 'gen.hedge.col3', "#7C9C41"),
    ]),
    Button('Generate', 'gen.hedge.run'),
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
        Color('Ground color', 'gen.maze.ground_col', '#ffffff'),
        Color('Wall color', 'gen.maze.wall_col', '#000000'),
    ]),
    Button('Generate', 'gen.maze.run'),
])

panels['gen.nucleus'] = Container([
    Label.title('Generate "Nucleus"'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value('Radius', 'gen.nucleus.radius', 32, 1, 128, 0, 4096, snap_frac=1),
        Value.canvas_size('Size Z', 'gen.nucleus.size_z', 16, 64),
    ]),
    Expander('Shape', '', True, [
        Value('Rings', 'gen.nucleus.rings', 1, 0, 2, 0, 16),
        Value('Rays', 'gen.nucleus.rays', 1, 0, 2, 0, 16),
        Value('Cuboids', 'gen.nucleus.cuboids', 1, 0, 2, 0, 16),
    ]),
    Expander('Color', '', True, [
        Value('Glow', 'gen.nucleus.glow', 0.5, 0, 2, 0, 16),
    ]),
    Button('Generate', 'gen.nucleus.run'),
])

# https://en.wikipedia.org/wiki/Value_noise
panels['gen.value_noise'] = Container([
    Label.title('Value noise (2D)'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value.canvas_size('Size X', 'gen.value_noise.size_x', 64),
        Value.canvas_size('Size Y', 'gen.value_noise.size_y', 64),
    ]),
    Expander('Shape', '', True, [
        Value('Scale', 'gen.value_noise.scale', 16, 1, 64, 0, 4096, snap_frac=1),
        Value('Max. octaves', 'gen.value_noise.octaves', 5, 1, 8, 0, 64, snap_frac=1),
    ]),
    Button('Generate', 'gen.value_noise.run'),
])

panels['gen.sphere'] = Container([
    Label.title('Sphere'),
    Separator(),
    Expander('Canvas', '', True, [
        Value('Canvas radius', 'gen.sphere.canvas_size', 16, 1, 256, 0, 4096, snap_frac=1),
        Checkbox('Include ground', 'gen.sphere.include_ground', True),
        Color('Ground color', 'gen.sphere.ground_col', '#aaaaaa'),
    ]),
    Expander('Sphere', '', True, [
        Value.canvas_size('Radius', 'gen.sphere.sphere_radius', 4),
        Color('Color', 'gen.sphere.sphere_color', '#00ff00'),
        Value.fraction('Emission', 'gen.sphere.sphere_emission', 0),
    ]),
    Button('Generate', 'gen.sphere.run'),
])

panels['gen.lang'] = Container([
    Label.title('Custom script'),
    Separator(),
    TextBlock('This project supports a purpose-built low-level programming language. Documentation available on GitHub.'),
    Expander('Settings', '', True, [
        Checkbox('Always show run output', 'gen.lang.show_output_list', True),
    ]),
    Button('Input code', 'gen.lang.input_code'),
    Button('Run', 'gen.lang.run'),
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
    Separator(0),
    Expander('Advanced', '', False, [
        Value('Angle (CCW)', 'fx.rotate.angle', 0, -180, 180),
        Separator(0),
        Value('Origin X', 'fx.rotate.ox', 0, -256, 256, -4096, 4096),
        Value('Origin Y', 'fx.rotate.oy', 0, -256, 256, -4096, 4096),
        Button('Set origin  to 0,0', 'fx.rotate.set_origin_0'),
        Button('Set origin to center', 'fx.rotate.set_origin_center'),
        Separator(0),
        Button('Rotate', 'fx.rotate.run'),
    ]),
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

panels['fx.repeated_symmetry'] = Container([
    Label.title('Repeated symmetry'),
    Separator(),
    TextBlock('Randomly translate and mirror the canvas, often resulting in panel-like shapes.'),
    Expander('Settings', '', True, [
        Value('Steps', 'fx.repeated_symmetry.steps', 3, 1, 20, 1, snap_frac=1),
        Value.fraction('X:Y bias', 'fx.repeated_symmetry.xy_bias', 0.5),
    ]),
    Button('Run', 'fx.repeated_symmetry.run'),
])

panels['fx.crop_xy'] = Container([
    Label.title('Crop XY'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value.canvas_size('Size X', 'fx.crop_xy.size_x', 64),
        Value.canvas_size('Size Y', 'fx.crop_xy.size_y', 64),
        Checkbox('Centered', 'fx.crop_xy.centered', True),
    ]),
    Button('Crop', 'fx.crop_xy.run'),
])

panels['fx.recolor'] = Container([
    Label.title('Gradient recolor'),
    Separator(),
    Expander('Channel weights', '', False, [
        Value('Red', 'fx.recolor.weight_r', 0.25, 0, 1, snap_frac=1000),
        Value('Green', 'fx.recolor.weight_g', 0.5,  0, 1, snap_frac=1000),
        Value('Blue', 'fx.recolor.weight_b', 0.25, 0, 1, snap_frac=1000),
        TextBlock('All usually should add to 1'),
    ]),
    Expander('Input range', '', True, [
        Value('Map 0 to value', 'fx.recolor.map_0', 0, -2, 2, snap_frac=1000),
        Value('Map 1 to value', 'fx.recolor.map_1', 1, -2, 2, snap_frac=1000),
    ]),
    Expander('Output colors', '', True, [
        Color('Val 0 to color', 'fx.recolor.col_0', '#000000'),
        Color('Val 1 to color', 'fx.recolor.col_1', '#ffffff'),
    ]),
    Checkbox('Interpolate in sRGB', 'fx.recolor.use_sRGB', True),
    Separator(0),
    Button('Run', 'fx.recolor.run'),
])

panels['fx.jitter'] = Container([
    Label.title('Jitter'),
    Separator(),
    TextBlock('Randomly translate voxels'),
    Expander('Settings', '', True, [
        Value('Coverage', 'fx.jitter.coverage', 0.1, 0, 0.2, 0, 1, snap_frac=1000),
        Value.fraction('Probability Z', 'fx.jitter.probability_z', 0),
    ]),
    Button('Run', 'fx.jitter.run'),
])

panels['fx.smudge'] = Container([
    Label.title('Smudge'),
    Separator(),
    TextBlock('Randomly blend adjacent voxel color.'),
    Expander('Settings', '', True, [
        Value('Coverage', 'fx.smudge.coverage', 0.1, 0, 0.2, 0, 1, snap_frac=1000),
        Value.fraction('Probability Z', 'fx.smudge.probability_z', 0.333),
    ]),
    Button('Run', 'fx.smudge.run'),
])

panels['fx.reshape_canvas'] = Container([
    Label.title('Reshape canvas'),
    Separator(),
    TextBlock('Nondestructive adjustment of canvas dimensions. Voxel order is maintained and reversible.'),
    Expander('Dimensions', '', True, [
        Button('Get current dimensions', 'fx.reshape_canvas.get_current_dimensions'),
        Value.canvas_size('Size X', 'fx.reshape_canvas.size_x', ''),
        Value.canvas_size('Size Y', 'fx.reshape_canvas.size_y', ''),
        Value.canvas_size('Size Z', 'fx.reshape_canvas.size_z', ''),
    ]),
    Expander('Dangerous', '', False, [
        Checkbox('Allow any size', 'fx.reshape_canvas.any_size', False),
        TextBlock('Allow for dimensions that result in a canvas unequal to the actual number of stored voxels.'),
    ]),
    Button('Set dimensions', 'fx.reshape_canvas.run'),
])

################################
#           Settings           #
################################

panels['settings.misc'] = Container([
    Label.title('Miscellaneous'),
    Separator(),
    Expander('Inputs', '', True, [
        Value('Slider sensitivity', 'settings.slider_sensitivity', 100, 20, 500, 0, 10000, snap_frac=1),
    ]),
    Expander('Viewport', '', True, [
        #Checkbox('Show on-screen text', 'settings.show_on_screen_text', True),
        Value('Resolution 3D', 'settings.resolution', 4, 1, 12, 1, 64, snap_frac=1),
    ]),
    Expander('Reset', '', True, [
        Checkbox('Reset render on flag', 'settings.reset_render_on_flag', True),
    ]),
    Separator(0),
    Button('Apply changes', 'settings.misc.apply', action_data='settings.apply'),
])

panels['settings.pathtracer'] = Container([
    Label.title('Pathtracer'),
    Separator(),
    TextBlock('Applies to the "pathtraced" mode only.'),
    Expander('Iterations', '', False, [
        Value('Max. samples', 'settings.max_samples', 512, 1, 4096, 1, 16777216, snap_frac=1),
        TextBlock('Total number of rays'),
        Separator(),
        Value('Max. frame time', 'settings.max_frame_time', 0.1, 0, 0.5, 0, 60, snap_frac=100),
        TextBlock('Keep the interface responsive by limiting how long the renderer iterates.'),
    ]),
    Expander('Anti-aliasing', '', False, [
        Value('2D pathtraced', 'settings.filter_size_fac_2D_PT', 0, 0, 2, 0, 100, snap_frac=10),
        Value('3D pathtraced', 'settings.filter_size_fac_3D_PT', 1, 0, 2, 0, 100, snap_frac=10),
        TextBlock('Spread of rays, measured in pixels.'),
    ]),
    Expander('Emissive voxels', '', False, [
        Value('Emission intensity', 'settings.emission_intensity', 1, 0, 2, 0, 100, snap_frac=100),
    ]),
    Expander('Sky', '', False, [
        Expander('Presets', '', False, [
            Button.run_command('Off', 'settings.sky_preset1', 'element settings.sky_intensity 3 0;element settings.sun_intensity 3 0;broadcast settings.apply;'),
            Button.run_command('Dark', 'settings.sky_preset2', 'element settings.sky_intensity 3 0.2;element settings.sun_intensity 3 0;broadcast settings.apply;'),
            Button.run_command('Default', 'settings.sky_preset3', 'element settings.sky_intensity 3 0.8;element settings.sun_intensity 3 2;broadcast settings.apply;'),
            Button.run_command('Bright', 'settings.sky_preset4', 'element settings.sky_intensity 3 1;element settings.sun_intensity 3 10;broadcast settings.apply;'),
        ]),
        Separator(0),
        Value('Sky intensity', 'settings.sky_intensity', 0.8, 0, 2, 0, 100, snap_frac=100),
        Separator(),
        Value('Sun intensity', 'settings.sun_intensity', 2, 0, 4, 0, 100, snap_frac=100),
        Value('Sun bearing', 'settings.sun_bearing', 0, -90, 90, -360, 360, snap_frac=1),
        Value('Sun elevation', 'settings.sun_elevation', 45, 0, 90, 0, 90, snap_frac=1),
    ]),
    Expander('Display transform', '', False, [
        Checkbox('"PBR Neutral" tone map', 'settings.use_tone_map', False),
        TextBlock('How light is converted into your screen\'s RGB pixels'),
    ]),
    Separator(0),
    Button('Apply changes', 'settings.pathtracer.apply', action_data='settings.apply'),
])

panels['settings.normal_map'] = Container([
    Label.title('Normal map'),
    Separator(),
    TextBlock('Applies to the "normal map" mode in 2D only.'),
    Expander('Sampling', '', True, [
        Value('Intensity', 'settings.normal_map_intensity', 1, 0, 2, snap_frac=1000),
        Value('Kernel size', 'settings.normal_map_kernel_size', 2, 2, 3, 2, 3, snap_frac=1),
    ]),
    Separator(0),
    Button('Apply changes', 'settings.normal_map.apply', action_data='settings.apply'),
])

panels['settings.tips'] = Container([
    Label.title('Tips'),
    Separator(),
    Expander('Set render mode', '', False, [
        TextBlock('Press the number keys 1-6 to quickly choose render mode "color", "shaded", "pathtraced", and so on.'),
    ]),
    Expander('Inputs', '', False, [
        TextBlock('When hovering over a number, checkbox, or color input, press:'),
        TextBlock('- R to reset to default value'),
        TextBlock('- C to copy value to project clipboard'),
        TextBlock('- V to paste value'),
        Separator(0),
        TextBlock('You can also click a number input to enter a specific value, even numbers out of the normally allowed range.'),
        Separator(0),
        Value('Try it!', value=0.5),
        Value('Try it!', value=28),
    ]),
])

panels['settings.credits'] = Container([
    Label.title('Credits'),
    Separator(),
    Label('Created by awesome-llama'),
    Label('2025'),
    Label('Written in goboscript'),
    Separator(),
    TextBlock('Contributions accepted! See the GitHub repository in the project notes and credits.'),
])

################################
#             Misc             #
################################

panels['project.compositor_mode'] = Container([
    Button.run_command('1. Color', 'project.compositor_mode.1', 'compositor COLOR'),
    Button.run_command('2. Shaded', 'project.compositor_mode.2', 'compositor SHADED'),
    Button.run_command('3. Pathtraced', 'project.compositor_mode.3', 'compositor PATHTRACED'),
    Button.run_command('4. Height', 'project.compositor_mode.4', 'compositor HEIGHT'),
    Button.run_command('5. AO', 'project.compositor_mode.5', 'compositor AO'),
    Button.run_command('6. Normal', 'project.compositor_mode.6', 'compositor NORMAL'),
])



"""panels['test.sliders'] = Container([
    Label.title('Slider test'),
    Separator(),
    Expander('Int step 10', '', True, [
        Value('0-0.1', 'test.sliders.b1', 0, 0, 0.1, snap_frac=0.1),
        Value('0-1', 'test.sliders.b2', 0, 0, 1, snap_frac=0.1),
        Value('0-10', 'test.sliders.b3', 0, 0, 10, snap_frac=0.1),
        Value('0-100', 'test.sliders.b4', 0, 0, 100, snap_frac=0.1),
        Value('0-1000', 'test.sliders.b5', 0, 0, 1000, snap_frac=0.1),
    ]),
    Expander('Int', '', True, [
        Value('0-0.1', 'test.sliders.a1', 0, 0, 0.1, snap_frac=1),
        Value('0-1', 'test.sliders.a2', 0, 0, 1, snap_frac=1),
        Value('0-10', 'test.sliders.a3', 0, 0, 10, snap_frac=1),
        Value('0-100', 'test.sliders.a4', 0, 0, 100, snap_frac=1),
        Value('0-1000', 'test.sliders.a5', 0, 0, 1000, snap_frac=1),
    ]),
    Expander('Step 0.1', '', True, [
        Value('0-0.1', 'test.sliders.c1', 0, 0, 0.1, snap_frac=10),
        Value('0-1', 'test.sliders.c2', 0, 0, 1, snap_frac=10),
        Value('0-10', 'test.sliders.c3', 0, 0, 10, snap_frac=10),
        Value('0-100', 'test.sliders.c4', 0, 0, 100, snap_frac=10),
        Value('0-1000', 'test.sliders.c5', 0, 0, 1000, snap_frac=10),
    ]),
    Expander('Step 0.01', '', True, [
        Value('0-0.1', 'test.sliders.d1', 0, 0, 0.1, snap_frac=100),
        Value('0-1', 'test.sliders.d2', 0, 0, 1, snap_frac=100),
        Value('0-10', 'test.sliders.d3', 0, 0, 10, snap_frac=100),
        Value('0-100', 'test.sliders.d4', 0, 0, 100, snap_frac=100),
        Value('0-1000', 'test.sliders.d5', 0, 0, 1000, snap_frac=100),
    ]),
])"""


################################
#    Generate lists & save     #
################################

element_list = [""]*10 # element data, initalised with empty items as a fail safe
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

save_list('src/UI/UI_data.txt', element_list)
save_list('src/UI/UI_data_panels.txt', panel_lookup)

# split tuples into separate lists:
save_list('src/UI/UI_data_element_id.txt', [l[0] for l in element_lookup])
save_list('src/UI/UI_data_element_index.txt', [l[1] for l in element_lookup])

print(f'saved {len(element_list)} items')
