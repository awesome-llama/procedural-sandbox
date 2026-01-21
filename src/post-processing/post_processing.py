import json
import random
import zipfile
import subprocess
import datetime
import sys

import clean_up_blocks

random.seed(0)


def serialize_project_json(project, indent=None):
    return json.dumps(project, ensure_ascii=False, indent=indent, separators=(',', ':'))


def random_id(prefix='', avoid=None):
    if not isinstance(avoid, (dict, set, list)): avoid = {}
    for _ in range(100):
        temp = str(prefix) + "".join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=12))
        if temp not in avoid: return temp
    raise Exception('no vacant ids')


def get_costume_by_name(target: dict, name: str) -> dict | None:
    for costume in target.get('costumes', []):
        if costume.get('name') == name:
            return costume
    return None # no costume found


def get_target_by_name(project: dict, name: str) -> dict | None:
    for target in project.get('targets', []):
        if target.get('name') == name:
            return target
    return None # no target found


def get_monitor_by_id(project: dict, monitor_id: str) -> dict | None:
    for monitor in project.get('monitors', []):
        if monitor.get('id') == monitor_id:
            return monitor
    return None # no monitor found


def get_comment_by_id(target: dict, comment_id: str) -> dict | None:
    if 'comments' not in target:
        return None
    return target['comments'].get(comment_id, None)




class ScratchProject:
    """An opened Scratch 3 project"""

    def __init__(self, source_path='project.sb3', destination_path='project.sb3') -> None:
        if source_path == destination_path: raise Exception('Paths are identical')
        self.source_path = source_path
        self.destination_path = destination_path
        self.project_archive = zipfile.ZipFile(source_path, 'r')
        self.project_data: dict = json.loads(self.project_archive.read('project.json'))


    def __enter__(self):
        return self


    def __exit__(self, exc_type, exc_value, traceback):

        # Save the project in a new zip file
        with zipfile.ZipFile(self.destination_path, 'w') as new_archive:
            for item in self.project_archive.infolist():
                if item.filename == 'project.json':
                    # Substitute project.json with updated version
                    json_data = serialize_project_json(self.project_data)
                    new_archive.writestr('project.json', json_data, zipfile.ZIP_DEFLATED)
                else:
                    # Copy other files as-is
                    file_data = self.project_archive.read(item.filename)
                    new_archive.writestr(item, file_data)

        self.project_archive.close()
        print(f'saved to {self.destination_path}')



    def order_sprites(self, order=['_', 'main', 'cmd']):
        """Order the sprites following a list of sprite names. Sprites not in the list will be placed at the end."""

        def get_layer_number(target: dict):
            if target['name'] == 'Stage':
                return 0
            if target['name'] in order:
                return 1 + order.index(target['name'])
            print(f"unknown layer name: {target['name']}")
            return 1000 # no order given, rank it last

        # order sprites in the editor list
        self.project_data['targets'].sort(key=get_layer_number)

        # set sprite layer order (the layer as controlled by blocks)
        for i, tgt in enumerate(self.project_data['targets']):
            if tgt['name'] != 'Stage':
                tgt['layerOrder'] = i



    def clean_up_blocks(self):
        """Move the blocks in all the sprites so they don't overlap."""

        for target in self.project_data['targets']:
            clean_up_blocks.clean_target(target)



    def remove_field_text(self):
        """Remove unnecessary strings in some fields"""
        fields_updated_count = 0
        for target in self.project_data['targets']:
            for block in target['blocks'].values():
                for field in block.get('fields', {}).values():
                    if isinstance(field, list) and field[0] == 'make gh issue if this bothers u':
                        field[0] = ''
                        fields_updated_count += 1
        print(f'fields updated: {fields_updated_count}')



    def move_turbowarp_comment(self, x=420, y=0):
        """Move the TurboWarp config comment"""

        target = get_target_by_name(self.project_data, 'Stage')
        if not target: raise Exception('Target not found')

        twconfig_comment = get_comment_by_id(target, 'twconfig')
        if not twconfig_comment: raise Exception('Comment not found')

        twconfig_comment['x'] = x
        twconfig_comment['y'] = y
        twconfig_comment['width'] = 560
        twconfig_comment['height'] = 200



    def add_comment_to_target(self, target: dict, text, x=0, y=0, width=200, height=200, minimized=False, blockId=None):
        """Add a comment to a target"""

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




    def add_build_comment(self, header:str|None = None, sprite_name='_'):
        """Add an informative comment to a sprite"""

        target = get_target_by_name(self.project_data, sprite_name)
        if not target: raise Exception('Target not found')

        try:
            gs_ver = self.project_data['meta']['agent'].removeprefix('goboscript v')
        except:
            gs_ver = '?'

        try:
            git_hash = str(subprocess.check_output(["git", "describe", "--always"]).strip(), encoding='utf-8')
        except:
            git_hash = '?'

        if header: header += '\n======' # separator

        comment_text = "\n".join([
            str(header),
            f'build_date: {datetime.datetime.now(datetime.timezone.utc)}',
            f'approx_json_size: {round(len(serialize_project_json(self.project_data))/1000)/1000} MB',
            f'goboscript_version: {gs_ver}',
            f'python_version: {sys.version_info.major}.{sys.version_info.minor}',
            f'git_hash: {git_hash}',
        ])
        
        self.add_comment_to_target(target, comment_text, x=500, width=500, height=600)
        print(comment_text)
