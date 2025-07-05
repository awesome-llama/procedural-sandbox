import zipfile
import json
import datetime
import os
import sys
import subprocess

import utils
import clean_up_blocks


ROOT_DIR = ''
PATH_SOURCE_PROJECT = os.path.join(ROOT_DIR, 'Procedural Sandbox goboscript.sb3')
PATH_TARGET_JSON = os.path.join(ROOT_DIR, 'project.json')
PATH_TARGET_PROJECT = os.path.join(ROOT_DIR, 'Procedural Sandbox.sb3')


project_archive = zipfile.ZipFile(PATH_SOURCE_PROJECT, 'r')
project_data: dict = json.loads(project_archive.read('project.json'))


# reorder the sprites

SPRITE_ORDER = ['Stage', '_', 'main', 'stage_size', 'UI', 'transform_canvas', 'generator', 'compositor', 'renderer', 'overlay', 'TextImage', 'export_3D', 'project_settings', 'cmd', 'debug']

def get_layer_number(target: dict):
    if target['name'] in SPRITE_ORDER:
        return SPRITE_ORDER.index(target['name'])
    print(f"unknown layer name: {target['name']}")
    return 1000 # no order given, rank it last

project_data['targets'].sort(key=get_layer_number)

for i, tgt in enumerate(project_data['targets']):
    tgt['layerOrder'] = i # update layerOrder to reflect new list order



# fix the costume sizes

# stage size finder
target = utils.get_target_by_name(project_data, 'stage_size')
costume = utils.get_costume_by_name(target, 'probe')
costume['bitmapResolution'] = 2
costume['rotationCenterX'] = 2
costume['rotationCenterY'] = 0

# mouse position finder
target = utils.get_target_by_name(project_data, 'UI')
costume = utils.get_costume_by_name(target, 'mouse detect')
costume['rotationCenterX'] = 240
costume['rotationCenterY'] = 180

# backdrop checker
target = utils.get_target_by_name(project_data, 'Stage')
costume = utils.get_costume_by_name(target, 'darkchecker')
costume['bitmapResolution'] = 1
# for some reason, not setting these lets the backdrop work for Scratch *and* TurboWarp custom resolution. I don't understand it.
if 'rotationCenterX' in costume: costume.pop('rotationCenterX')
if 'rotationCenterY' in costume: costume.pop('rotationCenterY')

# thumbnail (960x720)
target = utils.get_target_by_name(project_data, '_')
costume = utils.get_costume_by_name(target, 'awesome-llama')
costume['bitmapResolution'] = 2
costume['rotationCenterX'] = 480
costume['rotationCenterY'] = 360



# add the monitors

def add_list_monitor(name: str):
    monitor = utils.get_monitor_by_id(project_data, name)
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
        project_data['monitors'].append(monitor_data)
    else:
        raise Exception('monitor already exists')

add_list_monitor('copy_this')
add_list_monitor('output')



# move the blocks so they don't overlap

for target in project_data['targets']:
    clean_up_blocks.clean_target(target)



# remove field text

fields_updated_count = 0
for target in project_data['targets']:
    for block in target['blocks'].values():
        for field in block.get('fields', {}).values():
            if isinstance(field, list) and field[0] == 'make gh issue if this bothers u':
                field[0] = ''
                fields_updated_count += 1
print(f'fields updated: {fields_updated_count}')



# add a comment to the thumbnail containing project info

target = utils.get_target_by_name(project_data, '_')

try:
    gs_ver = project_data['meta']['agent'].removeprefix('goboscript v')
except:
    gs_ver = '?'

try:
    git_hash = str(subprocess.check_output(["git", "describe", "--always"]).strip(), encoding='utf-8')
    print(git_hash)
except:
    git_hash = '?'

utils.add_comment_to_target(target, "\n".join([
    'Procedural Sandbox',
    'Created by awesome-llama',
    'https://scratch.mit.edu/projects/62182952/',
    '',
    '======',
    f'build_date: {datetime.datetime.now(datetime.timezone.utc)}',
    f'approx_json_size: {round(len(utils.serialize_project_json(project_data))/1000)/1000} MB',
    f'gs_ver: {gs_ver}',
    f'py_ver: {sys.version_info.major}.{sys.version_info.minor}',
    f'git_hash: {git_hash}',
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
print(f'saved to {PATH_TARGET_PROJECT}')