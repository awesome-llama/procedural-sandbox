import os
import post_processing


ROOT_DIR = ''
PATH_SOURCE_PROJECT = os.path.join(ROOT_DIR, 'Procedural Sandbox goboscript.sb3')
PATH_TARGET_PROJECT = os.path.join(ROOT_DIR, 'Procedural Sandbox.sb3')



with post_processing.ScratchProject(PATH_SOURCE_PROJECT, PATH_TARGET_PROJECT) as project:
    project.order_sprites(['_', 'main', 'stage_size', 'UI', 'transform_canvas', 'generator', 'compositor', 'renderer', 'overlay', 'TextImage', 'export_3D', 'project_settings', 'cmd', 'debug'])
    project.clean_up_blocks()
    project.remove_field_text()
    project.move_turbowarp_comment()

    
    # Fix the costume sizes

    def get_costume(target_name, costume_name) -> dict:
        target = post_processing.get_target_by_name(project.project_data, target_name)
        if target is None: raise Exception('Failed to find target name')
        costume = post_processing.get_costume_by_name(target, costume_name)
        if costume is None: raise Exception('Failed to find costume name')
        return costume


    # backdrop checker
    costume = get_costume('Stage', 'darkchecker')
    costume['bitmapResolution'] = 1
    # for some reason, not setting these lets the backdrop work for Scratch *and* TurboWarp custom resolution. I don't understand it.
    if 'rotationCenterX' in costume: costume.pop('rotationCenterX')
    if 'rotationCenterY' in costume: costume.pop('rotationCenterY')

    # stage size finder
    costume = get_costume('stage_size', 'probe')
    costume['bitmapResolution'] = 2
    costume['rotationCenterX'] = 2
    costume['rotationCenterY'] = 0

    # mouse position finder
    costume = get_costume('UI', 'mouse detect')
    costume['rotationCenterX'] = 240
    costume['rotationCenterY'] = 180

    # thumbnail (960x720)
    costume = get_costume('_', 'awesome-llama')
    costume['bitmapResolution'] = 2
    costume['rotationCenterX'] = 480
    costume['rotationCenterY'] = 360



    # Add the monitors

    def add_list_monitor(name: str):
        monitor = post_processing.get_monitor_by_id(project.project_data, name)
        if monitor is None:
            monitor_data = {
                "id": name,
                "mode": "list",
                "opcode": "data_listcontents",
                "params": {"LIST": name},
                "spriteName": None,
                "value": [],
                "width": 400,
                "height": 230,
                "x": 40,
                "y": 60,
                "visible": False
            }
            project.project_data['monitors'].append(monitor_data)
        else:
            raise Exception('monitor already exists')

    add_list_monitor('copy_this')
    add_list_monitor('output')


    project.add_build_comment('Procedural Sandbox\nCreated by awesome-llama\nhttps://scratch.mit.edu/projects/62182952\nhttps://github.com/awesome-llama/procedural-sandbox')


