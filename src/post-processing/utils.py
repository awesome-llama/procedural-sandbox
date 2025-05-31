import json
import random

random.seed(0)


def serialize_project_json(project, indent=None):
    return json.dumps(project, ensure_ascii=False, indent=indent, separators=(',', ':'))


def random_id(prefix='', avoid=None):
    if not isinstance(avoid, (dict, set, list)): avoid = {}
    for _ in range(100):
        temp = str(prefix) + "".join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=12))
        if temp not in avoid: return temp
    raise Exception('no vacant ids')


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


def get_monitor_by_id(project: dict, monitor_id: str):
    for monitor in project.get('monitors', []):
        if monitor.get('id') == monitor_id:
            return monitor
    return None # no monitor found


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
