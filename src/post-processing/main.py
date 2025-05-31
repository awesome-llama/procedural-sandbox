
import zipfile
import json
import random
import datetime
import os
import sys

random.seed(0)

ROOT_DIR = ''
PATH_SOURCE_PROJECT = os.path.join(ROOT_DIR, 'Procedural Sandbox goboscript.sb3')
PATH_TARGET_JSON = os.path.join(ROOT_DIR, 'project.json')
PATH_TARGET_PROJECT = os.path.join(ROOT_DIR, 'Procedural Sandbox.sb3')


project_archive = zipfile.ZipFile(PATH_SOURCE_PROJECT, 'r')
project_data: dict = json.loads(project_archive.read('project.json'))


def serialize_project_json(project, indent=None):
    return json.dumps(project, ensure_ascii=False, indent=indent, separators=(',', ':'))



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

def get_costume_by_name(target: dict, name: str):
    for costume in target.get('costumes', []):
        if costume.get('name') == name:
            return costume
    return None # no costume found

def get_target_by_name(project: dict, name: str):
    for target in project.get('targets', []):
        if target.get('name') == name:
            return target
    return None # no target found

target = get_target_by_name(project_data, 'stage_size')
costume = get_costume_by_name(target, 'probe')
costume['bitmapResolution'] = 2
costume['rotationCenterX'] = 2
costume['rotationCenterY'] = 0



# add the monitors

def get_monitor_by_id(project: dict, monitor_id: str):
    for monitor in project.get('monitors', []):
        if monitor.get('id') == monitor_id:
            return monitor
    return None # no monitor found

monitor = get_monitor_by_id(project_data, 'copy_this')
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



# add a comment to the thumbnail containing project info

def random_id(prefix='', avoid=None):
    if not isinstance(avoid, (dict, set, list)): avoid = {}
    for _ in range(100):
        temp = str(prefix) + "".join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=12))
        if temp not in avoid: return temp
    raise Exception('no vacant ids')

def add_comment_to_target(target: dict, text, x=0, y=0, width=200, height=200, minimized=False, blockId=None):
    if 'comments' not in target:
        target['comments'] = {}
    
    target['comments'][random_id()] = {
        'blockId': blockId,
        'x': x,
        'y': y,
        'width': width,
        'height': height,
        'minimized': minimized,
        'text': text,
    }

target = get_target_by_name(project_data, '_')

try:
    gs_ver = project_data['meta']['agent'].removeprefix('goboscript v')
except:
    gs_ver = '?'

add_comment_to_target(target, "\n".join([
    'Procedural Sandbox',
    'Created by awesome-llama',
    '',
    '======',
    f'build_date: {datetime.datetime.now(datetime.timezone.utc)}',
    f'approx_json_size: {round(len(serialize_project_json(project_data))/1000)/1000} MB',
    f'gs_ver: {gs_ver}',
    f'py_ver: {sys.version_info.major}.{sys.version_info.minor}',
]), x=300, width=500, height=600)



# save

#with open(PATH_TARGET_JSON, 'w', encoding='utf-8') as f:
#    f.write(serialize_project_json(project_data, indent=1))


with zipfile.ZipFile(PATH_TARGET_PROJECT, 'w') as new_archive:
    for item in project_archive.infolist():
        if item.filename == 'project.json':
            # Replace project.json with updated version
            json_data = serialize_project_json(project_data)
            new_archive.writestr('project.json', json_data, zipfile.ZIP_DEFLATED)
        else:
            # Copy other files as-is
            file_data = project_archive.read(item.filename)
            new_archive.writestr(item, file_data)



project_archive.close()