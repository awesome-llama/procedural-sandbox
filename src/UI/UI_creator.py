"""Create the lists for the modular UI"""

from elements import *

################################

panels:dict[str,Container] = {}


def title(text:str):
    """Create a title label with title color."""
    return Label(text, "#FF8CFF")


def canvas_size(label, id:str, value:ScratchNum=64, soft_max:ScratchNum|None=None):
    """Create a value representing a canvas dimension. Always `>= 0`."""
    if soft_max is None: soft_max = 512
    return Value(label, id, value, 1, soft_max, hard_min=0, hard_max=4096, snap_frac=1)



################################
#      High-speed access       #
################################

panels['popup.color_picker'] = Container([
    title('Color picker'),
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
    
    Button.broadcast('Cancel', 'popup.color_picker.cancel'),
    End(),
    Button.broadcast('Apply', 'popup.color_picker.apply'),
    End(),
])



################################
#             Tabs             #
################################

def btn_menu_set_page(label, page):
    return Button.set_page(label, 'menu.'+page, page)

panels['menu.io'] = Container([
    title('Import/export'),
    #Separator(),
    #btn_menu_set_page('New canvas', 'io.new_canvas'),
    Separator(0, 5),
    btn_menu_set_page('Save canvas', 'io.save_canvas'),
    Button.broadcast('Load canvas', 'io.load_canvas.run'), # run button, no page
    Separator(0, 5),
    Button.broadcast('Export displayed canvas', 'io.export_rendered_canvas.run'), # run button, no page
    
    Separator(0, 5),

    Label('Textures', '#baaaba'),
    btn_menu_set_page('Import height map', 'io.import_height_map'),
    btn_menu_set_page('Import color map', 'io.import_color_map'),
    Separator(0, 5),
    btn_menu_set_page('Export height map', 'io.export_height_map'),
    
    Separator(0, 5),

    Label('3D models', '#baaaba'),
    btn_menu_set_page('Export .ply point cloud', 'io.export_ply_point_cloud'),
    btn_menu_set_page('Export .obj surfaces', 'io.export_obj_surface'),
])

panels['menu.gen'] = Container([
    title('Generate'),
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
    title('Effects'),
    Separator(),
    btn_menu_set_page('Translate', 'fx.translate'),
    btn_menu_set_page('Rotate', 'fx.rotate'),
    btn_menu_set_page('Scale', 'fx.scale'),
    btn_menu_set_page('Mirror', 'fx.mirror'),
    btn_menu_set_page('Repeated symmetry', 'fx.repeated_symmetry'),
    Separator(0, 5),
    btn_menu_set_page('Crop XY', 'fx.crop_xy'),
    Separator(0, 5),
    btn_menu_set_page('Recolor', 'fx.misc_recolor'),
    btn_menu_set_page('Gradient recolor', 'fx.gradient_recolor'),
    Separator(0, 5),
    btn_menu_set_page('Jitter', 'fx.jitter'),
    btn_menu_set_page('Smudge', 'fx.smudge'),
    Separator(0, 5),
    btn_menu_set_page('Reshape', 'fx.reshape_canvas'),
])

panels['menu.settings'] = Container([
    title('Settings'),
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
    title('New empty canvas'),
    Separator(),
    Expander('Dimensions', '', True, [
        canvas_size('Size X', 'io.new_canvas.size_x', 64),
        canvas_size('Size Y', 'io.new_canvas.size_y', 64),
        canvas_size('Size Z', 'io.new_canvas.size_z', 16, 64),
    ]),
    Expander('Base layer', '', True, [
        Checkbox('Include base layer', 'io.new_canvas.include_base', False),
        Color('Base color', 'io.new_canvas.base_col', '#808080'),
    ]),
    Button.broadcast('Create new canvas', 'io.new_canvas.run'),
])

panels['io.save_canvas'] = Container([
    title('Save canvas'),
    Separator(),
    TextBlock('Save all canvas data, quantized to 8-bit.'),
    Expander('Layers', '', True, [
        Checkbox('Include opacity (alpha)', 'io.save_canvas.include_opacity', True),
        Checkbox('Include emission', 'io.save_canvas.include_emission', True),
    ]),
    Button.broadcast('Save', 'io.save_canvas.run'),
])

panels['io.import_height_map'] = Container([
    title('Import height map'),
    Separator(),
    Expander('Canvas', '', True, [
        Checkbox('Erase canvas', 'io.import_height_map.erase_canvas', True),
        canvas_size('New size Z', 'io.import_height_map.size_z', 16, 64),
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
    Button.broadcast('Input height map', 'io.import_height_map.run'),
])

panels['io.import_color_map'] = Container([
    title('Import color map'),
    Separator(),
    TextBlock('Replaces voxel colors only. Does not affect opacity.'),
    Expander('Settings', '', True, [
        Checkbox('Resize canvas if needed', 'io.import_color_map.resize_canvas', True),
        Checkbox('Interpret as linear', 'io.import_color_map.interpret_linear', False),
    ]),
    Button.broadcast('Input color map', 'io.import_color_map.run'),
])

panels['io.export_height_map'] = Container([
    title('Export height map'),
    Separator(),
    Expander('Map normalised heights', '', True, [
        Value('Map 0 to value', 'io.export_height_map.map_0', 0, -2, 2, snap_frac=1000),
        Value('Map 1 to value', 'io.export_height_map.map_1', 1, -2, 2, snap_frac=1000),
    ]),
    Button.broadcast('Export height map', 'io.export_height_map.run'),
])

panels['io.export_ply_point_cloud'] = Container([
    title('Export point cloud'),
    Separator(),
    Expander('Settings', '', True, [
        Checkbox('Include 0 opacity voxels', 'io.export_ply_point_cloud.include_air', False),
        Separator(),
        Checkbox('Create data URL', 'io.export_ply_point_cloud.create_data_url', True),
    ]),
    Button.broadcast('Export', 'io.export_ply_point_cloud.run'),
])

panels['io.export_obj_surface'] = Container([
    title('Export mesh surface'),
    Separator(),
    Expander('Settings', '', True, [
        Checkbox('Include canvas sides', 'io.export_obj_surface.include_canvas_sides', True),
        Checkbox('Right-handed Z-up', 'io.export_obj_surface.right_handed_z_up', True),
        Separator(),
        Checkbox('Create data URL', 'io.export_obj_surface.create_data_url', True),
    ]),
    Button.broadcast('Export', 'io.export_obj_surface.run'),
])

################################
#             Gen              #
################################

panels['gen.fibres'] = Container([
    title('Generate fibres'),
    Separator(),
    Expander('Canvas', '', True, [
        canvas_size('Size X', 'gen.fibres.size_x', 64),
        canvas_size('Size Y', 'gen.fibres.size_y', 64),
        canvas_size('Size Z', 'gen.fibres.size_z', 4, 64),
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
    Button.broadcast('Generate', 'gen.fibres.run'),
])

panels['gen.ballpit'] = Container([
    title('Generate ball pit'),
    Separator(),
    Expander('Canvas', '', True, [
        canvas_size('Size X', 'gen.ballpit.size_x', 64),
        canvas_size('Size Y', 'gen.ballpit.size_y', 64),
        canvas_size('Size Z', 'gen.ballpit.size_z', 16, 64),
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
    Button.broadcast('Generate', 'gen.ballpit.run'),
])

panels['gen.pcb'] = Container([
    title('Generate PCB'),
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
    Button.broadcast('Generate', 'gen.pcb.run'),
])

panels['gen.city'] = Container([
    title('Generate city'),
    Separator(),
    Expander('Canvas', '', True, [
        canvas_size('Size X', 'gen.city.size_x', 64),
        canvas_size('Size Y', 'gen.city.size_y', 64),
        Value('Size Z', 'gen.city.size_z', 16, 8, 32, 4, 256, snap_frac=1),
    ]),
    Expander('Form', '', True, [
        Value('Buildings', 'gen.city.buildings', 1, 0, 2, 0, 1000),
        Value('Sky bridges', 'gen.city.bridges', 1, 0, 2, 0, 1000),
        Value('Glow', 'gen.city.glow', 1, 0, 2, 0, 1000),
    ]),
    Button.broadcast('Generate', 'gen.city.run'),
])

panels['gen.control_panel'] = Container([
    title('Generate control panel'),
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
    Button.broadcast('Generate', 'gen.control_panel.run'),
])

panels['gen.eca'] = Container([
    title('Elementary cellular automata'),
    Separator(),
    Expander('Canvas', '', True, [
        canvas_size('Size X', 'gen.eca.size_x', 64),
        canvas_size('Size Y', 'gen.eca.size_y', 64),
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
    Button.broadcast('Generate', 'gen.eca.run'),
])

panels['gen.terrain'] = Container([
    title('Terrain'),
    Separator(),
    Expander('Dimensions', '', True, [
        canvas_size('Size X', 'gen.terrain.size_x', 64),
        canvas_size('Size Y', 'gen.terrain.size_y', 64),
        canvas_size('Size Z', 'gen.terrain.size_z', 16, 64),
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
    Button.broadcast('Run', 'gen.terrain.run'),
])

panels['gen.extruded_grid'] = Container([ # "I call them cities"
    title('Generate extruded grid'),
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
    Button.broadcast('Generate', 'gen.extruded_grid.run'),
])

panels['gen.hedge'] = Container([
    title('Generate hedge'),
    Separator(),
    Expander('Dimensions', '', True, [
        canvas_size('Size X', 'gen.hedge.size_x', 64),
        canvas_size('Size Y', 'gen.hedge.size_y', 64),
        canvas_size('Size Z', 'gen.hedge.size_z', 4, 16),
        Value('Leaf density', 'gen.hedge.leaf_density', 2, 0, 4, 0, 64, snap_frac=100),
        Value('Leaf size', 'gen.hedge.leaf_size', 3, 1, 16, 1, 256, snap_frac=10),
    ]),
    Expander('Color', '', True, [
        Color('Color 1', 'gen.hedge.col1', "#2E4934"),
        Color('Color 2', 'gen.hedge.col2', "#2F6517"),
        Color('Color 3', 'gen.hedge.col3', "#7C9C41"),
    ]),
    Button.broadcast('Generate', 'gen.hedge.run'),
])

panels['gen.maze'] = Container([
    title('Generate maze'),
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
    Button.broadcast('Generate', 'gen.maze.run'),
])

panels['gen.nucleus'] = Container([
    title('Generate "Nucleus"'),
    Separator(),
    Expander('Dimensions', '', True, [
        Value('Radius', 'gen.nucleus.radius', 32, 1, 128, 0, 4096, snap_frac=1),
        canvas_size('Size Z', 'gen.nucleus.size_z', 16, 64),
    ]),
    Expander('Shape', '', True, [
        Value('Rings', 'gen.nucleus.rings', 1, 0, 2, 0, 16),
        Value('Rays', 'gen.nucleus.rays', 1, 0, 2, 0, 16),
        Value('Cuboids', 'gen.nucleus.cuboids', 1, 0, 2, 0, 16),
    ]),
    Expander('Color', '', True, [
        Value('Glow', 'gen.nucleus.glow', 0.5, 0, 2, 0, 16),
    ]),
    Button.broadcast('Generate', 'gen.nucleus.run'),
])

# https://en.wikipedia.org/wiki/Value_noise
panels['gen.value_noise'] = Container([
    title('Value noise (2D)'),
    Separator(),
    Expander('Dimensions', '', True, [
        canvas_size('Size X', 'gen.value_noise.size_x', 64),
        canvas_size('Size Y', 'gen.value_noise.size_y', 64),
    ]),
    Expander('Shape', '', True, [
        Value('Scale', 'gen.value_noise.scale', 16, 1, 64, 0, 4096, snap_frac=1),
        Value('Max. octaves', 'gen.value_noise.octaves', 5, 1, 8, 0, 64, snap_frac=1),
    ]),
    Button.broadcast('Generate', 'gen.value_noise.run'),
])

panels['gen.sphere'] = Container([
    title('Sphere'),
    Separator(),
    Expander('Canvas', '', True, [
        Value('Canvas radius', 'gen.sphere.canvas_size', 16, 1, 256, 0, 4096, snap_frac=1),
        Checkbox('Include ground', 'gen.sphere.include_ground', True),
        Color('Ground color', 'gen.sphere.ground_col', '#aaaaaa'),
    ]),
    Expander('Sphere', '', True, [
        canvas_size('Radius', 'gen.sphere.sphere_radius', 4),
        Color('Color', 'gen.sphere.sphere_color', '#00ff00'),
        Value.fraction('Emission', 'gen.sphere.sphere_emission', 0),
    ]),
    Button.broadcast('Generate', 'gen.sphere.run'),
])

panels['gen.lang'] = Container([
    title('Custom script'),
    Separator(),
    TextBlock('This project supports a purpose-built low-level programming language. Documentation available on GitHub.'),
    Expander('Settings', '', True, [
        Checkbox('Always show run output', 'gen.lang.show_output_list', False),
    ]),
    Button.broadcast('Input code', 'gen.lang.input_code'),
    Button.broadcast('Run', 'gen.lang.run'),
])


################################
#              FX              #
################################

panels['fx.translate'] = Container([
    title('Translate canvas'),
    Separator(),
    Expander('Translation vector', '', True, [
        Value('X', 'fx.translate.dx', 0, -512, 512, -4096, 4096, snap_frac=1),
        Value('Y', 'fx.translate.dy', 0, -512, 512, -4096, 4096, snap_frac=1),
        Value('Z', 'fx.translate.dz', 0, -512, 512, -4096, 4096, snap_frac=1),
        Separator(0),
        Button.broadcast('Set to 0', 'fx.translate.set_0'),
        Button.broadcast('Set half canvas x,y', 'fx.translate.set_half_canvas_xy'),
    ]),
    Button.broadcast('Run', 'fx.translate.run'),
])

panels['fx.scale'] = Container([
    title('Scale canvas'),
    Separator(),
    Expander('Scale vector', '', True, [
        Value('X', 'fx.scale.dx', 1, 0.25, 4, -4096, 4096, snap_frac=1000),
        Value('Y', 'fx.scale.dy', 1, 0.25, 4, -4096, 4096, snap_frac=1000),
        Value('Z', 'fx.scale.dz', 1, 0.25, 4, -4096, 4096, snap_frac=1000),
        Separator(0),
        Button.broadcast('Set to 0.5', 'fx.scale.set_x0.5'),
        Button.broadcast('Set to 1', 'fx.scale.set_x1'),
        Button.broadcast('Set to 2', 'fx.scale.set_x2'),
    ]),
    Button.broadcast('Run', 'fx.scale.run'),
])

panels['fx.rotate'] = Container([
    title('Rotate canvas XY'),
    Separator(),
    Button.broadcast('Rotate +90 (CCW)', 'fx.rotate.rotate_+90'),
    Button.broadcast('Rotate -90 (CW)', 'fx.rotate.rotate_-90'),
    Separator(0),
    Expander('Advanced', '', False, [
        Value('Angle (CCW)', 'fx.rotate.angle', 0, -180, 180),
        Separator(0),
        Value('Origin X', 'fx.rotate.ox', 0, -256, 256, -4096, 4096),
        Value('Origin Y', 'fx.rotate.oy', 0, -256, 256, -4096, 4096),
        Button.broadcast('Set origin to 0,0', 'fx.rotate.set_origin_0'),
        Button.broadcast('Set origin to center', 'fx.rotate.set_origin_center'),
        Separator(0),
        Button.broadcast('Rotate', 'fx.rotate.run'),
    ]),
])

panels['fx.mirror'] = Container([
    title('Mirror'),
    Separator(),
    Expander('Flip (nondestructive)', '', True, [
        Button.broadcast('Flip X', 'fx.mirror.flip_x'),
        Button.broadcast('Flip Y', 'fx.mirror.flip_y'),
    ]),
    Expander('Mirror (destructive)', '', True, [
        Button.broadcast('Mirror X', 'fx.mirror.mirror_x'),
        Button.broadcast('Mirror Y', 'fx.mirror.mirror_y'),
    ]),
])

panels['fx.repeated_symmetry'] = Container([
    title('Repeated symmetry'),
    Separator(),
    TextBlock('Randomly translate and mirror the canvas, often resulting in panel-like shapes.'),
    Expander('Settings', '', True, [
        Value('Steps', 'fx.repeated_symmetry.steps', 3, 1, 20, 1, snap_frac=1),
        Value.fraction('X:Y bias', 'fx.repeated_symmetry.xy_bias', 0.5),
    ]),
    Button.broadcast('Run', 'fx.repeated_symmetry.run'),
])

panels['fx.crop_xy'] = Container([
    title('Crop XY'),
    Separator(),
    Expander('Dimensions', '', True, [
        canvas_size('Size X', 'fx.crop_xy.size_x', 64),
        canvas_size('Size Y', 'fx.crop_xy.size_y', 64),
        Checkbox('Centered', 'fx.crop_xy.centered', True),
    ]),
    Button.broadcast('Crop', 'fx.crop_xy.run'),
])

panels['fx.misc_recolor'] = Container([
    title('Recolor'),
    Separator(),
    Expander('Change HSV', '', True, [
        Value('Hue', 'fx.misc_recolor.hue', 0, -1, 1, snap_frac=1000),
        Value('Sat', 'fx.misc_recolor.sat', 0, -1, 1, -1, 'Infinity', snap_frac=1000),
        Value('Val', 'fx.misc_recolor.val', 0, -1, 1, snap_frac=1000),
        Separator(0),
        Button.broadcast('Run', 'fx.misc_recolor.change_hsv'),
    ]),
    Expander('Gamma', '', True, [
        Value('Exponent', 'fx.misc_recolor.gamma_exp', 1, 0.5, 4, snap_frac=1000),
        Separator(0),
        Button.broadcast('Run', 'fx.misc_recolor.set_gamma'),
    ]),
    Expander('Quantize HSV', '', True, [
        Value('Hue', 'fx.misc_recolor.hue_steps', 6, 0, 64, 0, 'Infinity', snap_frac=1),
        Value('Sat', 'fx.misc_recolor.sat_steps', 0, 0, 64, 0, 'Infinity', snap_frac=1),
        Value('Val', 'fx.misc_recolor.val_steps', 0, 0, 64, 0, 'Infinity', snap_frac=1),
        TextBlock('Set to 0 to disable.'),
        Separator(0),
        Button.broadcast('Run', 'fx.misc_recolor.quantize_hsv'),
    ]),
])

panels['fx.gradient_recolor'] = Container([
    title('Gradient recolor'),
    Separator(),
    Expander('Channel weights', '', False, [
        Value('Red', 'fx.gradient_recolor.weight_r', 0.25, 0, 1, snap_frac=1000),
        Value('Green', 'fx.gradient_recolor.weight_g', 0.5, 0, 1, snap_frac=1000),
        Value('Blue', 'fx.gradient_recolor.weight_b', 0.25, 0, 1, snap_frac=1000),
        TextBlock('All usually should add to 1'),
    ]),
    Expander('Input range', '', True, [
        Value('Map 0 to value', 'fx.gradient_recolor.map_0', 0, -2, 2, snap_frac=1000),
        Value('Map 1 to value', 'fx.gradient_recolor.map_1', 1, -2, 2, snap_frac=1000),
    ]),
    Expander('Output colors', '', True, [
        Color('Val 0 to color', 'fx.gradient_recolor.col_0', '#000000'),
        Color('Val 1 to color', 'fx.gradient_recolor.col_1', '#ffffff'),
    ]),
    Checkbox('Interpolate in sRGB', 'fx.gradient_recolor.use_sRGB', True),
    Separator(0),
    Button.broadcast('Run', 'fx.gradient_recolor.run'),
])

panels['fx.jitter'] = Container([
    title('Jitter'),
    Separator(),
    TextBlock('Randomly translate voxels'),
    Expander('Settings', '', True, [
        Value('Coverage', 'fx.jitter.coverage', 0.1, 0, 0.2, 0, 1, snap_frac=1000),
        Value.fraction('Probability Z', 'fx.jitter.probability_z', 0),
    ]),
    Button.broadcast('Run', 'fx.jitter.run'),
])

panels['fx.smudge'] = Container([
    title('Smudge'),
    Separator(),
    TextBlock('Randomly blend adjacent voxel color.'),
    Expander('Settings', '', True, [
        Value('Coverage', 'fx.smudge.coverage', 0.1, 0, 0.2, 0, 1, snap_frac=1000),
        Value.fraction('Probability Z', 'fx.smudge.probability_z', 0.333),
    ]),
    Button.broadcast('Run', 'fx.smudge.run'),
])

panels['fx.reshape_canvas'] = Container([
    title('Reshape canvas'),
    Separator(),
    TextBlock('Nondestructive adjustment of canvas dimensions. Voxel order is maintained and reversible.'),
    Expander('Dimensions', '', True, [
        Button.broadcast('Get current dimensions', 'fx.reshape_canvas.get_current_dimensions'),
        canvas_size('Size X', 'fx.reshape_canvas.size_x', ''),
        canvas_size('Size Y', 'fx.reshape_canvas.size_y', ''),
        canvas_size('Size Z', 'fx.reshape_canvas.size_z', ''),
    ]),
    Expander('Dangerous', '', False, [
        Checkbox('Allow any size', 'fx.reshape_canvas.any_size', False),
        TextBlock('Allow for dimensions that result in a canvas unequal to the actual number of stored voxels.'),
    ]),
    Button.broadcast('Set dimensions', 'fx.reshape_canvas.run'),
])

################################
#           Settings           #
################################

panels['settings.misc'] = Container([
    title('Miscellaneous'),
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
    Button.broadcast('Apply changes', 'settings.misc.apply', 'settings.apply'),
])

panels['settings.pathtracer'] = Container([
    title('Pathtracer'),
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
            Button.command('Off', 'settings.sky_preset1', 'element settings.sky_intensity 3 0;element settings.sun_intensity 3 0;broadcast settings.apply;'),
            Button.command('Dark', 'settings.sky_preset2', 'element settings.sky_intensity 3 0.2;element settings.sun_intensity 3 0;broadcast settings.apply;'),
            Button.command('Default', 'settings.sky_preset3', 'element settings.sky_intensity 3 0.8;element settings.sun_intensity 3 2;broadcast settings.apply;'),
            Button.command('Bright', 'settings.sky_preset4', 'element settings.sky_intensity 3 1;element settings.sun_intensity 3 10;broadcast settings.apply;'),
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
    Button.broadcast('Apply changes', 'settings.pathtracer.apply', 'settings.apply'),
])

panels['settings.normal_map'] = Container([
    title('Normal map'),
    Separator(),
    TextBlock('Applies to the "normal map" mode in 2D only.'),
    Expander('Sampling', '', True, [
        Value('Intensity', 'settings.normal_map_intensity', 1, 0, 2, snap_frac=1000),
        Value('Kernel size', 'settings.normal_map_kernel_size', 2, 2, 3, 2, 3, snap_frac=1),
    ]),
    Separator(0),
    Button.broadcast('Apply changes', 'settings.normal_map.apply', 'settings.apply'),
])

panels['settings.tips'] = Container([
    title('Tips'),
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
    title('Credits'),
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
    Button.command('1. Color', 'project.compositor_mode.1', 'compositor COLOR'),
    Button.command('2. Shaded', 'project.compositor_mode.2', 'compositor SHADED'),
    Button.command('3. Pathtraced', 'project.compositor_mode.3', 'compositor PATHTRACED'),
    Button.command('4. Height', 'project.compositor_mode.4', 'compositor HEIGHT'),
    Button.command('5. AO', 'project.compositor_mode.5', 'compositor AO'),
    Button.command('6. Normal', 'project.compositor_mode.6', 'compositor NORMAL'),
])


################################
#    Generate lists & save     #
################################

save_elements(panels, "src/UI/")
