import zipfile
import json
import datetime
import os
import sys

import utils
import clean_up_blocks


ROOT_DIR = ''
PATH_SOURCE_PROJECT = os.path.join(ROOT_DIR, 'Procedural Sandbox goboscript.sb3')
PATH_TARGET_JSON = os.path.join(ROOT_DIR, 'project.json')
PATH_TARGET_PROJECT = os.path.join(ROOT_DIR, 'Procedural Sandbox.sb3')


project_archive = zipfile.ZipFile(PATH_SOURCE_PROJECT, 'r')
project_data: dict = json.loads(project_archive.read('project.json'))


# reorder the sprites

SPRITE_ORDER = ['Stage', '_', 'main', 'stage_size', 'UI', 'transform_canvas', 'generator', 'compositor', 'renderer', 'TextImage', 'export_3D', 'cmd', 'debug']

def get_layer_number(target: dict):
    if target['name'] in SPRITE_ORDER:
        return SPRITE_ORDER.index(target['name'])
    return 1000 # no order given, move to the end

project_data['targets'].sort(key=get_layer_number)

for i, tgt in enumerate(project_data['targets']):
    tgt['layerOrder'] = i # update layerOrder to reflect new list order



# fix the stage size costume

target = utils.get_target_by_name(project_data, 'stage_size')
costume = utils.get_costume_by_name(target, 'probe')
costume['bitmapResolution'] = 2
costume['rotationCenterX'] = 2
costume['rotationCenterY'] = 0



# add the monitors

monitor = utils.get_monitor_by_id(project_data, 'copy_this')
if monitor is None:
    project_data['monitors'].append({
        "id": "copy_this",
        "mode": "list",
        "opcode": "data_listcontents",
        "params": {"LIST": "copy_this"},
        "spriteName": None,
        "value": [],
        "width": 400,
        "height": 230,
        "x": 40,
        "y": 60,
        "visible": False
    })



# move the blocks so they don't overlap

for target in project_data['targets']:
    clean_up_blocks.clean_target(target)



# remove field text

for target in project_data['targets']:
    for block in target['blocks'].values():
        for field in block.get('fields', {}).values():
            if isinstance(field, list) and field[0] == 'make gh issue if this bothers u':
                field[0] = ''



# add a comment to the thumbnail containing project info

target = utils.get_target_by_name(project_data, '_')

try:
    gs_ver = project_data['meta']['agent'].removeprefix('goboscript v')
except:
    gs_ver = '?'

utils.add_comment_to_target(target, "\n".join([
    'Procedural Sandbox',
    'Created by awesome-llama',
    '',
    '======',
    f'build_date: {datetime.datetime.now(datetime.timezone.utc)}',
    f'approx_json_size: {round(len(utils.serialize_project_json(project_data))/1000)/1000} MB',
    f'gs_ver: {gs_ver}',
    f'py_ver: {sys.version_info.major}.{sys.version_info.minor}',
]), x=500, width=500, height=600)



# save

#with open(PATH_TARGET_JSON, 'w', encoding='utf-8') as f:
#    f.write(serialize_project_json(project_data, indent=1))


with zipfile.ZipFile(PATH_TARGET_PROJECT, 'w') as new_archive:
    for item in project_archive.infolist():
        if item.filename == 'project.json':
            # Replace project.json with updated version
            json_data = utils.serialize_project_json(project_data)
            new_archive.writestr('project.json', json_data, zipfile.ZIP_DEFLATED)
        else:
            # Copy other files as-is
            file_data = project_archive.read(item.filename)
            new_archive.writestr(item, file_data)



project_archive.close()